<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserRoleSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_checkin_staff_cannot_access_user_management(): void
    {
        $checkinStaff = User::factory()->create(['role' => 'checkin_staff']);

        $response = $this->actingAs($checkinStaff)->get('/admin/users');
        $response->assertStatus(403);

        $response = $this->actingAs($checkinStaff)->post('/admin/users', [
            'name'     => 'Escalated User',
            'email'    => 'escalated@example.com',
            'password' => 'password123',
            'role'     => 'admin',
        ]);
        $response->assertStatus(403);

        $this->assertDatabaseMissing('users', ['email' => 'escalated@example.com']);
    }

    public function test_public_role_cannot_access_admin_panel_at_all(): void
    {
        $publicUser = User::factory()->create(['role' => 'public']);

        $response = $this->actingAs($publicUser)->get('/admin/users');
        $response->assertStatus(403);
    }

    public function test_editor_role_is_no_longer_a_valid_role(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->post('/admin/users', [
            'name'     => 'New Editor',
            'email'    => 'new-editor@example.com',
            'password' => 'password123',
            'role'     => 'editor',
        ]);

        $response->assertSessionHasErrors('role');
        $this->assertDatabaseMissing('users', ['email' => 'new-editor@example.com']);
    }

    public function test_admin_can_still_create_users_with_valid_roles(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->post('/admin/users', [
            'name'     => 'New Staff',
            'email'    => 'new-staff@example.com',
            'password' => 'password123',
            'role'     => 'checkin_staff',
        ]);

        $response->assertRedirect(route('admin.users.index'));
        $this->assertDatabaseHas('users', ['email' => 'new-staff@example.com', 'role' => 'checkin_staff']);
    }
}
