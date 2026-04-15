<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreEventRegistrationRequest;
use App\Models\Event;
use App\Models\EventProduct;
use App\Models\EventRegistration;
use App\Models\EventTicket;
use App\Models\Setting;
use App\Services\ChipInService;
use App\Services\RegistrationPricingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class EventRegistrationController extends Controller
{
    /**
     * Show the public registration form for an event.
     */
    public function create(string $slug): Response
    {
        $event = Event::where('slug', $slug)
            ->where('is_published', true)
            ->where('rsvp_enabled', true)
            ->with(['media', 'venueMap'])
            ->firstOrFail();

        $tickets = $event->tickets()
            ->active()
            ->with('zone')
            ->orderBy('sort_order')
            ->get()
            ->map(function (EventTicket $ticket) {
                return [
                    'id'               => $ticket->id,
                    'name'             => $ticket->name,
                    'color'            => $ticket->color,
                    'description'      => $ticket->description,
                    'type'             => $ticket->type,
                    'price'            => $ticket->price,
                    'early_bird_price' => $ticket->early_bird_price,
                    'early_bird_end_at'=> $ticket->early_bird_end_at?->toIso8601String(),
                    'current_price'    => $ticket->current_price,
                    'is_early_bird'    => $ticket->is_early_bird,
                    'currency'         => $ticket->currency,
                    'max_per_order'    => $ticket->max_per_order,
                    'is_on_sale'       => $ticket->is_on_sale,
                    'available_count'  => $ticket->available_count,
                    'event_zone_id'    => $ticket->event_zone_id,
                    'zone'             => $ticket->zone,
                ];
            });

        $products = $event->products()
            ->active()
            ->with('media')
            ->orderBy('sort_order')
            ->get();

        $zones = $event->zones()->orderBy('sort_order')->get();

        return Inertia::render('Public/Events/Register', [
            'event'    => $event,
            'tickets'  => $tickets,
            'products' => $products,
            'zones'    => $zones,
        ]);
    }

    /**
     * Handle the registration/RSVP submission.
     */
    public function store(StoreEventRegistrationRequest $request, string $slug): RedirectResponse|\Illuminate\Http\Response
    {
        $event = Event::where('slug', $slug)
            ->where('is_published', true)
            ->where('rsvp_enabled', true)
            ->firstOrFail();

        // Verify event is still accepting registrations
        if (!$event->is_registration_open) {
            return redirect()->back()->with('error', 'Registration is no longer available for this event.');
        }

        $validated = $request->validated();

        return DB::transaction(function () use ($event, $validated) {
            // ── Pessimistic lock: prevent double-booking ─────────────────
            $ticket = EventTicket::where('id', $validated['ticket_id'])
                ->lockForUpdate()
                ->firstOrFail();

            // Verify ticket belongs to this event and is on sale
            if ($ticket->event_id !== $event->id || !$ticket->is_on_sale) {
                return redirect()->back()->with('error', 'The selected ticket is not available.');
            }

            // Re-check availability under lock
            if ($ticket->available_count !== null && $validated['quantity'] > $ticket->available_count) {
                $remaining = $ticket->available_count;
                $message = $remaining > 0
                    ? "Not enough tickets available. Only {$remaining} remaining."
                    : 'This ticket is fully booked.';
                return redirect()->back()->with('error', $message);
            }

            // Check max attendees under lock
            if ($event->max_attendees) {
                $currentCount = $event->registrations()->active()->sum('quantity');
                if ($currentCount + $validated['quantity'] > $event->max_attendees) {
                    return redirect()->back()->with('error', 'This event has reached its maximum capacity.');
                }
            }

            // ── Build product items ──────────────────────────────────────
            $productItems = [];
            if (!empty($validated['products'])) {
                foreach ($validated['products'] as $productData) {
                    $product = EventProduct::where('id', $productData['product_id'])
                        ->where('event_id', $event->id)
                        ->where('is_active', true)
                        ->lockForUpdate()
                        ->first();

                    if (!$product) {
                        continue;
                    }

                    if ($product->stock !== null && $productData['quantity'] > $product->stock) {
                        return redirect()->back()->with('error', "Not enough stock for {$product->name}. Only {$product->stock} remaining.");
                    }

                    $productItems[] = [
                        'product_id' => $product->id,
                        'variant'    => $productData['variant'] ?? null,
                        'quantity'   => $productData['quantity'],
                        'unit_price' => $product->price,
                    ];
                }
            }

            // ── Calculate pricing (with bulk discount for company users) ─
            $user = Auth::user();
            $pricingService = app(RegistrationPricingService::class);
            $pricing = $pricingService->calculateTotal($ticket, $validated['quantity'], $productItems, $user);

            $totalAmount = $pricing['grand_total'];
            $status = $event->require_approval ? 'pending' : 'confirmed';
            $paymentStatus = $totalAmount > 0 ? 'pending' : 'na';

            // For free registrations without approval, auto-confirm
            if ($totalAmount == 0 && !$event->require_approval) {
                $paymentStatus = 'na';
            }

            // Primary attendee is the first in the array (buyer)
            $primary = $validated['attendees'][0];
            $additionalAttendees = array_slice($validated['attendees'], 1);

            // Build meta_json with additional attendees if any
            $meta = [];
            if (!empty($additionalAttendees)) {
                $meta['attendees'] = array_values($additionalAttendees);
            }
            if ($pricing['discount_label']) {
                $meta['discount_label'] = $pricing['discount_label'];
            }

            $registration = EventRegistration::create([
                'event_id'             => $event->id,
                'ticket_id'            => $validated['ticket_id'],
                'user_id'              => $user?->id,
                'name'                 => $primary['name'],
                'email'                => $primary['email'],
                'phone'                => $primary['phone'] ?? null,
                'company'              => $primary['company'] ?? null,
                'job_title'            => $primary['job_title'] ?? null,
                'dietary_requirements' => $primary['dietary_requirements'] ?? null,
                'quantity'             => $validated['quantity'],
                'subtotal'             => $pricing['subtotal'],
                'discount_amount'      => $pricing['discount_amount'],
                'products_total'       => $pricing['products_total'],
                'total_amount'         => $totalAmount,
                'status'               => $status,
                'payment_status'       => $paymentStatus,
                'notes'                => $validated['notes'] ?? null,
                'meta_json'            => !empty($meta) ? $meta : null,
            ]);

            // Create product line items
            foreach ($productItems as $item) {
                $registration->products()->create($item);
            }

            // Decrement product stock (within transaction so it rolls back on failure)
            foreach ($productItems as $item) {
                EventProduct::where('id', $item['product_id'])
                    ->whereNotNull('stock')
                    ->decrement('stock', $item['quantity']);
            }

            // ── Payment Gateway Integration ──────────────────────────────────
            // If there's an amount to pay, create a Chip-In purchase and redirect
            if ($totalAmount > 0) {
                $chipIn = app(ChipInService::class);

                if ($chipIn->isConfigured()) {
                    $chipInSettings = Setting::getCached('chipin');
                    $baseUrl = url('/');

                    // Build product list for Chip-In
                    $purchaseProducts = [];

                    // Chip-In expects prices as integers in the smallest currency unit (sen for MYR)
                    // Add ticket as a product line (with discount already applied)
                    $ticketTotal = $pricing['subtotal'] - $pricing['discount_amount'];
                    $purchaseProducts[] = [
                        'name'     => $ticket->name . ($pricing['discount_label'] ? " ({$pricing['discount_label']})" : ''),
                        'price'    => (int) round($ticketTotal * 100),
                        'quantity' => 1,
                    ];

                    // Add addon products
                    foreach ($productItems as $item) {
                        $product = EventProduct::find($item['product_id']);
                        if ($product) {
                            $purchaseProducts[] = [
                                'name'     => $product->name . ($item['variant'] ? " ({$item['variant']})" : ''),
                                'price'    => (int) round($item['unit_price'] * $item['quantity'] * 100),
                                'quantity' => 1,
                            ];
                        }
                    }

                    $successRedirect = $chipInSettings['success_redirect']
                        ?? "{$baseUrl}/payment/success";
                    $failureRedirect = $chipInSettings['failure_redirect']
                        ?? "{$baseUrl}/payment/failed";

                    // Append reference to redirect URLs
                    $successRedirect .= (str_contains($successRedirect, '?') ? '&' : '?') . 'reference=' . $registration->reference_no;
                    $failureRedirect .= (str_contains($failureRedirect, '?') ? '&' : '?') . 'reference=' . $registration->reference_no;

                    $result = $chipIn->createPurchase([
                        'client' => array_filter([
                            'email'     => $registration->email,
                            'full_name' => $registration->name,
                            'phone'     => $registration->phone ?: null,
                        ], fn($v) => $v !== null),
                        'purchase' => [
                            'products' => $purchaseProducts,
                            'currency' => $ticket->currency ?? 'MYR',
                            'notes'    => "Event: {$event->title} | Ref: {$registration->reference_no}",
                        ],
                        'reference'        => $registration->reference_no,
                        'send_receipt'     => ($chipInSettings['send_receipt'] ?? '0') === '1',
                        'success_redirect' => $successRedirect,
                        'failure_redirect' => $failureRedirect,
                        // Only include success_callback in production (Chip-In rejects custom ports like :8000)
                        ...( parse_url($baseUrl, PHP_URL_PORT) === null
                            ? ['success_callback' => "{$baseUrl}/webhooks/chipin"]
                            : []
                        ),
                    ]);

                    if ($result['success'] && !empty($result['checkout_url'])) {
                        // Store the Chip-In purchase ID on the registration
                        $registration->update([
                            'payment_method'    => 'chipin',
                            'payment_reference' => $result['data']['id'] ?? null,
                            'meta_json'         => array_merge(
                                $registration->meta_json ?? [],
                                ['chipin_purchase_id' => $result['data']['id'] ?? null]
                            ),
                        ]);

                        return Inertia::location($result['checkout_url']);
                    }

                    // If Chip-In creation failed, log but still continue to confirmation
                    Log::warning('Chip-In purchase creation failed for registration', [
                        'registration_id' => $registration->id,
                        'error'           => $result['error'] ?? 'Unknown error',
                    ]);
                } else {
                    Log::warning('Chip-In gateway not configured. Registration created with pending payment.', [
                        'registration_id' => $registration->id,
                    ]);
                }
            }

            $successMessage = $totalAmount > 0
                ? 'Registration submitted! Our team will contact you with payment instructions.'
                : 'Registration successful!';

            return redirect()->route('events.register.confirmation', [
                'slug'      => $event->slug,
                'reference' => $registration->reference_no,
            ])->with('success', $successMessage);
        });
    }

    /**
     * Show the registration confirmation page.
     */
    public function confirmation(string $slug, string $reference): Response
    {
        $registration = EventRegistration::where('reference_no', $reference)
            ->with(['event.media', 'ticket', 'products.product', 'invoice'])
            ->firstOrFail();

        return Inertia::render('Public/Events/Confirmation', [
            'registration' => $registration,
        ]);
    }
}
