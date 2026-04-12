<?php

namespace App\Observers;

use App\Models\EventRegistration;
use App\Models\Invoice;
use App\Services\InvoiceService;
use Illuminate\Support\Facades\Log;

class EventRegistrationObserver
{
    public function __construct(
        private readonly InvoiceService $invoiceService,
    ) {}

    /**
     * Handle the "updated" event — auto-generate invoice when payment_status becomes 'paid'.
     */
    public function updated(EventRegistration $registration): void
    {
        // Only trigger when payment_status changes to 'paid'
        if (
            $registration->wasChanged('payment_status') &&
            $registration->payment_status === 'paid'
        ) {
            // Don't create a duplicate invoice
            if (Invoice::where('registration_id', $registration->id)->exists()) {
                return;
            }

            try {
                $this->invoiceService->generate($registration);

                Log::info('Invoice auto-generated for registration', [
                    'registration_id' => $registration->id,
                    'reference_no'    => $registration->reference_no,
                ]);
            } catch (\Throwable $e) {
                Log::error('Failed to auto-generate invoice', [
                    'registration_id' => $registration->id,
                    'error'           => $e->getMessage(),
                ]);
            }
        }
    }
}
