<?php

namespace App\Mail;

use App\Models\Event;
use App\Models\EventRegistration;
use App\Models\Setting;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class EventReminderMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly EventRegistration $registration,
        public readonly string $customMessage = '',
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Event Reminder – ' . $this->registration->event?->title,
        );
    }

    public function content(): Content
    {
        $registration = $this->registration;
        $registration->loadMissing(['event', 'attendees']);

        $generalSettings = Setting::getGroup('general');

        // Ticket URL for first attendee
        $ticketUrl = route('tickets.download', [
            'registration' => $registration->id,
            'attendee_no'  => 1,
        ]);

        return new Content(
            view: 'emails.reminder',
            with: [
                'event'         => $registration->event,
                'attendeeName'  => $registration->name,
                'referenceNo'   => $registration->reference_no,
                'customMessage' => $this->customMessage,
                'ticketUrl'     => $ticketUrl,
                'siteName'      => $generalSettings['site_name'] ?? 'Takaful Events',
                'contactEmail'  => $generalSettings['contact_email'] ?? null,
                'contactPhone'  => $generalSettings['contact_phone'] ?? null,
            ],
        );
    }
}
