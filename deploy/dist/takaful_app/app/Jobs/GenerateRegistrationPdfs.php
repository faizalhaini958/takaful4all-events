<?php

namespace App\Jobs;

use App\Models\EventRegistration;
use App\Services\InvoiceService;
use App\Services\TicketService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class GenerateRegistrationPdfs implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted.
     */
    public $tries = 3;

    /**
     * The number of seconds to wait before retrying the job.
     */
    public $backoff = 30;

    /**
     * The number of seconds the job can run before timing out.
     */
    public $timeout = 120;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public EventRegistration $registration
    ) {}

    /**
     * Execute the job.
     * Generates invoice and ticket PDFs in background.
     */
    public function handle(InvoiceService $invoiceService, TicketService $ticketService): void
    {
        $this->registration->loadMissing(['invoice', 'attendees']);

        // Generate invoice PDF
        if ($invoice = $this->registration->invoice) {
            try {
                $invoiceService->generatePdf($invoice);
                Log::info('Generated invoice PDF via queue', [
                    'invoice_number' => $invoice->invoice_number,
                    'registration_id' => $this->registration->id,
                ]);
            } catch (\Throwable $e) {
                Log::error('Failed to generate invoice PDF in queue', [
                    'invoice_number' => $invoice->invoice_number,
                    'registration_id' => $this->registration->id,
                    'error' => $e->getMessage(),
                ]);
                // Don't throw - let synchronous fallback handle it
            }
        }

        // Generate all ticket PDFs
        try {
            $ticketService->generateAllForRegistration($this->registration);
            Log::info('Generated ticket PDFs via queue', [
                'registration_id' => $this->registration->id,
                'ticket_count' => $this->registration->attendees->count(),
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to generate ticket PDFs in queue', [
                'registration_id' => $this->registration->id,
                'error' => $e->getMessage(),
            ]);
            // Don't throw - let synchronous fallback handle it
        }
    }

    /**
     * Handle a job failure.
     * Logs warning instead of throwing - synchronous fallback handles failures.
     */
    public function failed(\Throwable $exception): void
    {
        Log::warning('PDF generation job failed after max retries', [
            'registration_id' => $this->registration->id,
            'error' => $exception->getMessage(),
            'note' => 'PDFs will be generated on-demand when user downloads',
        ]);
    }
}
