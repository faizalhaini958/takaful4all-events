<?php

namespace App\Http\Controllers;

use App\Models\EventRegistration;
use App\Services\ChipInService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PaymentController extends Controller
{
    /**
     * Payment success page.
     */
    public function success(Request $request): Response
    {
        $purchaseId = $request->query('purchase_id');
        $reference = $request->query('reference');

        $registration = null;

        // Try to find the registration by reference or purchase_id
        if ($reference) {
            $registration = EventRegistration::with(['event.media', 'ticket'])
                ->where('reference_no', $reference)
                ->first();
        }

        if (! $registration && $purchaseId) {
            $registration = EventRegistration::with(['event.media', 'ticket'])
                ->where('payment_reference', $purchaseId)
                ->orWhereJsonContains('meta_json->chipin_purchase_id', $purchaseId)
                ->first();
        }

        return Inertia::render('Public/Payment/Success', [
            'registration' => $registration,
        ]);
    }

    /**
     * Payment failure page.
     */
    public function failure(Request $request): Response
    {
        $purchaseId = $request->query('purchase_id');
        $reference = $request->query('reference');

        $registration = null;

        if ($reference) {
            $registration = EventRegistration::with(['event.media', 'ticket'])
                ->where('reference_no', $reference)
                ->first();
        }

        if (! $registration && $purchaseId) {
            $registration = EventRegistration::with(['event.media', 'ticket'])
                ->where('payment_reference', $purchaseId)
                ->orWhereJsonContains('meta_json->chipin_purchase_id', $purchaseId)
                ->first();
        }

        return Inertia::render('Public/Payment/Failure', [
            'registration' => $registration,
        ]);
    }
}
