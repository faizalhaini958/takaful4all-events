<?php

namespace App\Services;

use App\Models\EventRegistration;
use App\Models\EventRegistrationAttendee;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TicketService
{
    private const PDF_LAYOUT_VERSION = 'v2';

    /**
     * Stream ticket PDF as download response.
     * Generates on-demand if not cached (synchronous fallback).
     */
    public function download(EventRegistration $registration, int $attendeeNo): StreamedResponse
    {
        $attendee = $registration->attendees()->where('attendee_no', $attendeeNo)->firstOrFail();
        $pdfPath = $this->getOrGeneratePdf($registration, $attendee);
        
        $filename = $registration->reference_no . '-ticket-' . str_pad($attendeeNo, 2, '0', STR_PAD_LEFT) . '.pdf';
        
        return Storage::disk('local')->download(
            $pdfPath,
            $filename,
            ['Content-Type' => 'application/pdf']
        );
    }

    /**
     * Get cached ticket PDF path, generate if missing.
     * Returns storage-relative path (e.g., "tickets/2026/EVT-123-01.pdf").
     */
    public function getOrGeneratePdf(EventRegistration $registration, EventRegistrationAttendee $attendee): string
    {
        $year = now()->format('Y');
        $safeName = preg_replace('/[^A-Z0-9\-]/', '', strtoupper($registration->reference_no));
        $attendeeNo = str_pad($attendee->attendee_no, 2, '0', STR_PAD_LEFT);
        $relativePath = "tickets/" . self::PDF_LAYOUT_VERSION . "/{$year}/{$safeName}-{$attendeeNo}.pdf";

        // Check if cached PDF exists
        if (Storage::disk('local')->exists($relativePath)) {
            return $relativePath;
        }

        // Generate and cache
        return $this->generatePdf($registration, $attendee);
    }

    /**
     * Generate ticket PDF and cache to storage/app/tickets/.
     * Caches forever - tickets are immutable financial records.
     */
    public function generatePdf(EventRegistration $registration, EventRegistrationAttendee $attendee): string
    {
        $registration->loadMissing(['event', 'ticket']);

        $dompdfPublicPath = $this->resolveDompdfPublicPath();
        Config::set('dompdf.public_path', $dompdfPublicPath);

        // Build QR code encoding attendee-specific reference
        $qrData = json_encode([
            'ref'         => $registration->reference_no,
            'attendee_no' => $attendee->attendee_no,
        ]);

        $qrCode = base64_encode(
            QrCode::format('png')
                ->size(160)
                ->margin(1)
                ->generate($qrData)
        );

        // Generate PDF with explicit public path scope
        $pdf = Pdf::setOption('chroot', $dompdfPublicPath)
            ->loadView('tickets.template', [
                'registration' => $registration,
                'attendee'     => $attendee,
                'qrCode'       => $qrCode,
            ])
            ->setPaper('a5', 'landscape');

        // Cache to storage/app/tickets/{year}/{ref}-{attendeeNo}.pdf
        $year = now()->format('Y');
        $safeName = preg_replace('/[^A-Z0-9\-]/', '', strtoupper($registration->reference_no));
        $attendeeNo = str_pad($attendee->attendee_no, 2, '0', STR_PAD_LEFT);
        $relativePath = "tickets/" . self::PDF_LAYOUT_VERSION . "/{$year}/{$safeName}-{$attendeeNo}.pdf";

        Storage::disk('local')->put($relativePath, $pdf->output());

        return $relativePath;
    }

    /**
     * Generate all ticket PDFs for a registration.
     * Returns array of storage-relative paths, keyed by attendee_no.
     */
    public function generateAllForRegistration(EventRegistration $registration): array
    {
        $registration->loadMissing(['event', 'ticket', 'attendees']);

        $paths = [];
        foreach ($registration->attendees as $attendee) {
            $paths[$attendee->attendee_no] = $this->generatePdf($registration, $attendee);
        }

        return $paths;
    }

    /**
     * Get download URL for ticket.
     */
    public function getDownloadUrl(EventRegistration $registration, int $attendeeNo = 1): string
    {
        return route('tickets.download', [
            'registration' => $registration->id,
            'attendee_no'  => $attendeeNo,
        ]);
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

        Log::warning('DomPDF public path resolution failed in TicketService', [
            'candidates' => $candidates,
        ]);

        return base_path();
    }
}
