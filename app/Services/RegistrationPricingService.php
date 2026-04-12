<?php

namespace App\Services;

use App\Models\EventTicket;
use App\Models\TicketDiscountTier;
use App\Models\User;

class RegistrationPricingService
{
    /**
     * Calculate the total cost for a registration, including any company bulk discount.
     *
     * @param  array<array{product_id: int, quantity: int, unit_price: float}>  $productItems
     * @return array{subtotal: float, discount_amount: float, discount_label: string|null, products_total: float, grand_total: float}
     */
    public function calculateTotal(
        EventTicket $ticket,
        int $quantity,
        array $productItems = [],
        ?User $user = null,
    ): array {
        $subtotal = (float) $ticket->current_price * $quantity;
        $discountAmount = 0.0;
        $discountLabel = null;

        // Apply bulk discount for company accounts
        if ($user && $user->isCompany()) {
            $tier = $this->getApplicableTier($ticket, $quantity);

            if ($tier) {
                if ($tier->discount_type === 'percentage') {
                    $discountAmount = round($subtotal * ($tier->discount_value / 100), 2);
                    $discountLabel = "{$tier->discount_value}% bulk discount ({$quantity}+ tickets)";
                } else {
                    // Fixed discount per ticket
                    $discountAmount = round((float) $tier->discount_value * $quantity, 2);
                    $discountLabel = "RM{$tier->discount_value} off per ticket ({$quantity}+ tickets)";
                }

                // Discount cannot exceed subtotal
                $discountAmount = min($discountAmount, $subtotal);
            }
        }

        $productsTotal = 0.0;
        foreach ($productItems as $item) {
            $productsTotal += (float) $item['unit_price'] * $item['quantity'];
        }

        $grandTotal = $subtotal - $discountAmount + $productsTotal;

        return [
            'subtotal'        => round($subtotal, 2),
            'discount_amount' => round($discountAmount, 2),
            'discount_label'  => $discountLabel,
            'products_total'  => round($productsTotal, 2),
            'grand_total'     => round(max(0, $grandTotal), 2),
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
