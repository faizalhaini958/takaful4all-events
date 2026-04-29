<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class InvoiceController extends Controller
{
    /**
     * Download an invoice PDF.
     * Uses cached PDF or generates on-demand (synchronous fallback).
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

        // Use cached PDF or generate on-demand
        $invoiceService = app(\App\Services\InvoiceService::class);
        return $invoiceService->download($invoice);
    }
}
