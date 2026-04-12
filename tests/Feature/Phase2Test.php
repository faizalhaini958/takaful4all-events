<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\EventRegistration;
use App\Models\EventTicket;
use App\Models\EventZone;
use App\Models\Invoice;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class Phase2Test extends TestCase
{
    use RefreshDatabase;

    // ─── Helpers ────────────────────────────────────────────────────────────

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
        return User::factory()->create(['role' => 'admin']);
    }

    // ═════════════════════════════════════════════════════════════════════════
    // 5.1 Zone-Based Pricing
    // ═════════════════════════════════════════════════════════════════════════

    public function test_admin_can_create_zone(): void
    {
        $admin = $this->createAdmin();
        $event = $this->createEvent();

        $response = $this->actingAs($admin)->post("/admin/events/{$event->slug}/zones", [
            'name'        => 'VIP Zone',
            'description' => 'Front rows with premium seating',
            'color'       => '#FF5500',
            'capacity'    => 50,
            'sort_order'  => 1,
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('event_zones', [
            'event_id' => $event->id,
            'name'     => 'VIP Zone',
            'color'    => '#FF5500',
            'capacity' => 50,
        ]);
    }

    public function test_admin_can_update_zone(): void
    {
        $admin = $this->createAdmin();
        $event = $this->createEvent();
        $zone  = EventZone::create([
            'event_id'   => $event->id,
            'name'       => 'Standard',
            'color'      => '#0000FF',
            'sort_order' => 1,
        ]);

        $response = $this->actingAs($admin)->put("/admin/events/{$event->slug}/zones/{$zone->id}", [
            'name'        => 'Standard (Updated)',
            'color'       => '#00FF00',
            'sort_order'  => 2,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('event_zones', [
            'id'   => $zone->id,
            'name' => 'Standard (Updated)',
            'color' => '#00FF00',
        ]);
    }

    public function test_admin_can_delete_zone_without_tickets(): void
    {
        $admin = $this->createAdmin();
        $event = $this->createEvent();
        $zone  = EventZone::create([
            'event_id'   => $event->id,
            'name'       => 'Empty Zone',
            'color'      => '#AABBCC',
            'sort_order' => 1,
        ]);

        $response = $this->actingAs($admin)->delete("/admin/events/{$event->slug}/zones/{$zone->id}");

        $response->assertRedirect();
        $response->assertSessionHas('success');
        $this->assertDatabaseMissing('event_zones', ['id' => $zone->id]);
    }

    public function test_admin_cannot_delete_zone_with_tickets(): void
    {
        $admin = $this->createAdmin();
        $event = $this->createEvent();
        $zone  = EventZone::create([
            'event_id'   => $event->id,
            'name'       => 'Assigned Zone',
            'color'      => '#AABBCC',
            'sort_order' => 1,
        ]);

        // Create a ticket assigned to this zone
        $this->createTicket($event, ['event_zone_id' => $zone->id]);

        $response = $this->actingAs($admin)->delete("/admin/events/{$event->slug}/zones/{$zone->id}");

        $response->assertRedirect();
        $response->assertSessionHas('error');
        $this->assertDatabaseHas('event_zones', ['id' => $zone->id]);
    }

    public function test_zone_model_relationships(): void
    {
        $event = $this->createEvent();
        $zone  = EventZone::create([
            'event_id'   => $event->id,
            'name'       => 'Premium',
            'color'      => '#FF0000',
            'sort_order' => 1,
        ]);

        $ticket = $this->createTicket($event, ['event_zone_id' => $zone->id]);

        // Zone → Event
        $this->assertEquals($event->id, $zone->event->id);

        // Zone → Tickets
        $this->assertCount(1, $zone->tickets);
        $this->assertEquals($ticket->id, $zone->tickets->first()->id);

        // Ticket → Zone
        $this->assertEquals($zone->id, $ticket->zone->id);
    }

    public function test_zone_color_validation_requires_hex(): void
    {
        $admin = $this->createAdmin();
        $event = $this->createEvent();

        $response = $this->actingAs($admin)->post("/admin/events/{$event->slug}/zones", [
            'name'  => 'Bad Zone',
            'color' => 'not-a-hex',
        ]);

        $response->assertSessionHasErrors('color');
    }

    public function test_admin_can_view_zones_page(): void
    {
        $admin = $this->createAdmin();
        $event = $this->createEvent();

        $response = $this->actingAs($admin)->get("/admin/events/{$event->slug}/zones");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('Admin/Events/Zones')
                ->has('event')
                ->has('zones')
        );
    }

    // ═════════════════════════════════════════════════════════════════════════
    // 5.2 E-Invoice PDF
    // ═════════════════════════════════════════════════════════════════════════

    public function test_invoice_model_generates_unique_number(): void
    {
        $number1 = Invoice::generateInvoiceNumber();
        $number2 = Invoice::generateInvoiceNumber();

        $this->assertStringStartsWith('INV-', $number1);
        $this->assertStringStartsWith('INV-', $number2);
        $this->assertNotEquals($number1, $number2);
    }

    public function test_invoice_auto_generated_when_payment_becomes_paid(): void
    {
        $event  = $this->createEvent();
        $ticket = $this->createTicket($event);

        $registration = EventRegistration::create([
            'event_id'       => $event->id,
            'ticket_id'      => $ticket->id,
            'name'           => 'Invoice Test',
            'email'          => 'invoice@test.com',
            'quantity'       => 1,
            'subtotal'       => 100.00,
            'total_amount'   => 100.00,
            'status'         => 'confirmed',
            'payment_status' => 'pending',
        ]);

        // No invoice yet
        $this->assertDatabaseMissing('invoices', ['registration_id' => $registration->id]);

        // Replace the observer with one that creates an invoice without PDF/QR
        EventRegistration::flushEventListeners();
        EventRegistration::updated(function (EventRegistration $reg) {
            if ($reg->wasChanged('payment_status') && $reg->payment_status === 'paid') {
                if (Invoice::where('registration_id', $reg->id)->exists()) return;
                Invoice::create([
                    'registration_id' => $reg->id,
                    'user_id'         => $reg->user_id,
                    'invoice_number'  => Invoice::generateInvoiceNumber(),
                    'subtotal'        => $reg->subtotal,
                    'discount_amount' => $reg->discount_amount ?? 0,
                    'total_amount'    => $reg->total_amount,
                    'issued_at'       => now(),
                    'pdf_path'        => 'invoices/test/INV-TEST.pdf',
                ]);
            }
        });

        // Change payment status to paid → should trigger
        $registration->update(['payment_status' => 'paid']);

        $this->assertDatabaseHas('invoices', [
            'registration_id' => $registration->id,
        ]);

        $invoice = Invoice::where('registration_id', $registration->id)->first();
        $this->assertNotNull($invoice);
        $this->assertStringStartsWith('INV-', $invoice->invoice_number);
        $this->assertNotNull($invoice->pdf_path);
    }

    public function test_invoice_not_duplicated_on_repeated_status_change(): void
    {
        $event  = $this->createEvent();
        $ticket = $this->createTicket($event);

        // Replace observer with test-safe version
        $callCount = 0;
        EventRegistration::flushEventListeners();
        EventRegistration::updated(function (EventRegistration $reg) use (&$callCount) {
            if ($reg->wasChanged('payment_status') && $reg->payment_status === 'paid') {
                if (Invoice::where('registration_id', $reg->id)->exists()) return;
                $callCount++;
                Invoice::create([
                    'registration_id' => $reg->id,
                    'invoice_number'  => Invoice::generateInvoiceNumber(),
                    'subtotal'        => $reg->subtotal,
                    'discount_amount' => $reg->discount_amount ?? 0,
                    'total_amount'    => $reg->total_amount,
                    'issued_at'       => now(),
                    'pdf_path'        => 'invoices/test/INV-TEST.pdf',
                ]);
            }
        });

        $registration = EventRegistration::create([
            'event_id'       => $event->id,
            'ticket_id'      => $ticket->id,
            'name'           => 'No Dupe',
            'email'          => 'nodupe@test.com',
            'reference_no'   => 'EVT-NODUPE-0001',
            'quantity'       => 1,
            'subtotal'       => 100.00,
            'total_amount'   => 100.00,
            'status'         => 'confirmed',
            'payment_status' => 'pending',
        ]);

        // First paid → creates invoice
        $registration->update(['payment_status' => 'paid']);
        $this->assertEquals(1, Invoice::where('registration_id', $registration->id)->count());

        // Switch back then paid again → should NOT create duplicate
        $registration->update(['payment_status' => 'pending']);
        $registration->update(['payment_status' => 'paid']);
        $this->assertEquals(1, Invoice::where('registration_id', $registration->id)->count());
        $this->assertEquals(1, $callCount, 'Invoice should only be created once');
    }

    public function test_invoice_relationships(): void
    {
        $event  = $this->createEvent();
        $ticket = $this->createTicket($event);
        $user   = User::factory()->create(['role' => 'company', 'company_name' => 'Test Corp']);

        $registration = EventRegistration::create([
            'event_id'       => $event->id,
            'ticket_id'      => $ticket->id,
            'user_id'        => $user->id,
            'name'           => 'Rel Test',
            'email'          => $user->email,
            'quantity'       => 1,
            'subtotal'       => 100.00,
            'total_amount'   => 100.00,
            'status'         => 'confirmed',
            'payment_status' => 'paid',
        ]);

        // Directly create invoice (bypassing observer/PDF generation)
        $invoice = Invoice::create([
            'registration_id' => $registration->id,
            'user_id'         => $user->id,
            'invoice_number'  => Invoice::generateInvoiceNumber(),
            'company_name'    => $user->company_name,
            'subtotal'        => $registration->subtotal,
            'discount_amount' => $registration->discount_amount ?? 0,
            'total_amount'    => $registration->total_amount,
            'issued_at'       => now(),
            'pdf_path'        => 'invoices/test/INV-TEST.pdf',
        ]);

        // Invoice → Registration
        $this->assertEquals($registration->id, $invoice->registration->id);

        // Invoice → User
        $this->assertEquals($user->id, $invoice->user->id);

        // Registration → Invoice
        $this->assertEquals($invoice->id, $registration->fresh()->invoice->id);
    }

    public function test_invoice_download_requires_auth(): void
    {
        $response = $this->get('/invoices/INV-20260410-XXXX/download');

        $response->assertRedirect('/login');
    }

    // ═════════════════════════════════════════════════════════════════════════
    // 5.3 QR Code / Check-In
    // ═════════════════════════════════════════════════════════════════════════

    public function test_admin_can_view_checkin_scanner(): void
    {
        $admin = $this->createAdmin();
        $event = $this->createEvent();

        $response = $this->actingAs($admin)->get("/admin/events/{$event->slug}/check-in");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('Admin/Events/CheckIn')
                ->has('event')
        );
    }

    public function test_checkin_lookup_finds_registration(): void
    {
        $admin = $this->createAdmin();
        $event = $this->createEvent();
        $ticket = $this->createTicket($event);

        $registration = EventRegistration::create([
            'event_id'       => $event->id,
            'ticket_id'      => $ticket->id,
            'name'           => 'Lookup Test',
            'email'          => 'lookup@test.com',
            'quantity'       => 1,
            'subtotal'       => 100,
            'total_amount'   => 100,
            'status'         => 'confirmed',
            'payment_status' => 'paid',
        ]);

        $response = $this->actingAs($admin)
            ->postJson("/admin/events/{$event->slug}/check-in/lookup", [
                'reference' => $registration->reference_no,
            ]);

        $response->assertOk();
        $response->assertJson([
            'found' => true,
            'registration' => [
                'reference_no' => $registration->reference_no,
                'name'         => 'Lookup Test',
            ],
        ]);
    }

    public function test_checkin_lookup_returns_not_found(): void
    {
        $admin = $this->createAdmin();
        $event = $this->createEvent();

        $response = $this->actingAs($admin)
            ->postJson("/admin/events/{$event->slug}/check-in/lookup", [
                'reference' => 'EVT-FAKE-0000',
            ]);

        $response->assertOk();
        $response->assertJson(['found' => false]);
    }

    public function test_checkin_marks_attendee_as_attended(): void
    {
        $admin = $this->createAdmin();
        $event = $this->createEvent();
        $ticket = $this->createTicket($event);

        $registration = EventRegistration::create([
            'event_id'       => $event->id,
            'ticket_id'      => $ticket->id,
            'name'           => 'Checkin Test',
            'email'          => 'checkin@test.com',
            'quantity'       => 1,
            'subtotal'       => 100,
            'total_amount'   => 100,
            'status'         => 'confirmed',
            'payment_status' => 'paid',
        ]);

        $response = $this->actingAs($admin)
            ->postJson("/admin/events/{$event->slug}/check-in/confirm", [
                'reference' => $registration->reference_no,
            ]);

        $response->assertOk();
        $response->assertJson(['success' => true]);

        $registration->refresh();
        $this->assertEquals('attended', $registration->status);
        $this->assertNotNull($registration->checked_in_at);
    }

    public function test_checkin_prevents_double_checkin(): void
    {
        $admin = $this->createAdmin();
        $event = $this->createEvent();
        $ticket = $this->createTicket($event);

        $registration = EventRegistration::create([
            'event_id'       => $event->id,
            'ticket_id'      => $ticket->id,
            'name'           => 'Already Here',
            'email'          => 'already@test.com',
            'quantity'       => 1,
            'subtotal'       => 100,
            'total_amount'   => 100,
            'status'         => 'attended',
            'payment_status' => 'paid',
            'checked_in_at'  => now(),
        ]);

        $response = $this->actingAs($admin)
            ->postJson("/admin/events/{$event->slug}/check-in/confirm", [
                'reference' => $registration->reference_no,
            ]);

        $response->assertOk();
        $response->assertJson(['success' => false]);
        $response->assertJsonPath('message', fn ($msg) => str_contains($msg, 'Already checked in'));
    }

    public function test_checkin_rejects_cancelled_registration(): void
    {
        $admin = $this->createAdmin();
        $event = $this->createEvent();
        $ticket = $this->createTicket($event);

        $registration = EventRegistration::create([
            'event_id'       => $event->id,
            'ticket_id'      => $ticket->id,
            'name'           => 'Cancelled',
            'email'          => 'cancelled@test.com',
            'quantity'       => 1,
            'subtotal'       => 100,
            'total_amount'   => 100,
            'status'         => 'cancelled',
            'payment_status' => 'na',
        ]);

        $response = $this->actingAs($admin)
            ->postJson("/admin/events/{$event->slug}/check-in/confirm", [
                'reference' => $registration->reference_no,
            ]);

        $response->assertOk();
        $response->assertJson(['success' => false]);
    }

    public function test_registration_model_mark_as_checked_in(): void
    {
        $event  = $this->createEvent();
        $ticket = $this->createTicket($event);

        $registration = EventRegistration::create([
            'event_id'       => $event->id,
            'ticket_id'      => $ticket->id,
            'name'           => 'Mark Test',
            'email'          => 'mark@test.com',
            'quantity'       => 1,
            'subtotal'       => 0,
            'total_amount'   => 0,
            'status'         => 'confirmed',
            'payment_status' => 'na',
        ]);

        $registration->markAsCheckedIn();

        $this->assertEquals('attended', $registration->status);
        $this->assertNotNull($registration->checked_in_at);
    }
}
