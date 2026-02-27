<?php

namespace App\Http\Controllers;

use App\Models\EventRegistration;
use App\Models\Setting;
use App\Services\ChipInService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ChipInWebhookController extends Controller
{
    /**
     * Handle incoming Chip-In webhooks.
     *
     * Endpoint: POST /webhooks/chipin
     */
    public function handle(Request $request): JsonResponse
    {
        $payload = $request->getContent();
        $data    = json_decode($payload, true);

        if (! $data) {
            Log::warning('ChipIn webhook: Invalid JSON payload');
            return response()->json(['error' => 'Invalid payload'], 400);
        }

        // Verify signature if webhook secret (public key) is configured
        $webhookSecret = Setting::get('chipin', 'webhook_secret');
        if ($webhookSecret) {
            $signature = $request->header('X-Signature');
            if (! $signature || ! ChipInService::verifyWebhookSignature($payload, $signature, $webhookSecret)) {
                Log::warning('ChipIn webhook: Invalid signature', [
                    'ip' => $request->ip(),
                ]);
                return response()->json(['error' => 'Invalid signature'], 403);
            }
        }

        $eventType = $data['event_type'] ?? null;
        $purchaseId = $data['id'] ?? null;

        Log::info('ChipIn webhook received', [
            'event_type'  => $eventType,
            'purchase_id' => $purchaseId,
            'status'      => $data['status'] ?? null,
        ]);

        return match ($eventType) {
            'purchase.paid'             => $this->handlePurchasePaid($data),
            'purchase.payment_failure'  => $this->handlePaymentFailure($data),
            'purchase.cancelled'        => $this->handlePurchaseCancelled($data),
            'payment.refunded'          => $this->handlePaymentRefunded($data),
            'purchase.pending_execute'  => $this->handlePendingExecute($data),
            default                     => $this->handleUnknownEvent($eventType, $data),
        };
    }

    /**
     * Purchase paid successfully.
     */
    protected function handlePurchasePaid(array $data): JsonResponse
    {
        $reference = $data['reference'] ?? null;

        if ($reference) {
            $registration = EventRegistration::where('payment_reference', $reference)
                ->orWhere('reference_no', $reference)
                ->first();

            if ($registration) {
                $registration->update([
                    'payment_status'    => 'paid',
                    'payment_method'    => $data['transaction_data']['payment_method'] ?? 'chipin',
                    'payment_reference' => $data['id'] ?? $registration->payment_reference,
                    'meta_json'         => array_merge(
                        $registration->meta_json ?? [],
                        ['chipin_paid_at' => now()->toIso8601String(), 'chipin_purchase_id' => $data['id'] ?? null]
                    ),
                ]);

                // If payment is received, auto-confirm if pending
                if ($registration->status === 'pending') {
                    $registration->update(['status' => 'confirmed']);
                }

                Log::info('ChipIn payment confirmed for registration', [
                    'registration_id' => $registration->id,
                    'reference'       => $reference,
                ]);
            } else {
                Log::warning('ChipIn webhook: No registration found for reference', [
                    'reference' => $reference,
                ]);
            }
        }

        return response()->json(['status' => 'ok']);
    }

    /**
     * Payment failed.
     */
    protected function handlePaymentFailure(array $data): JsonResponse
    {
        $reference = $data['reference'] ?? null;

        if ($reference) {
            $registration = EventRegistration::where('payment_reference', $reference)
                ->orWhere('reference_no', $reference)
                ->first();

            if ($registration) {
                $registration->update([
                    'meta_json' => array_merge(
                        $registration->meta_json ?? [],
                        [
                            'chipin_payment_failure' => now()->toIso8601String(),
                            'chipin_error'           => $data['transaction_data']['attempts'][0]['error'] ?? null,
                        ]
                    ),
                ]);

                Log::info('ChipIn payment failure for registration', [
                    'registration_id' => $registration->id,
                ]);
            }
        }

        return response()->json(['status' => 'ok']);
    }

    /**
     * Purchase cancelled.
     */
    protected function handlePurchaseCancelled(array $data): JsonResponse
    {
        $reference = $data['reference'] ?? null;

        if ($reference) {
            $registration = EventRegistration::where('payment_reference', $reference)
                ->orWhere('reference_no', $reference)
                ->first();

            if ($registration && $registration->payment_status === 'pending') {
                $registration->update([
                    'payment_status' => 'na',
                    'meta_json'      => array_merge(
                        $registration->meta_json ?? [],
                        ['chipin_cancelled_at' => now()->toIso8601String()]
                    ),
                ]);
            }
        }

        return response()->json(['status' => 'ok']);
    }

    /**
     * Payment refunded.
     */
    protected function handlePaymentRefunded(array $data): JsonResponse
    {
        // The refund payload contains a Payment object with related_to referencing the original Purchase
        $relatedPurchaseId = $data['related_to'][0]['id'] ?? null;

        if ($relatedPurchaseId) {
            $registration = EventRegistration::whereJsonContains('meta_json->chipin_purchase_id', $relatedPurchaseId)
                ->first();

            if ($registration) {
                $registration->update([
                    'payment_status' => 'refunded',
                    'meta_json'      => array_merge(
                        $registration->meta_json ?? [],
                        ['chipin_refunded_at' => now()->toIso8601String()]
                    ),
                ]);

                Log::info('ChipIn payment refunded for registration', [
                    'registration_id' => $registration->id,
                ]);
            }
        }

        return response()->json(['status' => 'ok']);
    }

    /**
     * Pending execution — payment is processing.
     */
    protected function handlePendingExecute(array $data): JsonResponse
    {
        Log::info('ChipIn purchase pending execution', ['purchase_id' => $data['id'] ?? null]);
        return response()->json(['status' => 'ok']);
    }

    /**
     * Unknown webhook event.
     */
    protected function handleUnknownEvent(?string $eventType, array $data): JsonResponse
    {
        Log::info('ChipIn webhook: Unhandled event type', [
            'event_type' => $eventType,
            'data'       => $data,
        ]);

        return response()->json(['status' => 'ok']);
    }
}
