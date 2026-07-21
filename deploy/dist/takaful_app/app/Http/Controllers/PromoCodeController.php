<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\EventTicket;
use App\Services\RegistrationPricingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PromoCodeController extends Controller
{
    /**
     * Validate a promo code and return the discounted price for a given ticket + quantity.
     * Called via AJAX from the registration form.
     */
    public function validate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code'       => 'required|string|max:50',
            'ticket_id'  => 'required|exists:event_tickets,id',
            'quantity'   => 'required|integer|min:1|max:10',
        ]);

        $ticket = EventTicket::findOrFail($validated['ticket_id']);
        $user = Auth::user();
        $pricingService = app(RegistrationPricingService::class);

        $result = $pricingService->applyPromoCode(
            $validated['code'],
            (float) $ticket->current_price * (int) $validated['quantity'],
            $user,
            $ticket->event_id,
        );

        if (! $result['success']) {
            return response()->json([
                'valid' => false,
                'error' => $result['error'],
            ]);
        }

        return response()->json([
            'valid'        => true,
            'discount'     => $result['discount'],
            'label'        => $result['label'],
            'promo_code_id' => $result['promo_code_id'],
        ]);
    }
}
