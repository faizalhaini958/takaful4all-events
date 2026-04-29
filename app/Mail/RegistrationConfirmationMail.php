<?php

namespace App\Mail;

use App\Models\EventRegistration;
use App\Models\Setting;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Symfony\Component\Mime\Email as SymfonyEmail;
use Symfony\Component\Mime\Part\DataPart;

class RegistrationConfirmationMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly EventRegistration $registration,
    ) {}

    public function build(): static
    {
        $registration = $this->registration;
        $registration->loadMissing(['event', 'ticket', 'attendees', 'invoice']);

        $generalSettings  = Setting::getGroup('general');
        $siteName         = $generalSettings['site_name'] ?? 'Takaful Events';
        $contactEmail     = $generalSettings['contact_email'] ?? null;

        // Build ticket download URLs — one per attendee
        $ticketUrls = [];
        foreach ($registration->attendees as $attendee) {
            $ticketUrls[$attendee->attendee_no] = route('tickets.download', [
                'registration' => $registration->id,
                'attendee_no'  => $attendee->attendee_no,
            ]);
        }

        $primaryTicketUrl = $ticketUrls[1] ?? ($ticketUrls ? reset($ticketUrls) : '#');

        $invoiceUrl = null;
        if ($registration->invoice?->invoice_number) {
            $invoiceUrl = route('invoices.download', $registration->invoice->invoice_number);
        }

        // Generate QR codes — attach as inline CID parts via Symfony Mailer
        $qrCids  = [];
        $qrParts = [];

        foreach ($registration->attendees as $attendee) {
            try {
                $qrPayload = json_encode([
                    'ref'         => $registration->reference_no,
                    'attendee_no' => $attendee->attendee_no,
                ]);

                $qrPng = (string) QrCode::format('png')
                    ->size(300)
                    ->margin(0)
                    ->generate($qrPayload);

                $cid  = 'qr-' . $registration->id . '-' . $attendee->attendee_no . '@takaful4all';
                $part = (new DataPart($qrPng, "qr-{$attendee->attendee_no}.png", 'image/png'))
                    ->asInline()
                    ->setContentId($cid);

                $qrCids[$attendee->attendee_no]  = $cid;
                $qrParts[$attendee->attendee_no] = $part;

            } catch (\Exception $e) {
                Log::error('Failed to generate QR code for attendee in email', [
                    'registration_id' => $registration->id,
                    'attendee_no'     => $attendee->attendee_no,
                    'error'           => $e->getMessage(),
                ]);
            }
        }

        // Attach QR DataParts directly to the Symfony Email object
        $this->withSymfonyMessage(function (SymfonyEmail $email) use ($qrParts) {
            foreach ($qrParts as $part) {
                $email->addPart($part);
            }
        });

        return $this
            ->subject('Registration Confirmed – ' . $registration->event?->title)
            ->view('emails.ticket-confirmation', [
                'registration' => $registration,
                'ticketUrl'    => $primaryTicketUrl,
                'ticketUrls'   => $ticketUrls,
                'invoiceUrl'   => $invoiceUrl,
                'siteName'     => $siteName,
                'contactEmail' => $contactEmail,
                'qrCids'       => $qrCids,
            ]);
    }
}
