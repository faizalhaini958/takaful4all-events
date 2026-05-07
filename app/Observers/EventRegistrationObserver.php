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

        // Bug 1 fix: Free registrations that are auto-confirmed on creation
        // (payment_status = 'na', status = 'confirmed') never go through the
        // payment flow, so updated() never fires. Send the confirmation email here.
        if ($registration->payment_status === 'na' && $registration->status === 'confirmed') {
            $this->sendConfirmationEmail($registration);
        }
    }

    /**
     * Handle the "updated" event.
     * Triggers when:
     *  (a) payment_status changes to 'paid' — paid ticket flow via Chip-In
     *  (b) status changes to 'confirmed' and payment_status is 'na' — admin
     *      approves a free registration that required manual approval (Bug 2 fix)
     *
     * Actions:
     *  1. Creates invoice record (PDF generated on-demand when clicked).
     *  2. Queues the confirmation email with download links.
     *  3. Tickets/invoices PDFs are generated on-demand in HTTP context (faster & more reliable).
     */
    public function updated(EventRegistration $registration): void
    {
        $justPaid     = $registration->wasChanged('payment_status') && $registration->payment_status === 'paid';
        $justApproved = $registration->wasChanged('status')
            && $registration->status === 'confirmed'
            && $registration->payment_status === 'na';

        if (!$justPaid && !$justApproved) {
            return;
        }

        // 1. Create invoice record for paid registrations only
        if ($justPaid) {
            try {
                if (!Invoice::where('registration_id', $registration->id)->exists()) {
                    $this->invoiceService->generate($registration);
                }
            } catch (\Throwable $e) {
                Log::error('Failed to create invoice record', [
                    'registration_id' => $registration->id,
                    'error'           => $e->getMessage(),
                ]);
            }

            // 2. Dispatch async PDF generation job
            try {
                \App\Jobs\GenerateRegistrationPdfs::dispatch($registration);
                Log::info('Dispatched PDF generation job', [
                    'registration_id' => $registration->id,
                ]);
            } catch (\Throwable $e) {
                Log::warning('Failed to dispatch PDF generation job', [
                    'registration_id' => $registration->id,
                    'error' => $e->getMessage(),
                    'note' => 'PDFs will be generated on-demand when downloaded',
                ]);
            }
        }

        // 3. Queue confirmation email
        $this->sendConfirmationEmail($registration);
    }

    private function sendConfirmationEmail(EventRegistration $registration): void
    {
        // Safety guard — never send confirmation email for non-confirmed registrations
        if (!in_array($registration->status, ['confirmed', 'attended'])) {
            Log::warning('Skipped confirmation email — registration not yet confirmed', [
                'registration_id' => $registration->id,
                'status'          => $registration->status,
            ]);
            return;
        }

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
