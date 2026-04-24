<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Ticket – {{ $attendee->name }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 12px;
            background: #ffffff;
            color: #1a1a2e;
        }
        .ticket {
            width: 540px;
            margin: 20px auto;
            border: 1px solid #d1dce8;
            border-radius: 10px;
            overflow: hidden;
        }
        /* Top bar */
        .ticket-header {
            background-color: #1e3a5f;
            color: #ffffff;
            padding: 20px 28px;
            display: table;
            width: 100%;
        }
        .ticket-header-left { display: table-cell; vertical-align: middle; }
        .ticket-header-right { display: table-cell; vertical-align: middle; text-align: right; }
        .org-name { font-size: 11px; color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 1px; }
        .event-name { font-size: 18px; font-weight: bold; margin-top: 4px; }
        .ticket-label {
            background: rgba(255,255,255,0.15);
            border: 1px solid rgba(255,255,255,0.3);
            border-radius: 4px;
            padding: 6px 14px;
            font-size: 11px;
            font-weight: bold;
            letter-spacing: 1px;
            text-transform: uppercase;
        }
        /* Body */
        .ticket-body {
            display: table;
            width: 100%;
        }
        .ticket-main {
            display: table-cell;
            vertical-align: top;
            padding: 24px 28px;
            width: 68%;
            border-right: 2px dashed #d1dce8;
        }
        .ticket-qr {
            display: table-cell;
            vertical-align: middle;
            text-align: center;
            padding: 24px 20px;
            width: 32%;
            background: #f8fafc;
        }
        /* Attendee section */
        .attendee-name {
            font-size: 20px;
            font-weight: bold;
            color: #1e3a5f;
            margin-bottom: 4px;
        }
        .attendee-meta {
            font-size: 11px;
            color: #888;
            margin-bottom: 16px;
        }
        /* Info grid */
        .info-grid {
            display: table;
            width: 100%;
        }
        .info-cell {
            display: table-cell;
            vertical-align: top;
            width: 50%;
            padding: 6px 0;
        }
        .info-label {
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #aaa;
            margin-bottom: 2px;
        }
        .info-value {
            font-size: 12px;
            color: #222;
            font-weight: 600;
        }
        /* Badge */
        .ticket-type-badge {
            display: inline-block;
            background-color: #eaf2ff;
            color: #1e3a5f;
            font-size: 10px;
            font-weight: bold;
            padding: 3px 10px;
            border-radius: 20px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 14px;
        }
        /* Reference */
        .reference-code {
            font-family: monospace;
            font-size: 13px;
            letter-spacing: 1px;
            color: #1e3a5f;
            background: #eaf2ff;
            padding: 4px 10px;
            border-radius: 4px;
            display: inline-block;
            margin-top: 14px;
        }
        /* QR section */
        .qr-code img { width: 130px; height: 130px; }
        .qr-attendee-no {
            font-size: 22px;
            font-weight: bold;
            color: #1e3a5f;
            margin-bottom: 4px;
        }
        .qr-label { font-size: 9px; color: #aaa; margin-top: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
        /* Footer */
        .ticket-footer {
            background: #f8fafc;
            border-top: 1px solid #e2e8f0;
            padding: 10px 28px;
            font-size: 10px;
            color: #aaa;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="ticket">
        <!-- Header -->
        <div class="ticket-header">
            <div class="ticket-header-left">
                <div class="org-name">Malaysian Takaful Association</div>
                <div class="event-name">{{ $registration->event->title }}</div>
            </div>
            <div class="ticket-header-right">
                <div class="ticket-label">Entry Ticket</div>
            </div>
        </div>

        <!-- Body -->
        <div class="ticket-body">
            <div class="ticket-main">
                <div class="ticket-type-badge">{{ $registration->ticket?->name ?? 'General Admission' }}</div>
                <div class="attendee-name">{{ $attendee->name }}</div>
                <div class="attendee-meta">
                    {{ $attendee->email }}
                    @if($attendee->company) · {{ $attendee->company }}@endif
                </div>

                <div class="info-grid">
                    <div class="info-cell">
                        <div class="info-label">Date</div>
                        <div class="info-value">
                            {{ \Carbon\Carbon::parse($registration->event->start_at)->format('d M Y') }}
                        </div>
                    </div>
                    <div class="info-cell">
                        <div class="info-label">Time</div>
                        <div class="info-value">
                            {{ \Carbon\Carbon::parse($registration->event->start_at)->format('g:i A') }}
                        </div>
                    </div>
                    <div class="info-cell" style="padding-top: 10px;">
                        <div class="info-label">Venue</div>
                        <div class="info-value">
                            {{ $registration->event->venue ?? '—' }}
                            @if($registration->event->city)<br>{{ $registration->event->city }}@endif
                        </div>
                    </div>
                    <div class="info-cell" style="padding-top: 10px;">
                        <div class="info-label">Attendee</div>
                        <div class="info-value">{{ $attendee->attendee_no }} of {{ $registration->quantity }}</div>
                    </div>
                </div>

                <div class="reference-code">{{ $registration->reference_no }}-{{ str_pad($attendee->attendee_no, 2, '0', STR_PAD_LEFT) }}</div>
            </div>

            <div class="ticket-qr">
                <div class="qr-attendee-no">#{{ str_pad($attendee->attendee_no, 2, '0', STR_PAD_LEFT) }}</div>
                <div class="qr-code">
                    <img src="data:image/png;base64,{{ $qrCode }}" alt="QR Code">
                </div>
                <div class="qr-label">Scan to check in</div>
            </div>
        </div>

        <!-- Footer -->
        <div class="ticket-footer">
            This ticket is valid for one entry. Please present this at the event entrance.
        </div>
    </div>
</body>
</html>
