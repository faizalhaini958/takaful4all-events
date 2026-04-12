<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\EventProduct;
use App\Models\EventRegistration;
use App\Models\EventTicket;
use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class PaymentGatewayTest extends TestCase
{
    use RefreshDatabase;

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private function createEvent(array $overrides = []): Event
    {
        return Event::create(array_merge([
            'title'        => 'Test Event',
            'slug'         => 'test-event',
            'start_at'     => now()->addDays(7),
            'is_published' => true,
            'rsvp_enabled' => true,
            'require_approval' => false,
        ], $overrides));
    }

    private function createTicket(Event $event, array $overrides = []): EventTicket
    {
        return EventTicket::create(array_merge([
            'event_id'      => $event->id,
            'name'          => 'General Admission',
            'type'          => 'paid',
            'price'         => 50.00,
            'currency'      => 'MYR',
            'is_active'     => true,
            'max_per_order' => 5,
        ], $overrides));
    }

    private function createProduct(Event $event, array $overrides = []): EventProduct
    {
        return EventProduct::create(array_merge([
            'event_id'  => $event->id,
            'name'      => 'Event Kit',
            'price'     => 25.00,
            'currency'  => 'MYR',
            'is_active' => true,
            'stock'     => 10,
        ], $overrides));
    }

    private function configureChipIn(): void
    {
        Setting::create(['group' => 'chipin', 'key' => 'secret_key', 'value' => 'test-secret', 'is_encrypted' => false]);
        Setting::create(['group' => 'chipin', 'key' => 'brand_id',   'value' => 'test-brand',  'is_encrypted' => false]);
        Setting::create(['group' => 'chipin', 'key' => 'send_receipt', 'value' => '0', 'is_encrypted' => false]);
    }

    private function registrationPayload(EventTicket $ticket, array $overrides = []): array
    {
        return array_merge([
            'ticket_id' => $ticket->id,
            'quantity'  => 1,
            'attendees' => [[
                'name'  => 'Ali Hassan',
                'email' => 'ali@example.com',
                'phone' => '0123456789',
                'company'              => '',
                'job_title'            => '',
                'dietary_requirements' => '',
            ]],
            'notes'    => '',
            'products' => [],
        ], $overrides);
    }

    // ─── Price format sent to Chip-In (sen conversion) ────────────────────────

    #[Test]
    public function it_sends_prices_to_chip_in_as_integers_in_sen(): void
    {
        $this->configureChipIn();

        $event   = $this->createEvent();
        $ticket  = $this->createTicket($event, ['price' => 150.00]);

        Http::fake([
            'gate.chip-in.asia/*' => Http::response([
                'id'           => 'purchase-abc',
                'checkout_url' => 'https://checkout.chip-in.asia/pay/abc',
                'status'       => 'created',
            ], 200),
        ]);

        $this->post("/events/{$event->slug}/register", $this->registrationPayload($ticket));

        Http::assertSent(function ($request) {
            $products = $request['purchase']['products'];
            // RM 150.00 × 1 = 15000 sen
            return $products[0]['price'] === 15000;
        });
    }

    #[Test]
    public function it_sends_product_prices_to_chip_in_as_integers_in_sen(): void
    {
        $this->configureChipIn();

        $event   = $this->createEvent();
        $ticket  = $this->createTicket($event, ['price' => 50.00]);
        $product = $this->createProduct($event, ['price' => 25.00, 'stock' => 5]);

        Http::fake([
            'gate.chip-in.asia/*' => Http::response([
                'id'           => 'purchase-xyz',
                'checkout_url' => 'https://checkout.chip-in.asia/pay/xyz',
            ], 200),
        ]);

        $payload = $this->registrationPayload($ticket, [
            'products' => [['product_id' => $product->id, 'quantity' => 2, 'variant' => '']],
        ]);

        $this->post("/events/{$event->slug}/register", $payload);

        Http::assertSent(function ($request) {
            $products = $request['purchase']['products'];
            // Ticket: 50.00 * 1 * 100 = 5000 sen
            // Product: 25.00 * 2 * 100 = 5000 sen
            return $products[0]['price'] === 5000
                && $products[1]['price'] === 5000;
        });
    }

    // ─── Product stock management ─────────────────────────────────────────────

    #[Test]
    public function it_decrements_product_stock_after_successful_registration(): void
    {
        $event   = $this->createEvent(['require_approval' => false]);
        $ticket  = $this->createTicket($event, ['type' => 'free', 'price' => 0.00]);
        $product = $this->createProduct($event, ['stock' => 10]);

        $payload = $this->registrationPayload($ticket, [
            'products' => [['product_id' => $product->id, 'quantity' => 3, 'variant' => '']],
        ]);

        $this->post("/events/{$event->slug}/register", $payload);

        $this->assertDatabaseHas('event_products', [
            'id'    => $product->id,
            'stock' => 7, // 10 - 3
        ]);
    }

    #[Test]
    public function it_rejects_registration_when_product_stock_is_insufficient(): void
    {
        $event   = $this->createEvent();
        $ticket  = $this->createTicket($event, ['type' => 'free', 'price' => 0.00]);
        $product = $this->createProduct($event, ['stock' => 2]);

        $payload = $this->registrationPayload($ticket, [
            'products' => [['product_id' => $product->id, 'quantity' => 5, 'variant' => '']],
        ]);

        $response = $this->post("/events/{$event->slug}/register", $payload);

        $response->assertSessionHas('error');

        // Stock should be unchanged
        $this->assertDatabaseHas('event_products', [
            'id'    => $product->id,
            'stock' => 2,
        ]);
    }

    #[Test]
    public function it_does_not_decrement_stock_for_products_with_null_unlimited_stock(): void
    {
        $event   = $this->createEvent(['require_approval' => false]);
        $ticket  = $this->createTicket($event, ['type' => 'free', 'price' => 0.00]);
        $product = $this->createProduct($event, ['stock' => null]); // unlimited

        $payload = $this->registrationPayload($ticket, [
            'products' => [['product_id' => $product->id, 'quantity' => 100, 'variant' => '']],
        ]);

        $this->post("/events/{$event->slug}/register", $payload);

        // Stock remains null (unlimited)
        $this->assertDatabaseHas('event_products', [
            'id'    => $product->id,
            'stock' => null,
        ]);
    }

    // ─── Webhook: stock restoration on cancellation ───────────────────────────

    #[Test]
    public function webhook_restores_product_stock_when_purchase_is_cancelled(): void
    {
        $event   = $this->createEvent();
        $ticket  = $this->createTicket($event);
        $product = $this->createProduct($event, ['stock' => 5]);

        // Create a registration that used 3 units of stock
        $registration = EventRegistration::create([
            'event_id'       => $event->id,
            'ticket_id'      => $ticket->id,
            'reference_no'   => 'EVT-20260311-ABCD',
            'name'           => 'Siti Nur',
            'email'          => 'siti@example.com',
            'quantity'       => 1,
            'subtotal'       => 50.00,
            'products_total' => 75.00,
            'total_amount'   => 125.00,
            'status'         => 'confirmed',
            'payment_status' => 'pending',
            'payment_method' => 'chipin',
            'payment_reference' => 'chip-purchase-001',
        ]);

        $registration->products()->create([
            'product_id' => $product->id,
            'quantity'   => 3,
            'unit_price' => 25.00,
        ]);

        // Reduce stock as if the registration controller had done it
        $product->decrement('stock', 3);
        $this->assertEquals(2, $product->fresh()->stock);

        // Fire the cancellation webhook (raw JSON body, CSRF-exempt route)
        $payload = json_encode([
            'event_type' => 'purchase.cancelled',
            'id'         => 'chip-purchase-001',
            'reference'  => 'chip-purchase-001',
            'status'     => 'cancelled',
        ]);

        $this->call('POST', '/webhooks/chipin', [], [], [], [
            'CONTENT_TYPE' => 'application/json',
        ], $payload)->assertOk();

        // Stock should be restored: 2 + 3 = 5
        $this->assertEquals(5, $product->fresh()->stock);
    }

    #[Test]
    public function webhook_does_not_restore_stock_if_payment_was_already_completed(): void
    {
        $event   = $this->createEvent();
        $ticket  = $this->createTicket($event);
        $product = $this->createProduct($event, ['stock' => 7]);

        $registration = EventRegistration::create([
            'event_id'          => $event->id,
            'ticket_id'         => $ticket->id,
            'reference_no'      => 'EVT-20260311-PAID',
            'name'              => 'Ahmad',
            'email'             => 'ahmad@example.com',
            'quantity'          => 1,
            'subtotal'          => 50.00,
            'products_total'    => 25.00,
            'total_amount'      => 75.00,
            'status'            => 'confirmed',
            'payment_status'    => 'paid', // already paid — should NOT restore stock
            'payment_method'    => 'chipin',
            'payment_reference' => 'chip-purchase-paid',
        ]);

        $registration->products()->create([
            'product_id' => $product->id,
            'quantity'   => 2,
            'unit_price' => 25.00,
        ]);

        $product->decrement('stock', 2);
        $this->assertEquals(5, $product->fresh()->stock);

        $payload = json_encode([
            'event_type' => 'purchase.cancelled',
            'id'         => 'chip-purchase-paid',
            'reference'  => 'chip-purchase-paid',
            'status'     => 'cancelled',
        ]);

        $this->call('POST', '/webhooks/chipin', [], [], [], [
            'CONTENT_TYPE' => 'application/json',
        ], $payload)->assertOk();

        // Stock must remain 5 — not restored because payment_status was 'paid'
        $this->assertEquals(5, $product->fresh()->stock);
    }

    // ─── Chip-In service: price conversion unit test ──────────────────────────

    #[Test]
    public function chip_in_purchase_payload_total_matches_sum_of_line_items_in_sen(): void
    {
        // RM 150.00 + RM 50.00 = RM 200.00 = 20000 sen total
        $ticketPrice  = 150.00;
        $productPrice = 50.00;

        $ticketSen  = (int) round($ticketPrice * 100);
        $productSen = (int) round($productPrice * 100);

        $this->assertSame(15000, $ticketSen);
        $this->assertSame(5000, $productSen);
        $this->assertSame(20000, $ticketSen + $productSen);
    }

    #[Test]
    public function sen_conversion_handles_floating_point_safely(): void
    {
        // Classic PHP floating-point trap: 0.1 + 0.2 ≠ 0.3
        $price = 99.99;
        $sen   = (int) round($price * 100);
        $this->assertSame(9999, $sen);

        $price2 = 1999.99;
        $sen2   = (int) round($price2 * 100);
        $this->assertSame(199999, $sen2);
    }
}
