@extends('emails.layouts.master')

@section('title', $subject)

@section('content')
<h1 class="email-title">{{ $subject }}</h1>
<p class="email-intro">
    Dear <strong>{{ $recipientName }}</strong>,
</p>

{{-- Message body --}}
<div style="font-size: 15px; color: #333; line-height: 1.8;">
    {!! $body !!}
</div>

<hr class="divider">

<p style="font-size: 13px; color: #888;">
    You are receiving this email because you are registered with Takaful4All Events.
    If you no longer wish to receive broadcast emails, please contact us.
</p>
@endsection
