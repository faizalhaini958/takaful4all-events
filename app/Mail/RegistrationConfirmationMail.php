<?php

namespace App\Mail;

use App\Models\EventRegistration;
use App\Models\Setting;
use App\Services\TicketService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class RegistrationConfirmationMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly EventRegistration $registration,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Registration Confirmed – ' . $this->registration->event?->title,
        );
    }

    public function content(): Content
    {
        $registration = $this->registration;
        $registration->loadMissing(['event', 'ticket', 'attendees', 'invoice']);

        $generalSettings  = Setting::getGroup('general');
        $siteName         = $generalSettings['site_name'] ?? 'Takaful Events';
        $contactEmail     = $generalSettings['contact_email'] ?? null;

        // Build ticket download URLs — one per attendee
        $ticketService = app(TicketService::class);
        $ticketUrls    = [];

        foreach ($registration->attendees as $attendee) {
            $ticketUrls[$attendee->attendee_no] = route('tickets.download', [
                'registration' => $registration->id,
                'attendee_no'  => $attendee->attendee_no,
            ]);
        }

        // Primary ticket download URL (first attendee or attendee #1)
        $primaryTicketUrl = $ticketUrls[1] ?? ($ticketUrls ? reset($ticketUrls) : '#');

        // Invoice download URL (if invoice exists)
        $invoiceUrl = null;
        if ($registration->invoice?->invoice_number) {
            $invoiceUrl = route('invoices.download', $registration->invoice->invoice_number);
        }

        return new Content(
            view: 'emails.ticket-confirmation',
            with: [
                'registration' => $registration,
                'ticketUrl'    => $primaryTicketUrl,
                'ticketUrls'   => $ticketUrls,
                'invoiceUrl'   => $invoiceUrl,
                'siteName'     => $siteName,
                'contactEmail' => $contactEmail,
            ],
        );
    }
}
