<?php

namespace Tests\Feature;

use App\Models\Banner;
use App\Models\Event;
use App\Models\Media;
use App\Models\User;
use App\Services\MediaService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class Phase3Test extends TestCase
{
    use RefreshDatabase;

    // ─── Helpers ────────────────────────────────────────────────────────────

    private function createEvent(array $overrides = []): Event
    {
        return Event::create(array_merge([
            'title'        => 'Test Event',
            'excerpt'      => 'A great event for testing',
            'start_at'     => now()->addMonth(),
            'end_at'       => now()->addMonth()->addHours(8),
            'country'      => 'Malaysia',
            'is_published' => true,
            'rsvp_enabled' => true,
        ], $overrides));
    }

    private function createAdmin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    // ═════════════════════════════════════════════════════════════════════════
    // 6.1 Homepage Carousel (Banners)
    // ═════════════════════════════════════════════════════════════════════════

    public function test_admin_can_view_banners_page(): void
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->get('/admin/banners');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('Admin/Banners/Index')
                ->has('banners')
        );
    }

    public function test_admin_can_create_banner(): void
    {
        Storage::fake('public');
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->post('/admin/banners', [
            'title'      => 'Welcome Banner',
            'image'      => UploadedFile::fake()->image('banner.jpg', 1200, 600),
            'link_url'   => 'https://example.com',
            'sort_order' => 1,
            'is_active'  => true,
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('banners', [
            'title'    => 'Welcome Banner',
            'link_url' => 'https://example.com',
            'is_active' => true,
        ]);
    }

    public function test_admin_can_update_banner(): void
    {
        Storage::fake('public');
        $admin = $this->createAdmin();

        $banner = Banner::create([
            'title'      => 'Old Banner',
            'image_path' => 'banners/old.jpg',
            'sort_order' => 1,
            'is_active'  => true,
        ]);

        $response = $this->actingAs($admin)->post("/admin/banners/{$banner->id}", [
            'title'      => 'Updated Banner',
            'sort_order' => 2,
            'is_active'  => false,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('banners', [
            'id'        => $banner->id,
            'title'     => 'Updated Banner',
            'sort_order' => 2,
            'is_active'  => false,
        ]);
    }

    public function test_admin_can_delete_banner(): void
    {
        Storage::fake('public');
        $admin = $this->createAdmin();

        $banner = Banner::create([
            'title'      => 'To Delete',
            'image_path' => 'banners/delete-me.jpg',
            'sort_order' => 1,
            'is_active'  => true,
        ]);

        $response = $this->actingAs($admin)->delete("/admin/banners/{$banner->id}");

        $response->assertRedirect();
        $response->assertSessionHas('success');
        $this->assertDatabaseMissing('banners', ['id' => $banner->id]);
    }

    public function test_banner_model_active_scope(): void
    {
        Banner::create(['title' => 'Active 1', 'image_path' => 'a.jpg', 'sort_order' => 2, 'is_active' => true]);
        Banner::create(['title' => 'Active 2', 'image_path' => 'b.jpg', 'sort_order' => 1, 'is_active' => true]);
        Banner::create(['title' => 'Inactive', 'image_path' => 'c.jpg', 'sort_order' => 0, 'is_active' => false]);

        $active = Banner::active()->get();

        $this->assertCount(2, $active);
        // Should be ordered by sort_order
        $this->assertEquals('Active 2', $active->first()->title);
        $this->assertEquals('Active 1', $active->last()->title);
    }

    public function test_banner_image_url_accessor(): void
    {
        $banner = Banner::create([
            'title'      => 'URL Test',
            'image_path' => 'banners/test.jpg',
            'sort_order' => 1,
            'is_active'  => true,
        ]);

        $this->assertStringContains('/storage/banners/test.jpg', $banner->image_url);
    }

    public function test_homepage_receives_banners(): void
    {
        Banner::create(['title' => 'Hero 1', 'image_path' => 'banners/1.jpg', 'sort_order' => 1, 'is_active' => true]);
        Banner::create(['title' => 'Hero 2', 'image_path' => 'banners/2.jpg', 'sort_order' => 2, 'is_active' => true]);

        $response = $this->get('/');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('Public/Home')
                ->has('banners', 2)
        );
    }

    public function test_homepage_excludes_inactive_banners(): void
    {
        Banner::create(['title' => 'Active',   'image_path' => 'a.jpg', 'sort_order' => 1, 'is_active' => true]);
        Banner::create(['title' => 'Inactive', 'image_path' => 'b.jpg', 'sort_order' => 2, 'is_active' => false]);

        $response = $this->get('/');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('Public/Home')
                ->has('banners', 1)
        );
    }

    public function test_banner_reorder(): void
    {
        $admin = $this->createAdmin();

        $b1 = Banner::create(['title' => 'A', 'image_path' => 'a.jpg', 'sort_order' => 0, 'is_active' => true]);
        $b2 = Banner::create(['title' => 'B', 'image_path' => 'b.jpg', 'sort_order' => 1, 'is_active' => true]);

        $response = $this->actingAs($admin)->post('/admin/banners/reorder', [
            'ids' => [$b2->id, $b1->id],
        ]);

        $response->assertRedirect();
        $this->assertEquals(0, $b2->fresh()->sort_order);
        $this->assertEquals(1, $b1->fresh()->sort_order);
    }

    // ═════════════════════════════════════════════════════════════════════════
    // 6.2 Image Standardisation
    // ═════════════════════════════════════════════════════════════════════════

    public function test_media_upload_rejects_small_images(): void
    {
        Storage::fake('public');
        $admin = $this->createAdmin();

        // 400px wide — below 800px minimum
        $file = UploadedFile::fake()->image('small.jpg', 400, 225);

        $response = $this->actingAs($admin)->postJson('/admin/media', [
            'file' => $file,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('file');
    }

    public function test_media_upload_accepts_large_images(): void
    {
        Storage::fake('public');
        $admin = $this->createAdmin();

        $file = UploadedFile::fake()->image('large.jpg', 1200, 675);

        $response = $this->actingAs($admin)->postJson('/admin/media', [
            'file' => $file,
        ]);

        $response->assertStatus(201);
        $response->assertJsonStructure([
            'media' => ['id', 'url', 'thumbnail_url'],
        ]);
    }

    public function test_media_service_generates_thumbnail(): void
    {
        Storage::fake('public');

        $file = UploadedFile::fake()->image('event-poster.jpg', 1200, 675);

        $service = new MediaService();
        $media = $service->upload($file);

        $this->assertNotNull($media->thumbnail_path);
        Storage::disk('public')->assertExists($media->path);
        Storage::disk('public')->assertExists($media->thumbnail_path);
    }

    public function test_media_service_accepts_folder_parameter(): void
    {
        Storage::fake('public');

        $file = UploadedFile::fake()->image('poster.jpg', 1200, 675);

        $service = new MediaService();
        $media = $service->upload($file, 'events/123');

        $this->assertStringStartsWith('events/123/', $media->path);
    }

    public function test_media_model_thumbnail_url_accessor(): void
    {
        $media = Media::create([
            'disk'           => 'public',
            'path'           => 'media/2026/04/test.jpg',
            'thumbnail_path' => 'media/2026/04/test_thumb.jpg',
            'url'            => '/storage/media/2026/04/test.jpg',
            'mime'           => 'image/jpeg',
            'size'           => 50000,
            'width'          => 1200,
            'height'         => 675,
        ]);

        $this->assertNotNull($media->thumbnail_url);
        $this->assertStringContains('/storage/media/2026/04/test_thumb.jpg', $media->thumbnail_url);
    }

    public function test_media_model_thumbnail_url_null_when_no_thumbnail(): void
    {
        $media = Media::create([
            'disk'   => 'public',
            'path'   => 'media/2026/04/test.jpg',
            'url'    => '/storage/media/2026/04/test.jpg',
            'mime'   => 'image/jpeg',
            'size'   => 50000,
            'width'  => 1200,
            'height' => 675,
        ]);

        $this->assertNull($media->thumbnail_url);
    }

    public function test_media_delete_removes_thumbnail(): void
    {
        Storage::fake('public');

        $file = UploadedFile::fake()->image('poster.jpg', 1200, 675);
        $service = new MediaService();
        $media = $service->upload($file);

        $path = $media->path;
        $thumbPath = $media->thumbnail_path;

        Storage::disk('public')->assertExists($path);
        Storage::disk('public')->assertExists($thumbPath);

        $service->delete($media);

        Storage::disk('public')->assertMissing($path);
        Storage::disk('public')->assertMissing($thumbPath);
    }

    // ═════════════════════════════════════════════════════════════════════════
    // 6.4 Google Drive Link
    // ═════════════════════════════════════════════════════════════════════════

    public function test_event_model_has_gdrive_link_field(): void
    {
        $event = $this->createEvent([
            'gdrive_link' => 'https://drive.google.com/drive/folders/abc123',
        ]);

        $this->assertEquals('https://drive.google.com/drive/folders/abc123', $event->gdrive_link);
    }

    public function test_admin_can_set_gdrive_link_on_event(): void
    {
        $admin = $this->createAdmin();
        $event = $this->createEvent();

        $response = $this->actingAs($admin)->put("/admin/events/{$event->slug}", [
            'title'        => $event->title,
            'slug'         => $event->slug,
            'start_at'     => $event->start_at->format('Y-m-d H:i:s'),
            'country'      => 'Malaysia',
            'is_published' => true,
            'gdrive_link'  => 'https://drive.google.com/drive/folders/test',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('events', [
            'id'          => $event->id,
            'gdrive_link' => 'https://drive.google.com/drive/folders/test',
        ]);
    }

    public function test_gdrive_link_validation_rejects_invalid_url(): void
    {
        $admin = $this->createAdmin();
        $event = $this->createEvent();

        $response = $this->actingAs($admin)->put("/admin/events/{$event->slug}", [
            'title'        => $event->title,
            'slug'         => $event->slug,
            'start_at'     => $event->start_at->format('Y-m-d H:i:s'),
            'country'      => 'Malaysia',
            'is_published' => true,
            'gdrive_link'  => 'not-a-url',
        ]);

        $response->assertSessionHasErrors('gdrive_link');
    }

    public function test_event_show_page_receives_gdrive_link(): void
    {
        $event = $this->createEvent([
            'gdrive_link' => 'https://drive.google.com/drive/folders/abc',
        ]);

        $response = $this->get("/events/{$event->slug}");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('Public/Events/Show')
                ->where('event.gdrive_link', 'https://drive.google.com/drive/folders/abc')
        );
    }

    // ═════════════════════════════════════════════════════════════════════════
    // 6.5 Social Media Sharing & OG Tags
    // ═════════════════════════════════════════════════════════════════════════

    public function test_event_show_receives_og_url(): void
    {
        $event = $this->createEvent();

        $response = $this->get("/events/{$event->slug}");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('Public/Events/Show')
                ->has('ogUrl')
        );
    }

    public function test_event_show_page_has_event_data_for_og(): void
    {
        $media = Media::create([
            'disk'   => 'public',
            'path'   => 'media/test.jpg',
            'url'    => '/storage/media/test.jpg',
            'mime'   => 'image/jpeg',
            'size'   => 50000,
            'width'  => 1200,
            'height' => 675,
        ]);

        $event = $this->createEvent([
            'title'    => 'OG Test Event',
            'excerpt'  => 'This is the OG description',
            'media_id' => $media->id,
        ]);

        $response = $this->get("/events/{$event->slug}");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('Public/Events/Show')
                ->where('event.title', 'OG Test Event')
                ->where('event.excerpt', 'This is the OG description')
                ->has('event.media')
        );
    }

    // ═════════════════════════════════════════════════════════════════════════
    // Non-admin access control
    // ═════════════════════════════════════════════════════════════════════════

    public function test_non_admin_cannot_access_banners(): void
    {
        $publicUser = User::factory()->create(['role' => 'public']);

        $response = $this->actingAs($publicUser)->get('/admin/banners');

        $response->assertStatus(403);
    }

    public function test_unauthenticated_cannot_access_admin_banners(): void
    {
        $response = $this->get('/admin/banners');

        $response->assertRedirect('/login');
    }

    // ═════════════════════════════════════════════════════════════════════════
    // Custom assertion helper
    // ═════════════════════════════════════════════════════════════════════════

    private function assertStringContains(string $needle, string $haystack): void
    {
        $this->assertTrue(
            str_contains($haystack, $needle),
            "Failed asserting that '{$haystack}' contains '{$needle}'."
        );
    }
}
