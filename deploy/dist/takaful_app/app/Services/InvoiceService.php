<?php

namespace App\Services;

use App\Models\EventRegistration;
use App\Models\Invoice;
use App\Models\Setting;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class InvoiceService
{
    /**
     * Create an invoice record for a paid registration.
     * PDF generation happens asynchronously via queue job.
     */
    public function generate(EventRegistration $registration): Invoice
    {
        $registration->loadMissing(['event', 'ticket', 'products.product', 'user']);

        // Determine company info from the registration's free-text company field
        $companyName = $registration->company;
        $companyRegNo = null;

        return Invoice::create([
            'registration_id'       => $registration->id,
            'user_id'               => $registration->user_id,
            'invoice_number'        => Invoice::generateInvoiceNumber(),
            'company_name'          => $companyName,
            'company_registration_no' => $companyRegNo,
            'subtotal'              => $registration->subtotal,
            'discount_amount'       => $registration->discount_amount,
            'total_amount'          => $registration->total_amount,
            'issued_at'             => now(),
            'meta_json'             => [
                'event_title'   => $registration->event?->title,
                'ticket_name'   => $registration->ticket?->name,
                'quantity'      => $registration->quantity,
                'attendee_name' => $registration->name,
                'attendee_email' => $registration->email,
            ],
        ]);
    }

    /**
     * Stream invoice PDF as download response.
     * Generates on-demand if not cached (synchronous fallback).
     */
    public function download(Invoice $invoice): StreamedResponse
    {
        $pdfPath = $this->getOrGeneratePdf($invoice);
        
        return Storage::disk('local')->download(
            $pdfPath,
            $invoice->invoice_number . '.pdf',
            ['Content-Type' => 'application/pdf']
        );
    }

    /**
     * Get cached PDF path, generate if missing.
     * Returns storage-relative path (e.g., "invoices/2026/INV-123.pdf").
     */
    public function getOrGeneratePdf(Invoice $invoice): string
    {
        $invoice->loadMissing('registration');
        
        // Check if cached PDF exists
        if ($invoice->pdf_path && Storage::disk('local')->exists($invoice->pdf_path)) {
            return $invoice->pdf_path;
        }

        // Generate and cache
        return $this->generatePdf($invoice);
    }

    /**
     * Generate invoice PDF and cache to storage/app/invoices/.
     * Updates invoice.pdf_path column.
     * Caches forever - invoices are immutable financial records.
     */
    public function generatePdf(Invoice $invoice): string
    {
        $registration = $invoice->registration;
        $registration->loadMissing(['event', 'ticket', 'products.product']);

        $dompdfPublicPath = $this->resolveDompdfPublicPath();
        Config::set('dompdf.public_path', $dompdfPublicPath);

        // Get invoicing settings
        $invoiceSettings = Setting::getGroup('invoicing');

        // Generate PDF with explicit public path scope
        $pdf = Pdf::setOption('chroot', $dompdfPublicPath)
            ->loadView('invoices.template', [
                'invoice'      => $invoice,
                'registration' => $registration,
                'event'        => $registration->event,
                'ticket'       => $registration->ticket,
                'products'     => $registration->products,
                'settings'     => $invoiceSettings,
            ]);

        // Cache to storage/app/invoices/{year}/{invoice_number}.pdf
        $year = now()->format('Y');
        $relativePath = "invoices/{$year}/{$invoice->invoice_number}.pdf";

        Storage::disk('local')->put($relativePath, $pdf->output());

        // Update invoice record
        $invoice->update(['pdf_path' => $relativePath]);

        return $relativePath;
    }

    /**
     * Resolve a real public path for DomPDF on shared hosting.
     */
    private function resolveDompdfPublicPath(): string
    {
        $candidates = [
            env('APP_PUBLIC_PATH'),
            public_path(),
            dirname(base_path()) . '/public_html',
            base_path('../public_html'),
            storage_path('app/public'),
            base_path('public'),
            '/home/takaful/public_html/events-v2.takaful4all.org',
        ];

        foreach ($candidates as $candidate) {
            if (!empty($candidate) && is_dir($candidate)) {
                return $candidate;
            }
        }

        Log::warning('DomPDF public path resolution failed in InvoiceService', [
            'candidates' => $candidates,
        ]);

        return base_path();
    }
}
