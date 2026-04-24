<?php

namespace App\Services;

use App\Models\EventRegistration;
use App\Models\EventRegistrationAttendee;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class TicketService
{
    /**
     * Generate PDF tickets for all attendees in a registration.
     * Returns an array of storage-relative paths, keyed by attendee_no.
     *
     * @return array<int, string>
     */
    public function generateForRegistration(EventRegistration $registration): array
    {
        $registration->loadMissing(['event', 'ticket', 'attendees']);

        $paths = [];
        foreach ($registration->attendees as $attendee) {
            $paths[$attendee->attendee_no] = $this->generateForAttendee($registration, $attendee);
        }

        return $paths;
    }

    /**
     * Generate a single PDF ticket for one attendee.
     */
    public function generateForAttendee(EventRegistration $registration, EventRegistrationAttendee $attendee): string
    {
        $registration->loadMissing(['event', 'ticket']);

        // Build a QR code encoding attendee-specific reference, e.g. EVT-20260424-ABCD-01
        $qrData = json_encode([
            'ref'         => $registration->reference_no,
            'attendee_no' => $attendee->attendee_no,
        ]);

        $qrCode = base64_encode(
            QrCode::format('png')->size(200)->generate($qrData)
        );

        $pdf = Pdf::loadView('tickets.template', [
            'registration' => $registration,
            'attendee'     => $attendee,
            'qrCode'       => $qrCode,
        ])->setPaper([0, 0, 595, 240], 'portrait'); // A custom landscape-ish size for a ticket

        $year      = now()->format('Y');
        $safeName  = preg_replace('/[^A-Z0-9\-]/', '', strtoupper($registration->reference_no));
        $attendeeNo = str_pad($attendee->attendee_no, 2, '0', STR_PAD_LEFT);
        $path      = "tickets/{$year}/{$safeName}-{$attendeeNo}.pdf";

        Storage::disk('local')->put($path, $pdf->output());

        return $path;
    }

    /**
     * Get a signed URL for downloading a ticket.
     * Uses route-based secure links (no direct storage access).
     */
    public function getDownloadUrl(EventRegistration $registration, int $attendeeNo = 1): string
    {
        return route('admin.tickets.download', [
            'registration' => $registration->id,
            'attendee_no'  => $attendeeNo,
        ]);
    }
}
