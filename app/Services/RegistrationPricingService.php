<?php

namespace App\Services;

use App\Models\EventTicket;
use App\Models\PromoCode;
use App\Models\TicketDiscountTier;
use App\Models\User;

class RegistrationPricingService
{
    /**
     * Calculate the total cost for a registration, including any company bulk discount.
     *
     * @param  array<array{product_id: int, quantity: int, unit_price: float}>  $productItems
     * @return array{subtotal: float, discount_amount: float, discount_label: string|null, products_total: float, promo_code_discount: float, promo_code_id: int|null, promo_code_error: string|null, grand_total: float}
     */
    public function calculateTotal(
        EventTicket $ticket,
        int $quantity,
        array $productItems = [],
        ?User $user = null,
        ?string $promoCodeInput = null,
    ): array {
        $subtotal = (float) $ticket->current_price * $quantity;
        $discountAmount = 0.0;
        $discountLabel = null;
        $promoCodeDiscount = 0.0;
        $promoCodeId = null;
        $promoCodeError = null;

        // Apply bulk discount for company accounts
        if ($user && $user->isCompany()) {
            $tier = $this->getApplicableTier($ticket, $quantity);

            if ($tier) {
                if ($tier->discount_type === 'percentage') {
                    $discountAmount = round($subtotal * ($tier->discount_value / 100), 2);
                    $discountLabel = "{$tier->discount_value}% bulk discount ({$quantity}+ tickets)";
                } else {
                    $discountAmount = round((float) $tier->discount_value * $quantity, 2);
                    $discountLabel = "RM{$tier->discount_value} off per ticket ({$quantity}+ tickets)";
                }

                $discountAmount = min($discountAmount, $subtotal);
            }
        }

        // Apply promo code discount (only if no bulk discount applies)
        if ($promoCodeInput && $discountAmount === 0.0) {
            $promoResult = $this->applyPromoCode($promoCodeInput, $subtotal, $user, $ticket->event_id);

            if ($promoResult['success']) {
                $promoCodeDiscount = $promoResult['discount'];
                $promoCodeId = $promoResult['promo_code_id'];
                $discountLabel = $promoResult['label'];
            } else {
                $promoCodeError = $promoResult['error'];
            }
        }

        $totalDiscount = $discountAmount + $promoCodeDiscount;
        $totalDiscount = min($totalDiscount, $subtotal);

        $productsTotal = 0.0;
        foreach ($productItems as $item) {
            $productsTotal += (float) $item['unit_price'] * $item['quantity'];
        }

        $grandTotal = $subtotal - $totalDiscount + $productsTotal;

        return [
            'subtotal'           => round($subtotal, 2),
            'discount_amount'    => round($totalDiscount, 2),
            'discount_label'     => $discountLabel,
            'products_total'     => round($productsTotal, 2),
            'promo_code_discount' => round($promoCodeDiscount, 2),
            'promo_code_id'      => $promoCodeId,
            'promo_code_error'   => $promoCodeError,
            'grand_total'        => round(max(0, $grandTotal), 2),
        ];
    }

    /**
     * Validate and calculate a promo code discount.
     *
     * @return array{success: bool, discount?: float, promo_code_id?: int, label?: string, error?: string}
     */
    public function applyPromoCode(string $code, float $subtotal, ?User $user, ?int $eventId): array
    {
        $promoCode = PromoCode::where('code', strtoupper(trim($code)))->lockForUpdate()->first();

        if (! $promoCode) {
            return ['success' => false, 'error' => 'Invalid promo code.'];
        }

        if (! $promoCode->is_active) {
            return ['success' => false, 'error' => 'This promo code is no longer active.'];
        }

        if ($promoCode->starts_at && now()->lt($promoCode->starts_at)) {
            return ['success' => false, 'error' => 'This promo code is not yet valid.'];
        }

        if ($promoCode->expires_at && now()->gt($promoCode->expires_at)) {
            return ['success' => false, 'error' => 'This promo code has expired.'];
        }

        if ($promoCode->max_uses !== null && $promoCode->used_count >= $promoCode->max_uses) {
            return ['success' => false, 'error' => 'This promo code has reached its maximum usage limit.'];
        }

        if ($promoCode->event_id !== null && $promoCode->event_id !== $eventId) {
            return ['success' => false, 'error' => 'This promo code is not valid for this event.'];
        }

        if (! $promoCode->canBeUsedByUser($user?->id)) {
            return ['success' => false, 'error' => 'You have already used this promo code the maximum number of times.'];
        }

        if ($promoCode->min_order_amount !== null && $subtotal < $promoCode->min_order_amount) {
            return [
                'success' => false,
                'error' => "Minimum order of RM{$promoCode->min_order_amount} required for this promo code.",
            ];
        }

        if ($promoCode->discount_type === 'percentage') {
            $discount = round($subtotal * ($promoCode->discount_value / 100), 2);
            $label = "{$promoCode->discount_value}% promo code ({$promoCode->code})";
        } else {
            $discount = (float) $promoCode->discount_value;
            $discount = min($discount, $subtotal);
            $label = "RM{$promoCode->discount_value} off promo code ({$promoCode->code})";
        }

        return [
            'success'       => true,
            'discount'       => $discount,
            'promo_code_id' => $promoCode->id,
            'label'          => $label,
        ];
    }

    /**
     * Find the highest qualifying discount tier for a ticket and quantity.
     */
    public function getApplicableTier(EventTicket $ticket, int $quantity): ?TicketDiscountTier
    {
        return $ticket->discountTiers()
            ->forQuantity($quantity)
            ->first();
    }
}
