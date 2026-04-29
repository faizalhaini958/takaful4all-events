<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>Ticket – {{ $attendee->name }}</title>
    <style>
        @page {
            margin: 15px;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: Helvetica, Arial, sans-serif;
            font-size: 11px;
            color: #1a1a2e;
        }

        table {
            border-collapse: collapse;
            width: 100%;
        }

        .ticket {
            border: 1px solid #d1dce8;
            border-radius: 10px;
            overflow: hidden;
        }

        /* Header */
        .ticket-header {
            background-color: #1e3a5f;
            color: #ffffff;
            padding: 16px 24px;
        }

        .ticket-header td {
            vertical-align: middle;
            color: #fff;
        }

        .org-name {
            font-size: 10px;
            color: #c8d4e3;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .event-name {
            font-size: 17px;
            font-weight: bold;
            margin-top: 3px;
        }

        .ticket-label {
            background: #2a5285;
            border: 1px solid #4a6fa3;
            border-radius: 4px;
            padding: 6px 14px;
            font-size: 10px;
            font-weight: bold;
            letter-spacing: 1px;
            color: #fff;
            white-space: nowrap;
        }

        /* Body */
        .ticket-main {
            padding: 18px 24px;
            vertical-align: top;
            border-right: 2px dashed #d1dce8;
        }

        .ticket-qr {
            padding: 18px 12px;
            text-align: center;
            background: #f8fafc;
            vertical-align: middle;
            width: 32%;
        }

        .ticket-type-badge {
            display: inline-block;
            background-color: #eaf2ff;
            color: #1e3a5f;
            font-size: 9px;
            font-weight: bold;
            padding: 3px 10px;
            border-radius: 20px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 10px;
        }

        .attendee-name {
            font-size: 18px;
            font-weight: bold;
            color: #1e3a5f;
            margin-bottom: 3px;
        }

        .attendee-meta {
            font-size: 10px;
            color: #888;
            margin-bottom: 12px;
        }

        .info-table td {
            vertical-align: top;
            padding: 4px 8px 4px 0;
            width: 50%;
        }

        .info-label {
            font-size: 8px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #aaa;
            margin-bottom: 2px;
        }

        .info-value {
            font-size: 11px;
            color: #222;
            font-weight: bold;
        }

        .reference-code {
            font-family: monospace;
            font-size: 12px;
            letter-spacing: 1px;
            color: #1e3a5f;
            background: #eaf2ff;
            padding: 4px 10px;
            border-radius: 4px;
            display: inline-block;
            margin-top: 12px;
        }

        .qr-attendee-no {
            font-size: 20px;
            font-weight: bold;
            color: #1e3a5f;
            margin-bottom: 4px;
        }

        .qr-code svg {
            width: 110px;
            height: 110px;
            display: inline-block;
        }

        .qr-label {
            font-size: 8px;
            color: #aaa;
            margin-top: 6px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .ticket-footer {
            background: #f8fafc;
            border-top: 1px solid #e2e8f0;
            padding: 8px 24px;
            font-size: 9px;
            color: #aaa;
            text-align: center;
        }
    </style>
</head>

<body>
    <div class="ticket">
        <table class="ticket-header">
            <tr>
                <td>
                    <div class="org-name">Malaysian Takaful Association</div>
                    <div class="event-name">{{ $registration->event->title }}</div>
                </td>
                <td style="text-align: right; width: 130px;">
                    <span class="ticket-label">Entry Ticket</span>
                </td>
            </tr>
        </table>

        <table>
            <tr>
                <td class="ticket-main">
                    <span class="ticket-type-badge">{{ $registration->ticket?->name ?? 'General Admission' }}</span>
                    <div class="attendee-name">{{ $attendee->name }}</div>
                    <div class="attendee-meta">
                        {{ $attendee->email }}@if ($attendee->company)
                            · {{ $attendee->company }}
                        @endif
                    </div>

                    <table class="info-table">
                        <tr>
                            <td>
                                <div class="info-label">Date</div>
                                <div class="info-value">
                                    {{ \Carbon\Carbon::parse($registration->event->start_at)->format('d M Y') }}
                                </div>
                            </td>
                            <td>
                                <div class="info-label">Time</div>
                                <div class="info-value">
                                    {{ \Carbon\Carbon::parse($registration->event->start_at)->format('g:i A') }}
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div class="info-label">Venue</div>
                                <div class="info-value">
                                    {{ $registration->event->venue ?? '—' }}@if ($registration->event->city)
                                        , {{ $registration->event->city }}
                                    @endif
                                </div>
                            </td>
                            <td>
                                <div class="info-label">Attendee</div>
                                <div class="info-value">{{ $attendee->attendee_no }} of {{ $registration->quantity }}
                                </div>
                            </td>
                        </tr>
                    </table>

                    <div class="reference-code">
                        {{ $registration->reference_no }}-{{ str_pad($attendee->attendee_no, 2, '0', STR_PAD_LEFT) }}
                    </div>
                </td>
                <td class="ticket-qr">
                    <div class="qr-attendee-no">#{{ str_pad($attendee->attendee_no, 2, '0', STR_PAD_LEFT) }}</div>
                    <div class="qr-code">
                        {!! $qrCode !!}
                    </div>
                    <div class="qr-label">Scan to check in</div>
                </td>
            </tr>
        </table>

        <div class="ticket-footer">
            This ticket is valid for one entry. Please present this at the event entrance.
        </div>
    </div>
</body>

</html>
