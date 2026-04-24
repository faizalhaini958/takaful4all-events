<?php

namespace App\Observers;

use App\Mail\RegistrationConfirmationMail;
use App\Models\EventRegistration;
use App\Models\Invoice;
use App\Services\InvoiceService;
use App\Services\TicketService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class EventRegistrationObserver
{
    public function __construct(
        private readonly InvoiceService $invoiceService,
        private readonly TicketService  $ticketService,
    ) {}

    public function created(EventRegistration $registration): void
    {
        $registration->ensureAttendeesExist();
    }

    /**
     * Handle the "updated" event.
     * Triggers when payment_status changes to 'paid':
     *  1. Auto-generates the Invoice PDF.
     *  2. Pre-generates all attendee ticket PDFs.
     *  3. Queues the confirmation email with download links.
     */
    public function updated(EventRegistration $registration): void
    {
        if (
            !$registration->wasChanged('payment_status') ||
            $registration->payment_status !== 'paid'
        ) {
            return;
        }

        // 1. Generate / retrieve invoice
        try {
            if (!Invoice::where('registration_id', $registration->id)->exists()) {
                $this->invoiceService->generate($registration);
            }
        } catch (\Throwable $e) {
            Log::error('Failed to auto-generate invoice', [
                'registration_id' => $registration->id,
                'error'           => $e->getMessage(),
            ]);
        }

        // 2. Pre-generate all attendee ticket PDFs so download links work immediately
        try {
            $registration->loadMissing(['event', 'ticket', 'attendees']);
            $this->ticketService->generateForRegistration($registration);
        } catch (\Throwable $e) {
            Log::error('Failed to pre-generate ticket PDFs', [
                'registration_id' => $registration->id,
                'error'           => $e->getMessage(),
            ]);
        }

        // 3. Queue the confirmation email
        try {
            $registration->loadMissing(['invoice']);
            Mail::to($registration->email)
                ->queue(new RegistrationConfirmationMail($registration));

            Log::info('Confirmation email queued for registration', [
                'registration_id' => $registration->id,
                'email'           => $registration->email,
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to queue confirmation email', [
                'registration_id' => $registration->id,
                'error'           => $e->getMessage(),
            ]);
        }
    }
}
