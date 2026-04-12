<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class InvoiceController extends Controller
{
    /**
     * Download an invoice PDF.
     * Accessible by the registration owner or admin.
     */
    public function download(Request $request, string $invoiceNumber): StreamedResponse
    {
        $invoice = Invoice::where('invoice_number', $invoiceNumber)
            ->with('registration')
            ->firstOrFail();

        // Authorization: admin can download any invoice; users can download their own
        $user = $request->user();
        if ($user) {
            $isAdmin = in_array($user->role, ['admin', 'editor']);
            $isOwner = $invoice->user_id === $user->id
                || $invoice->registration?->email === $user->email;

            if (!$isAdmin && !$isOwner) {
                abort(403);
            }
        } else {
            abort(403);
        }

        if (!$invoice->pdf_path || !Storage::disk('local')->exists($invoice->pdf_path)) {
            // Regenerate the PDF if missing
            $invoiceService = app(\App\Services\InvoiceService::class);
            $invoiceService->regeneratePdf($invoice);
            $invoice->refresh();
        }

        /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
        $disk = Storage::disk('local');

        return $disk->download(
            $invoice->pdf_path,
            $invoice->invoice_number . '.pdf',
            ['Content-Type' => 'application/pdf']
        );
    }
}
