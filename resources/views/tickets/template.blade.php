<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ticket {{ $registration->reference_no }}-{{ str_pad($attendee->attendee_no, 2, '0', STR_PAD_LEFT) }}</title>
    <style>
        @page {
            size: A4;
            margin: 12mm;
        }

        * {
            box-sizing: border-box;
        }

        body {
            font-family: Arial, Helvetica, sans-serif;
            color: #1f2937;
            font-size: 12px;
        }

        .card {
            width: 100%;
            background: #fff;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid #e6eef3;
        }

        .header {
            background: #172033;
            color: #fff;
            padding: 18px 22px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .header-left {
            display: flex;
            align-items: center;
            gap: 14px;
        }

        .logo {
            height: 40px;
        }

        .event-info {
            min-width: 0;
        }

        .event-title {
            font-size: 18px;
            font-weight: 700;
            color: #fff;
        }

        .event-meta {
            font-size: 11px;
            color: rgba(255, 255, 255, 0.85);
            margin-top: 6px;
        }

        .header-right {
            text-align: right;
            font-size: 11px;
            color: rgba(255, 255, 255, 0.9);
        }

        .container {
            padding: 18px 22px;
        }

        .badges {
            display: flex;
            gap: 8px;
            align-items: center;
            margin-bottom: 10px;
        }

        .badge {
            font-size: 10px;
            padding: 5px 10px;
            border-radius: 999px;
            background: #eef2ff;
            color: #1e293b;
        }

        .status {
            background: #ecfdf5;
            color: #065f46;
            border: none;
        }

        .top-row {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            align-items: flex-start;
        }

        .left-col {
            flex: 1;
        }

        .right-col {
            width: 250px;
        }

        .label {
            font-size: 10px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            margin-bottom: 4px;
        }

        .value {
            font-size: 13px;
            font-weight: 700;
            color: #0f172a;
        }

        .small {
            font-size: 12px;
            color: #374151;
        }

        .grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            margin-top: 8px;
        }

        .ref {
            font-family: monospace;
            background: #f1f9ff;
            color: #083344;
            padding: 6px 10px;
            border-radius: 6px;
            display: inline-block;
            margin-top: 8px;
        }

        .qr-box {
            background: #fff;
            padding: 10px;
            border-radius: 8px;
            border: 1px solid #e6eef3;
            display: inline-block;
        }

        .qr-box img {
            display: block;
        }

        .qr-label {
            font-size: 10px;
            color: #6b7280;
            margin-top: 6px;
        }

        .order-summary {
            margin-top: 12px;
            border-top: 1px solid #eef2f7;
            padding-top: 12px;
        }

        .order-line {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 12px;
            color: #374151;
        }

        .order-total {
            display: flex;
            justify-content: space-between;
            padding-top: 8px;
            border-top: 2px solid #e6eef3;
            margin-top: 12px;
            font-weight: 700;
            color: #0f172a;
        }

        .footer {
            padding: 10px 22px;
            text-align: center;
            font-size: 11px;
            color: #6b7280;
            border-top: 1px solid #eef2f7;
            background: #fbfdfe;
        }
    </style>
</head>

<body>
    <div class="card">
        <div class="header">
            <div class="header-left">
                <img src="{{ public_path('images/logo.png') }}" alt="logo" class="logo">
                <div class="event-info">
                    <div class="event-title">{{ $registration->event->title ?? 'Event' }}</div>
                    <div class="event-meta">
                        @if ($registration->event->start_at)
                            {{ \Carbon\Carbon::parse($registration->event->start_at)->format('D, d M Y') }}
                        @endif
                        @if ($registration->event->venue)
                            <br>{{ $registration->event->venue }}@if ($registration->event->city)
                                , {{ $registration->event->city }}
                            @endif
                        @endif
                    </div>
                </div>
            </div>
            <div class="header-right">
                <div style="font-weight:700; font-size:14px;">TICKET</div>
                <div style="margin-top:8px; font-family:monospace;">
                    {{ $registration->reference_no }}-{{ str_pad($attendee->attendee_no, 2, '0', STR_PAD_LEFT) }}</div>
                <div style="font-size:11px; margin-top:6px; opacity:0.9;">Date:
                    {{ optional($registration->created_at)->format('d M Y') ?? now()->format('d M Y') }}</div>
                @if (!empty($settings['company_name']))
                    <div style="font-size:11px; margin-top:6px; opacity:0.9;">{{ $settings['company_name'] }}</div>
                @endif
            </div>
        </div>

        <div class="container">
            <div class="badges">
                <div class="badge status">{{ ucfirst($registration->status) }}</div>
                @if ($registration->ticket)
                    <div class="badge">{{ $registration->ticket->name }}</div>
                @endif
            </div>

            <div style="display:grid; grid-template-columns: 1fr 340px; gap:20px; align-items:start;">
                <div>
                    <div style="margin-bottom:8px;">
                        <div style="font-size:13px; font-weight:700; color:#0f172a;">Event</div>
                        <div style="font-size:12px; color:#374151; margin-top:6px;">{{ $registration->event->title }}
                        </div>
                        <div style="font-size:11px; color:#6b7280; margin-top:6px;">
                            @if ($registration->event->start_at)
                                {{ \Carbon\Carbon::parse($registration->event->start_at)->format('d M Y, g:i A') }}
                            @endif
                        </div>
                    </div>

                    <div style="background:#fbfbfe; padding:12px; border-radius:8px; border:1px solid #eef2f7;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <div>
                                <div style="font-size:12px; color:#6b7280;">Description</div>
                                <div style="font-size:13px; font-weight:600; color:#0f172a; margin-top:6px;">
                                    {{ $registration->ticket?->name ?? 'Ticket' }}</div>
                            </div>
                            <div style="text-align:right;">
                                <div style="font-size:12px; color:#6b7280;">Qty</div>
                                <div style="font-size:13px; font-weight:600; margin-top:6px;">
                                    {{ $registration->quantity }}</div>
                            </div>
                        </div>

                        <div style="margin-top:12px; display:flex; justify-content:flex-end;">
                            <div style="text-align:right;">
                                <div style="font-size:12px; color:#6b7280;">Unit Price</div>
                                <div style="font-size:13px; font-weight:600; margin-top:6px;">RM
                                    {{ number_format($registration->ticket?->price ?? 0, 2) }}</div>
                            </div>
                        </div>

                        <div style="margin-top:14px; display:flex; justify-content:space-between; align-items:center;">
                            <div></div>
                            <div style="text-align:right;">
                                <div style="font-size:12px; color:#6b7280;">Subtotal</div>
                                <div style="font-size:16px; font-weight:700; color:#172033; margin-top:6px;">RM
                                    {{ number_format($registration->subtotal, 2) }}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style="text-align:center;">
                    <div
                        style="background:#fff; padding:10px; border-radius:10px; border:1px solid #eef2f7; display:inline-block;">
                        @if (($qrType ?? 'png') === 'svg')
                            <img src="data:image/svg+xml;base64,{{ base64_encode($qrCode) }}" width="200"
                                height="200" alt="QR" style="display:block; margin:0 auto;">
                        @else
                            <img src="data:image/png;base64,{{ $qrCode }}" width="200" height="200"
                                alt="QR" style="display:block; margin:0 auto;">
                        @endif
                    </div>
                    <div class="qr-label" style="margin-top:8px;">Scan for attendance</div>

                    <div
                        style="margin-top:16px; background:#f9fafb; padding:12px; border-radius:8px; border:1px solid #f1f5f9; text-align:left;">
                        <div style="font-size:11px; color:#6b7280;">Attendee</div>
                        <div
                            style="font-size:13px; font-weight:700; color:#0f172a; margin-top:6px; text-transform:uppercase;">
                            {{ $attendee->name }}</div>
                        <div style="display:flex; gap:8px; margin-top:8px; font-size:12px; color:#374151;">
                            <div style="flex:1;">{{ $attendee->email }}</div>
                            <div style="flex:0 0 110px; text-align:right;">{{ $attendee->phone ?? '—' }}</div>
                        </div>
                        <div style="margin-top:8px; font-size:12px; color:#6b7280;">
                            {{ $registration->ticket?->name ?? '—' }} · Seat {{ $attendee->attendee_no }}</div>
                    </div>
                </div>
            </div>
        </div>

        <div style="border-top:1px dashed #e6eef3; margin-top:14px;"></div>
        <div class="footer">
            <div>Malaysian Takaful Association (MTA) &middot; Please present this ticket (QR code) at the event
                entrance.</div>
            @if (!empty($settings['contact_email']))
                <div style="margin-top:6px;">For enquiries: {{ $settings['contact_email'] }}</div>
            @endif
        </div>
    </div>
</body>

</html>
