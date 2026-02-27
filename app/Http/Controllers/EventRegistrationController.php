<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreEventRegistrationRequest;
use App\Models\Event;
use App\Models\EventProduct;
use App\Models\EventRegistration;
use App\Models\EventRegistrationProduct;
use App\Models\EventTicket;
use App\Models\Setting;
use App\Services\ChipInService;
use Illuminate\Http\RedirectResponse;
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
            ->with('media')
            ->firstOrFail();

        $tickets = $event->tickets()
            ->active()
            ->orderBy('sort_order')
            ->get()
            ->map(function (EventTicket $ticket) {
                return [
                    'id'            => $ticket->id,
                    'name'          => $ticket->name,
                    'description'   => $ticket->description,
                    'type'          => $ticket->type,
                    'price'         => $ticket->price,
                    'currency'      => $ticket->currency,
                    'max_per_order' => $ticket->max_per_order,
                    'is_on_sale'    => $ticket->is_on_sale,
                    'available_count' => $ticket->available_count,
                ];
            });

        $products = $event->products()
            ->active()
            ->with('media')
            ->orderBy('sort_order')
            ->get();

        return Inertia::render('Public/Events/Register', [
            'event'    => $event,
            'tickets'  => $tickets,
            'products' => $products,
        ]);
    }

    /**
     * Handle the registration/RSVP submission.
     */
    public function store(StoreEventRegistrationRequest $request, string $slug): RedirectResponse
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
        $ticket = EventTicket::findOrFail($validated['ticket_id']);

        // Verify ticket belongs to this event and is on sale
        if ($ticket->event_id !== $event->id || !$ticket->is_on_sale) {
            return redirect()->back()->with('error', 'The selected ticket is not available.');
        }

        // Check ticket quantity limits
        if ($ticket->available_count !== null && $validated['quantity'] > $ticket->available_count) {
            return redirect()->back()->with('error', 'Not enough tickets available. Only ' . $ticket->available_count . ' remaining.');
        }

        // Check max attendees
        if ($event->max_attendees) {
            $currentCount = $event->registration_count;
            if ($currentCount + $validated['quantity'] > $event->max_attendees) {
                return redirect()->back()->with('error', 'This event has reached its maximum capacity.');
            }
        }

        return DB::transaction(function () use ($event, $ticket, $validated) {
            // Calculate ticket subtotal
            $subtotal = $ticket->price * $validated['quantity'];

            // Calculate product totals
            $productsTotal = 0;
            $productItems = [];

            if (!empty($validated['products'])) {
                foreach ($validated['products'] as $productData) {
                    $product = EventProduct::where('id', $productData['product_id'])
                        ->where('event_id', $event->id)
                        ->where('is_active', true)
                        ->first();

                    if ($product) {
                        $lineTotal = $product->price * $productData['quantity'];
                        $productsTotal += $lineTotal;
                        $productItems[] = [
                            'product_id' => $product->id,
                            'variant'    => $productData['variant'] ?? null,
                            'quantity'   => $productData['quantity'],
                            'unit_price' => $product->price,
                        ];
                    }
                }
            }

            $totalAmount = $subtotal + $productsTotal;
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

            $registration = EventRegistration::create([
                'event_id'             => $event->id,
                'ticket_id'            => $validated['ticket_id'],
                'name'                 => $primary['name'],
                'email'                => $primary['email'],
                'phone'                => $primary['phone'] ?? null,
                'company'              => $primary['company'] ?? null,
                'job_title'            => $primary['job_title'] ?? null,
                'dietary_requirements' => $primary['dietary_requirements'] ?? null,
                'quantity'             => $validated['quantity'],
                'subtotal'             => $subtotal,
                'products_total'       => $productsTotal,
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

            // ── Payment Gateway Integration ──────────────────────────────────
            // If there's an amount to pay, create a Chip-In purchase and redirect
            if ($totalAmount > 0) {
                $chipIn = app(ChipInService::class);

                if ($chipIn->isConfigured()) {
                    $chipInSettings = Setting::getCached('chipin');
                    $baseUrl = url('/');

                    // Build product list for Chip-In
                    $purchaseProducts = [];

                    // Add ticket as a product line
                    $purchaseProducts[] = [
                        'name'     => $ticket->name,
                        'price'    => $ticket->price * $validated['quantity'],
                        'quantity' => 1,
                    ];

                    // Add addon products
                    foreach ($productItems as $item) {
                        $product = EventProduct::find($item['product_id']);
                        if ($product) {
                            $purchaseProducts[] = [
                                'name'     => $product->name . ($item['variant'] ? " ({$item['variant']})" : ''),
                                'price'    => $item['unit_price'] * $item['quantity'],
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
                        'client' => [
                            'email'     => $registration->email,
                            'full_name' => $registration->name,
                            'phone'     => $registration->phone,
                        ],
                        'purchase' => [
                            'products' => $purchaseProducts,
                            'currency' => $ticket->currency ?? 'MYR',
                            'notes'    => "Event: {$event->title} | Ref: {$registration->reference_no}",
                        ],
                        'reference'        => $registration->reference_no,
                        'send_receipt'     => ($chipInSettings['send_receipt'] ?? '0') === '1',
                        'success_redirect' => $successRedirect,
                        'failure_redirect' => $failureRedirect,
                        'success_callback' => "{$baseUrl}/webhooks/chipin",
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

                        return redirect()->away($result['checkout_url']);
                    }

                    // If Chip-In creation failed, log but still continue to confirmation
                    Log::warning('Chip-In purchase creation failed for registration', [
                        'registration_id' => $registration->id,
                        'error'           => $result['error'] ?? 'Unknown error',
                    ]);
                }
            }

            return redirect()->route('events.register.confirmation', [
                'slug'      => $event->slug,
                'reference' => $registration->reference_no,
            ])->with('success', 'Registration successful!');
        });
    }

    /**
     * Show the registration confirmation page.
     */
    public function confirmation(string $slug, string $reference): Response
    {
        $registration = EventRegistration::where('reference_no', $reference)
            ->with(['event.media', 'ticket', 'products.product'])
            ->firstOrFail();

        return Inertia::render('Public/Events/Confirmation', [
            'registration' => $registration,
        ]);
    }
}
