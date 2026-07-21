@extends('emails.layouts.master')

@section('title', 'Event Reminder – ' . $event->title)

@section('content')
<h1 class="email-title">📅 Event Reminder</h1>
<p class="email-intro">
    Hi <strong>{{ $attendeeName }}</strong>, this is a friendly reminder about your upcoming event.
</p>

{{-- Event Info Card --}}
<div class="info-card">
    <div class="info-row">
        <div class="info-label">Event</div>
        <div class="info-value"><strong>{{ $event->title }}</strong></div>
    </div>
    <div class="info-row">
        <div class="info-label">Date</div>
        <div class="info-value">
            {{ \Carbon\Carbon::parse($event->start_at)->format('l, d F Y') }}
            @if($event->end_at && $event->end_at != $event->start_at)
                – {{ \Carbon\Carbon::parse($event->end_at)->format('d F Y') }}
            @endif
        </div>
    </div>
    @if($event->venue)
    <div class="info-row">
        <div class="info-label">Venue</div>
        <div class="info-value">
            {{ $event->venue }}
            @if($event->city), {{ $event->city }}@endif
            @if($event->state), {{ $event->state }}@endif
        </div>
    </div>
    @endif
    <div class="info-row">
        <div class="info-label">Reference</div>
        <div class="info-value"><strong style="font-family: monospace;">{{ $referenceNo }}</strong></div>
    </div>
</div>

{{-- Custom admin message --}}
@if(!empty($customMessage))
<div style="background: #f0f7ff; border-radius: 8px; padding: 20px 24px; margin-bottom: 24px; font-size: 14px; color: #1e3a5f; line-height: 1.7;">
    {!! nl2br(e($customMessage)) !!}
</div>
@endif

{{-- CTA --}}
<div class="cta-block">
    <a href="{{ $ticketUrl }}" class="btn-cta">🎫 View My Ticket</a>
</div>

<hr class="divider">

<p style="font-size: 14px; color: #555;">
    We look forward to seeing you at the event! If you have any questions, please contact the event organiser and quote
    your reference: <strong>{{ $referenceNo }}</strong>.
</p>
@endsection
