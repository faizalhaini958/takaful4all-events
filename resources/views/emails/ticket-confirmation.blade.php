@extends('emails.layouts.master')

@section('title', 'Registration Confirmed – ' . $registration->event->title)

@section('content')
<h1 class="email-title">🎉 You're registered!</h1>
<p class="email-intro">
    Hi <strong>{{ $registration->name }}</strong>, your registration has been confirmed and payment received.
    Here are your booking details.
</p>

{{-- Event Info Card --}}
<div class="info-card">
    <div class="info-row">
        <div class="info-label">Event</div>
        <div class="info-value"><strong>{{ $registration->event->title }}</strong></div>
    </div>
    <div class="info-row">
        <div class="info-label">Date</div>
        <div class="info-value">
            {{ \Carbon\Carbon::parse($registration->event->start_at)->format('l, d F Y') }}
            @if($registration->event->end_at && $registration->event->end_at != $registration->event->start_at)
                – {{ \Carbon\Carbon::parse($registration->event->end_at)->format('d F Y') }}
            @endif
        </div>
    </div>
    @if($registration->event->venue)
    <div class="info-row">
        <div class="info-label">Venue</div>
        <div class="info-value">
            {{ $registration->event->venue }}
            @if($registration->event->city), {{ $registration->event->city }}@endif
        </div>
    </div>
    @endif
    <div class="info-row">
        <div class="info-label">Reference</div>
        <div class="info-value"><strong style="font-family: monospace; font-size: 15px;">{{ $registration->reference_no }}</strong></div>
    </div>
    <div class="info-row">
        <div class="info-label">Ticket</div>
        <div class="info-value">{{ $registration->ticket?->name ?? '—' }} × {{ $registration->quantity }}</div>
    </div>
    <div class="info-row">
        <div class="info-label">Amount Paid</div>
        <div class="info-value"><strong>MYR {{ number_format($registration->total_amount, 2) }}</strong></div>
    </div>
</div>

{{-- Attendees --}}
@if($registration->attendees->count() > 0)
<p style="font-size: 13px; font-weight: bold; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Attendees</p>
<div style="margin-bottom: 24px;">
    @foreach($registration->attendees as $attendee)
        <span class="attendee-badge">{{ $attendee->name }}</span>
    @endforeach
</div>
@endif

{{-- Action Buttons --}}
<div class="cta-block">
    <p style="margin-bottom: 16px; font-size: 14px; color: #555;">Your ticket and invoice are ready to download:</p>
    <a href="{{ $ticketUrl }}" class="btn-cta" style="margin-right: 8px;">🎫 Download Ticket</a>
    @if($invoiceUrl)
        <a href="{{ $invoiceUrl }}" class="btn-secondary">🧾 Download Invoice</a>
    @endif
</div>

<hr class="divider">

<div class="alert-box">
    📋 <strong>Important:</strong> Please present your QR code ticket at the event entrance for check-in.
    Keep this email as your confirmation.
</div>

<p style="font-size: 14px; color: #555;">
    If you have any questions about your registration, please contact the event organiser and quote your
    reference number: <strong>{{ $registration->reference_no }}</strong>.
</p>
@endsection
