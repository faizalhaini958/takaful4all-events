<?php

namespace App\Services;

use App\Models\EventRegistration;
use App\Models\Invoice;
use App\Models\Setting;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class InvoiceService
{
    /**
     * Generate an invoice for a paid registration.
     */
    public function generate(EventRegistration $registration): Invoice
    {
        $registration->loadMissing(['event', 'ticket', 'products.product', 'user']);

        // Determine company info (from user profile if company, else from registration)
        $companyName = null;
        $companyRegNo = null;

        if ($registration->user && $registration->user->isCompany()) {
            $companyName = $registration->user->company_name;
            $companyRegNo = $registration->user->company_registration_no;
        } elseif ($registration->company) {
            $companyName = $registration->company;
        }

        $invoice = Invoice::create([
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

        $this->generatePdf($invoice, $registration);

        return $invoice;
    }

    /**
     * Generate the PDF file and save to storage.
     */
    public function generatePdf(Invoice $invoice, EventRegistration $registration): string
    {
        $registration->loadMissing(['event', 'ticket', 'products.product']);

        // Generate QR code as base64 for embedding in the PDF
        $confirmationUrl = url("/events/{$registration->event->slug}/register/confirmation/{$registration->reference_no}");
        $qrCode = base64_encode(
            QrCode::format('png')->size(150)->generate($confirmationUrl)
        );

        // Get invoicing settings
        $invoiceSettings = Setting::getGroup('invoicing');

        $pdf = Pdf::loadView('invoices.template', [
            'invoice'      => $invoice,
            'registration' => $registration,
            'event'        => $registration->event,
            'ticket'       => $registration->ticket,
            'products'     => $registration->products,
            'qrCode'       => $qrCode,
            'settings'     => $invoiceSettings,
        ]);

        $year = now()->format('Y');
        $relativePath = "invoices/{$year}/{$invoice->invoice_number}.pdf";

        Storage::disk('local')->put($relativePath, $pdf->output());

        $invoice->update(['pdf_path' => $relativePath]);

        return $relativePath;
    }

    /**
     * Regenerate an existing invoice PDF.
     */
    public function regeneratePdf(Invoice $invoice): string
    {
        $registration = $invoice->registration;

        return $this->generatePdf($invoice, $registration);
    }
}
