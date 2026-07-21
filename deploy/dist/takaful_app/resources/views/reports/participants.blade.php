<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Participants — {{ $event->title }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 10px;
            color: #333;
            line-height: 1.4;
        }

        .page { padding: 26px 30px; }

        /* ── Header ─────────────────────────── */
        .header {
            display: table;
            width: 100%;
            border-bottom: 3px solid #1e3a5f;
            padding-bottom: 14px;
            margin-bottom: 18px;
        }
        .header-left  { display: table-cell; vertical-align: top; width: 65%; }
        .header-right { display: table-cell; vertical-align: top; text-align: right; width: 35%; }

        .org-name     { font-size: 16px; font-weight: bold; color: #1e3a5f; margin-bottom: 2px; }
        .report-title { font-size: 20px; font-weight: bold; color: #1e3a5f; margin-bottom: 2px; }
        .event-name   { font-size: 12px; font-weight: bold; color: #444; margin-bottom: 4px; }
        .report-meta  { font-size: 9px; color: #777; }

        /* ── Summary bar ─────────────────────── */
        .summary-bar {
            background: #f0f4f8;
            border-left: 4px solid #1e3a5f;
            padding: 8px 12px;
            margin-bottom: 16px;
            font-size: 10px;
            color: #444;
        }
        .summary-bar strong { color: #1e3a5f; }

        /* ── Table ───────────────────────────── */
        .report-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 18px;
            table-layout: auto;
        }

        .report-table thead tr { background-color: #1e3a5f; color: #fff; }

        .report-table th {
            padding: 7px 6px;
            text-align: left;
            font-size: 8px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            white-space: nowrap;
        }

        .report-table tbody tr:nth-child(even) { background-color: #f8fafc; }
        .report-table tbody tr:nth-child(odd)  { background-color: #fff; }

        .report-table td {
            padding: 6px 6px;
            border-bottom: 1px solid #eef0f3;
            font-size: 9px;
            vertical-align: top;
            word-break: break-word;
        }

        .mono { font-family: 'Courier New', monospace; font-size: 8px; color: #555; }
        .dim  { font-size: 8px; color: #888; }

        /* ── Footer ──────────────────────────── */
        .footer {
            border-top: 1px solid #e2e8f0;
            padding-top: 8px;
            font-size: 8.5px;
            color: #aaa;
            text-align: center;
        }
    </style>
</head>
<body>
<div class="page">

    {{-- ── Header ── --}}
    <div class="header">
        <div class="header-left">
            @if (!empty($settings['company_name']))
                <div class="org-name">{{ $settings['company_name'] }}</div>
            @endif
            <div class="report-title">Participants List</div>
            <div class="event-name">{{ $event->title }}</div>
        </div>
        <div class="header-right">
            <div class="report-meta">Generated: {{ now()->format('d M Y, H:i') }}</div>
            <div class="report-meta">Total participants: {{ $attendees->count() }}</div>
        </div>
    </div>

    {{-- ── Summary ── --}}
    <div class="summary-bar">
        <strong>Event:</strong> {{ $event->title }} &nbsp;|&nbsp;
        <strong>Fields:</strong> {{ count($fields) }} &nbsp;|&nbsp;
        <strong>Participants:</strong> {{ $attendees->count() }}
    </div>

    {{-- ── Table ── --}}
    <table class="report-table">
        <thead>
            <tr>
                <th style="width:28px">#</th>
                @if (!empty($showRef))<th style="width:80px">Ref No</th>@endif
                @if (!empty($showTicket))<th style="width:70px">Ticket</th>@endif
                @if (!empty($showCheckin))<th style="width:60px">Check-in</th>@endif
                @foreach ($fields as $field)
                    <th>{{ $field['label_en'] ?? $field['key'] ?? '' }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @forelse ($attendees as $i => $attendee)
                @php
                    $customFields = $attendee->meta_json['custom_fields'] ?? [];
                @endphp
                <tr>
                    <td class="dim">{{ $i + 1 }}</td>
                    @if (!empty($showRef))<td class="mono">{{ $attendee->registration?->reference_no ?? '-' }}</td>@endif
                    @if (!empty($showTicket))<td>{{ $attendee->registration?->ticket?->name ?? '-' }}</td>@endif
                    @if (!empty($showCheckin))
                        <td style="text-align:center">
                            @if ($attendee->checked_in_at)
                                <span style="color:#16a34a; font-weight:700;">✓</span>
                            @else
                                <span style="color:#9ca3af;">–</span>
                            @endif
                        </td>
                    @endif
                    @foreach ($fields as $field)
                        @php
                            $key        = $field['key'] ?? '';
                            $directMap  = ['name' => $attendee->name, 'email' => $attendee->email, 'phone' => $attendee->phone];
                            $value      = array_key_exists($key, $directMap) ? ($directMap[$key] ?? '') : ($customFields[$key] ?? '');
                            if (is_array($value)) $value = implode(', ', $value);
                        @endphp
                        <td>{{ $value !== '' ? $value : '-' }}</td>
                    @endforeach
                </tr>
            @empty
                <tr>
                    <td colspan="{{ 1 + ($showRef ? 1 : 0) + ($showTicket ? 1 : 0) + ($showCheckin ? 1 : 0) + count($fields) }}" style="text-align:center; padding:20px; color:#aaa;">
                        No participants found.
                    </td>
                </tr>
            @endforelse
        </tbody>
    </table>

    {{-- ── Footer ── --}}
    <div class="footer">
        @if (!empty($settings['company_name'])){{ $settings['company_name'] }} &mdash; @endif
        Participants Report &mdash; {{ $event->title }} &mdash; Generated {{ now()->format('d M Y H:i') }}
    </div>

</div>
</body>
</html>
