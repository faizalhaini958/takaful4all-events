<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\EventRegistration;
use App\Models\EventTicket;
use App\Models\TicketDiscountTier;
use App\Models\User;
use App\Services\RegistrationPricingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class Phase1Test extends TestCase
{
    use RefreshDatabase;

    // ─── Helper: Create a published event with RSVP enabled ─────────────────

    private function createEvent(array $overrides = []): Event
    {
        return Event::create(array_merge([
            'title'        => 'Test Event',
            'excerpt'      => 'Test excerpt',
            'start_at'     => now()->addMonth(),
            'end_at'       => now()->addMonth()->addHours(8),
            'country'      => 'Malaysia',
            'is_published' => true,
            'rsvp_enabled' => true,
        ], $overrides));
    }

    private function createTicket(Event $event, array $overrides = []): EventTicket
    {
        return EventTicket::create(array_merge([
            'event_id'     => $event->id,
            'name'         => 'Standard Ticket',
            'type'         => 'paid',
            'price'        => 100.00,
            'currency'     => 'MYR',
            'quantity'     => 50,
            'max_per_order' => 10,
            'is_active'    => true,
            'sort_order'   => 1,
        ], $overrides));
    }

    private function createAdmin(): User
    {
        return User::factory()->create([
            'role' => 'admin',
        ]);
    }

    private function createCompanyUser(array $overrides = []): User
    {
        return User::factory()->create(array_merge([
            'role'                    => 'company',
            'company_name'            => 'Takaful Corp Sdn Bhd',
            'company_registration_no' => '201901000001',
            'company_address'         => '123 Jalan Ampang, KL',
            'company_phone'           => '+60312345678',
        ], $overrides));
    }

    // ═════════════════════════════════════════════════════════════════════════
    // 4.1 Double-Booking Prevention
    // ═════════════════════════════════════════════════════════════════════════

    public function test_registration_with_valid_data_succeeds(): void
    {
        $event  = $this->createEvent();
        $ticket = $this->createTicket($event, ['quantity' => 10]);

        $response = $this->post("/events/{$event->slug}/register", [
            'ticket_id' => $ticket->id,
            'quantity'  => 2,
            'attendees' => [
                ['name' => 'Ali Bin Ahmad', 'email' => 'ali@example.com', 'phone' => '0123456789'],
                ['name' => 'Siti Binti Zain', 'email' => 'siti@example.com'],
            ],
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('event_registrations', [
            'event_id'  => $event->id,
            'ticket_id' => $ticket->id,
            'quantity'  => 2,
            'name'      => 'Ali Bin Ahmad',
            'email'     => 'ali@example.com',
        ]);
    }

    public function test_registration_fails_when_ticket_sold_out(): void
    {
        $event  = $this->createEvent();
        $ticket = $this->createTicket($event, ['quantity' => 2]);

        // Fill available spots
        EventRegistration::create([
            'event_id'       => $event->id,
            'ticket_id'      => $ticket->id,
            'name'           => 'Existing',
            'email'          => 'existing@example.com',
            'quantity'       => 2,
            'subtotal'       => 200,
            'total_amount'   => 200,
            'status'         => 'confirmed',
            'payment_status' => 'paid',
        ]);

        $response = $this->post("/events/{$event->slug}/register", [
            'ticket_id' => $ticket->id,
            'quantity'  => 1,
            'attendees' => [
                ['name' => 'Latecomer', 'email' => 'late@example.com'],
            ],
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('error');
    }

    public function test_registration_fails_when_quantity_exceeds_availability(): void
    {
        $event  = $this->createEvent();
        $ticket = $this->createTicket($event, ['quantity' => 5]);

        // Use up 4 slots
        EventRegistration::create([
            'event_id'       => $event->id,
            'ticket_id'      => $ticket->id,
            'name'           => 'Existing',
            'email'          => 'existing@example.com',
            'quantity'       => 4,
            'subtotal'       => 400,
            'total_amount'   => 400,
            'status'         => 'confirmed',
            'payment_status' => 'paid',
        ]);

        // Try to book 3 when only 1 is left
        $response = $this->post("/events/{$event->slug}/register", [
            'ticket_id' => $ticket->id,
            'quantity'  => 3,
            'attendees' => [
                ['name' => 'A', 'email' => 'a@test.com'],
                ['name' => 'B', 'email' => 'b@test.com'],
                ['name' => 'C', 'email' => 'c@test.com'],
            ],
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('error');
    }

    public function test_cancelled_registrations_free_up_slots(): void
    {
        $event  = $this->createEvent();
        $ticket = $this->createTicket($event, ['quantity' => 2]);

        // Create a cancelled registration — should NOT count towards sold_count
        EventRegistration::create([
            'event_id'       => $event->id,
            'ticket_id'      => $ticket->id,
            'name'           => 'Cancelled User',
            'email'          => 'cancelled@example.com',
            'quantity'       => 2,
            'subtotal'       => 200,
            'total_amount'   => 200,
            'status'         => 'cancelled',
            'payment_status' => 'na',
        ]);

        $ticket->refresh();
        $this->assertEquals(2, $ticket->available_count);
    }

    public function test_unlimited_ticket_allows_registration(): void
    {
        $event  = $this->createEvent();
        $ticket = $this->createTicket($event, ['quantity' => null]); // unlimited

        $this->assertNull($ticket->available_count);

        $response = $this->post("/events/{$event->slug}/register", [
            'ticket_id' => $ticket->id,
            'quantity'  => 5,
            'attendees' => [
                ['name' => 'A', 'email' => 'a@test.com'],
                ['name' => 'B', 'email' => 'b@test.com'],
                ['name' => 'C', 'email' => 'c@test.com'],
                ['name' => 'D', 'email' => 'd@test.com'],
                ['name' => 'E', 'email' => 'e@test.com'],
            ],
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('event_registrations', [
            'event_id' => $event->id,
            'quantity'  => 5,
        ]);
    }

    // ═════════════════════════════════════════════════════════════════════════
    // 4.2 Company Role & Bulk Purchasing
    // ═════════════════════════════════════════════════════════════════════════

    public function test_user_model_has_role_helpers(): void
    {
        $admin   = User::factory()->create(['role' => 'admin']);
        $company = User::factory()->create(['role' => 'company']);
        $public  = User::factory()->create(['role' => 'public']);

        $this->assertTrue($admin->isAdmin());
        $this->assertFalse($admin->isCompany());

        $this->assertTrue($company->isCompany());
        $this->assertFalse($company->isAdmin());

        $this->assertTrue($public->isPublic());
        $this->assertFalse($public->isCompany());
    }

    public function test_company_user_has_company_profile_fields(): void
    {
        $company = $this->createCompanyUser();

        $this->assertEquals('Takaful Corp Sdn Bhd', $company->company_name);
        $this->assertEquals('201901000001', $company->company_registration_no);
        $this->assertNotNull($company->company_address);
        $this->assertNotNull($company->company_phone);
    }

    public function test_bulk_discount_tiers_are_created_and_queried(): void
    {
        $event  = $this->createEvent();
        $ticket = $this->createTicket($event);

        $tier5  = TicketDiscountTier::create([
            'event_ticket_id' => $ticket->id,
            'min_quantity'    => 5,
            'discount_type'   => 'percentage',
            'discount_value'  => 10.00,
        ]);
        $tier10 = TicketDiscountTier::create([
            'event_ticket_id' => $ticket->id,
            'min_quantity'    => 10,
            'discount_type'   => 'percentage',
            'discount_value'  => 15.00,
        ]);
        $tier20 = TicketDiscountTier::create([
            'event_ticket_id' => $ticket->id,
            'min_quantity'    => 20,
            'discount_type'   => 'percentage',
            'discount_value'  => 20.00,
        ]);

        // Quantity 7 → should match the 5+ tier (highest qualifying)
        $applicable = $ticket->discountTiers()->forQuantity(7)->first();
        $this->assertEquals($tier5->id, $applicable->id);

        // Quantity 15 → should match the 10+ tier
        $applicable = $ticket->discountTiers()->forQuantity(15)->first();
        $this->assertEquals($tier10->id, $applicable->id);

        // Quantity 25 → should match the 20+ tier
        $applicable = $ticket->discountTiers()->forQuantity(25)->first();
        $this->assertEquals($tier20->id, $applicable->id);

        // Quantity 3 → no tier matches
        $applicable = $ticket->discountTiers()->forQuantity(3)->first();
        $this->assertNull($applicable);
    }

    public function test_pricing_service_calculates_company_bulk_discount(): void
    {
        $event  = $this->createEvent();
        $ticket = $this->createTicket($event, ['price' => 100.00]);

        TicketDiscountTier::create([
            'event_ticket_id' => $ticket->id,
            'min_quantity'    => 5,
            'discount_type'   => 'percentage',
            'discount_value'  => 10.00,
        ]);

        $companyUser = $this->createCompanyUser();
        $service = new RegistrationPricingService();

        // Company user with 10 tickets → 10% off
        $result = $service->calculateTotal($ticket, 10, [], $companyUser);

        $this->assertEquals(1000.00, $result['subtotal']);       // 10 × 100
        $this->assertEquals(100.00, $result['discount_amount']); // 10% of 1000
        $this->assertStringContainsString('bulk discount', $result['discount_label']);
        $this->assertEquals(900.00, $result['grand_total']);
    }

    public function test_pricing_service_no_discount_for_non_company_user(): void
    {
        $event  = $this->createEvent();
        $ticket = $this->createTicket($event, ['price' => 100.00]);

        TicketDiscountTier::create([
            'event_ticket_id' => $ticket->id,
            'min_quantity'    => 5,
            'discount_type'   => 'percentage',
            'discount_value'  => 10.00,
        ]);

        $publicUser = User::factory()->create(['role' => 'public']);
        $service = new RegistrationPricingService();

        $result = $service->calculateTotal($ticket, 10, [], $publicUser);

        $this->assertEquals(1000.00, $result['subtotal']);
        $this->assertEquals(0.00, $result['discount_amount']);
        $this->assertNull($result['discount_label']);
        $this->assertEquals(1000.00, $result['grand_total']);
    }

    public function test_pricing_service_no_discount_when_quantity_below_tiers(): void
    {
        $event  = $this->createEvent();
        $ticket = $this->createTicket($event, ['price' => 100.00]);

        TicketDiscountTier::create([
            'event_ticket_id' => $ticket->id,
            'min_quantity'    => 5,
            'discount_type'   => 'percentage',
            'discount_value'  => 10.00,
        ]);

        $companyUser = $this->createCompanyUser();
        $service = new RegistrationPricingService();

        $result = $service->calculateTotal($ticket, 3, [], $companyUser);

        $this->assertEquals(300.00, $result['subtotal']);
        $this->assertEquals(0.00, $result['discount_amount']);
        $this->assertNull($result['discount_label']);
        $this->assertEquals(300.00, $result['grand_total']);
    }

    public function test_pricing_service_with_fixed_discount(): void
    {
        $event  = $this->createEvent();
        $ticket = $this->createTicket($event, ['price' => 150.00]);

        TicketDiscountTier::create([
            'event_ticket_id' => $ticket->id,
            'min_quantity'    => 5,
            'discount_type'   => 'fixed',
            'discount_value'  => 20.00,
        ]);

        $companyUser = $this->createCompanyUser();
        $service = new RegistrationPricingService();

        $result = $service->calculateTotal($ticket, 5, [], $companyUser);

        $this->assertEquals(750.00, $result['subtotal']);        // 5 × 150
        $this->assertEquals(100.00, $result['discount_amount']); // 5 × 20 fixed per ticket
        $this->assertEquals(650.00, $result['grand_total']);
    }

    public function test_pricing_service_includes_product_totals(): void
    {
        $event  = $this->createEvent();
        $ticket = $this->createTicket($event, ['price' => 100.00]);
        $service = new RegistrationPricingService();

        $productItems = [
            ['unit_price' => 25.00, 'quantity' => 2],
            ['unit_price' => 10.00, 'quantity' => 3],
        ];

        $result = $service->calculateTotal($ticket, 1, $productItems);

        $this->assertEquals(100.00, $result['subtotal']);
        $this->assertEquals(80.00, $result['products_total']); // 50 + 30
        $this->assertEquals(180.00, $result['grand_total']);
    }

    // ═════════════════════════════════════════════════════════════════════════
    // 4.3 Admin User Management
    // ═════════════════════════════════════════════════════════════════════════

    public function test_admin_can_view_users_index(): void
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->get('/admin/users');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('Admin/Users/Index')
                ->has('users')
                ->has('filters')
        );
    }

    public function test_admin_can_create_company_user(): void
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->post('/admin/users', [
            'name'                    => 'Company User',
            'email'                   => 'company@test.com',
            'password'                => 'password123',
            'role'                    => 'company',
            'company_name'            => 'Takaful Corp',
            'company_registration_no' => 'REG123',
            'company_address'         => '123 KL',
            'company_phone'           => '+60312345678',
        ]);

        $response->assertRedirect(route('admin.users.index'));

        $this->assertDatabaseHas('users', [
            'email'        => 'company@test.com',
            'role'         => 'company',
            'company_name' => 'Takaful Corp',
        ]);
    }

    public function test_admin_can_filter_users_by_role(): void
    {
        $admin = $this->createAdmin();
        $this->createCompanyUser(['email' => 'co1@test.com']);
        $this->createCompanyUser(['email' => 'co2@test.com']);
        User::factory()->create(['role' => 'public', 'email' => 'pub@test.com']);

        $response = $this->actingAs($admin)->get('/admin/users?role=company');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('Admin/Users/Index')
                ->where('filters.role', 'company')
        );
    }

    public function test_admin_cannot_delete_self(): void
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->delete("/admin/users/{$admin->id}");

        $response->assertRedirect();
        $response->assertSessionHas('error');
        $this->assertDatabaseHas('users', ['id' => $admin->id]);
    }

    public function test_non_admin_cannot_access_admin_users(): void
    {
        $publicUser = User::factory()->create(['role' => 'public']);

        $response = $this->actingAs($publicUser)->get('/admin/users');

        $response->assertStatus(403);
    }

    public function test_company_fields_cleared_for_non_company_role(): void
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->post('/admin/users', [
            'name'         => 'Public User',
            'email'        => 'public@test.com',
            'password'     => 'password123',
            'role'         => 'public',
            'company_name' => 'This should be cleared',
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('users', [
            'email'        => 'public@test.com',
            'role'         => 'public',
            'company_name' => null,
        ]);
    }

    // ═════════════════════════════════════════════════════════════════════════
    // 4.4 Status Badge Colours
    // ═════════════════════════════════════════════════════════════════════════

    public function test_reference_number_auto_generated(): void
    {
        $event  = $this->createEvent();
        $ticket = $this->createTicket($event);

        $registration = EventRegistration::create([
            'event_id'       => $event->id,
            'ticket_id'      => $ticket->id,
            'name'           => 'Test',
            'email'          => 'test@example.com',
            'quantity'       => 1,
            'subtotal'       => 100,
            'total_amount'   => 100,
            'status'         => 'confirmed',
            'payment_status' => 'paid',
        ]);

        $this->assertNotNull($registration->reference_no);
        $this->assertStringStartsWith('EVT-', $registration->reference_no);
    }

    public function test_event_status_accessor(): void
    {
        $draft = $this->createEvent(['is_published' => false, 'start_at' => now()->addMonth()]);
        $this->assertEquals('draft', $draft->status);

        $upcoming = $this->createEvent(['is_published' => true, 'start_at' => now()->addDay()]);
        $this->assertEquals('upcoming', $upcoming->status);

        $past = $this->createEvent(['is_published' => true, 'start_at' => now()->subDay()]);
        $this->assertEquals('past', $past->status);
    }

    public function test_ticket_sold_count_and_available_count(): void
    {
        $event  = $this->createEvent();
        $ticket = $this->createTicket($event, ['quantity' => 10]);

        EventRegistration::create([
            'event_id'       => $event->id,
            'ticket_id'      => $ticket->id,
            'name'           => 'A',
            'email'          => 'a@test.com',
            'quantity'       => 3,
            'subtotal'       => 300,
            'total_amount'   => 300,
            'status'         => 'confirmed',
            'payment_status' => 'paid',
        ]);

        EventRegistration::create([
            'event_id'       => $event->id,
            'ticket_id'      => $ticket->id,
            'name'           => 'B',
            'email'          => 'b@test.com',
            'quantity'       => 2,
            'subtotal'       => 200,
            'total_amount'   => 200,
            'status'         => 'pending',
            'payment_status' => 'pending',
        ]);

        $ticket->refresh();
        $this->assertEquals(5, $ticket->sold_count);
        $this->assertEquals(5, $ticket->available_count);
    }
}
