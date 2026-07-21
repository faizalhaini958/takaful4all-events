<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>Registration Report</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 11px;
            color: #333;
            line-height: 1.5;
        }

        .page {
            padding: 30px 35px;
        }

        /* ── Header ─────────────────────────────── */
        .header {
            display: table;
            width: 100%;
            border-bottom: 3px solid #1e3a5f;
            padding-bottom: 16px;
            margin-bottom: 20px;
        }

        .header-left {
            display: table-cell;
            vertical-align: top;
            width: 60%;
        }

        .header-right {
            display: table-cell;
            vertical-align: top;
            text-align: right;
            width: 40%;
        }

        .org-name {
            font-size: 18px;
            font-weight: bold;
            color: #1e3a5f;
        }

        .report-title {
            font-size: 22px;
            font-weight: bold;
            color: #1e3a5f;
            margin-bottom: 3px;
        }

        .report-meta {
            font-size: 10px;
            color: #777;
        }

        /* ── Filters summary ────────────────────── */
        .filters-bar {
            background-color: #f0f4f8;
            border-left: 4px solid #1e3a5f;
            padding: 10px 14px;
            margin-bottom: 18px;
            border-radius: 2px;
        }

        .filters-bar-title {
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #999;
            margin-bottom: 5px;
        }

        .filter-pill {
            display: inline-block;
            background: #1e3a5f;
            color: #fff;
            font-size: 9px;
            font-weight: bold;
            padding: 2px 8px;
            border-radius: 10px;
            margin-right: 5px;
        }

        /* ── Stats ──────────────────────────────── */
        .stats-row {
            display: table;
            width: 100%;
            margin-bottom: 20px;
            border-collapse: separate;
            border-spacing: 8px;
        }

        .stat-cell {
            display: table-cell;
            text-align: center;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 10px 6px;
            width: 14%;
        }

        .stat-value {
            font-size: 20px;
            font-weight: bold;
            color: #1e3a5f;
        }

        .stat-label {
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            color: #888;
            margin-top: 2px;
        }

        .stat-cell.revenue {
            background: #f0fdf4;
            border-color: #bbf7d0;
        }

        .stat-cell.revenue .stat-value {
            font-size: 14px;
            color: #166534;
        }

        /* ── Table ──────────────────────────────── */
        .report-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }

        .report-table thead tr {
            background-color: #1e3a5f;
            color: #fff;
        }

        .report-table th {
            padding: 8px 7px;
            text-align: left;
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.4px;
        }

        .report-table th.right {
            text-align: right;
        }

        .report-table th.center {
            text-align: center;
        }

        .report-table tbody tr:nth-child(even) {
            background-color: #f8fafc;
        }

        .report-table tbody tr:nth-child(odd) {
            background-color: #fff;
        }

        .report-table td {
            padding: 7px 7px;
            border-bottom: 1px solid #eef0f3;
            font-size: 10px;
            vertical-align: top;
        }

        .report-table td.right {
            text-align: right;
        }

        .report-table td.center {
            text-align: center;
        }

        .mono {
            font-family: 'Courier New', monospace;
            font-size: 9px;
            color: #555;
        }

        .dim {
            font-size: 9px;
            color: #888;
            margin-top: 1px;
        }

        /* ── Status badges ──────────────────────── */
        .badge {
            display: inline-block;
            padding: 2px 7px;
            border-radius: 10px;
            font-size: 9px;
            font-weight: bold;
        }

        .badge-pending {
            background: #fef3c7;
            color: #92400e;
        }

        .badge-confirmed {
            background: #d1fae5;
            color: #065f46;
        }

        .badge-attended {
            background: #dbeafe;
            color: #1e40af;
        }

        .badge-cancelled {
            background: #fee2e2;
            color: #991b1b;
        }

        .badge-waitlisted {
            background: #f3f4f6;
            color: #4b5563;
        }

        .badge-paid {
            background: #d1fae5;
            color: #065f46;
        }

        .badge-refunded {
            background: #fee2e2;
            color: #991b1b;
        }

        .badge-na {
            background: #f3f4f6;
            color: #6b7280;
        }

        /* ── Footer ─────────────────────────────── */
        .footer {
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
            display: table;
            width: 100%;
        }

        .footer-left {
            display: table-cell;
            font-size: 9px;
            color: #aaa;
        }

        .footer-right {
            display: table-cell;
            text-align: right;
            font-size: 9px;
            color: #aaa;
        }
    </style>
</head>

<body>
    <div class="page">

        {{-- ── Header ── --}}
        <div class="header">
            <div class="header-left">
                <div class="org-name">{{ $settings['company_name'] ?? config('app.name') }}</div>
            </div>
            <div class="header-right">
                <div class="report-title">Registration Report</div>
                <div class="report-meta">Generated: {{ now()->format('d M Y, h:i A') }}</div>
            </div>
        </div>

        {{-- ── Active Filters summary ── --}}
        @if ($hasFilters)
            <div class="filters-bar">
                <div class="filters-bar-title">Filters Applied</div>
                @if ($filterEvent)
                    <span class="filter-pill">Event: {{ $filterEvent }}</span>
                @endif
                @if ($filterStatus && $filterStatus !== 'all')
                    <span class="filter-pill">Status: {{ ucfirst($filterStatus) }}</span>
                @endif
                @if ($filterDateFrom)
                    <span class="filter-pill">From: {{ \Carbon\Carbon::parse($filterDateFrom)->format('d M Y') }}</span>
                @endif
                @if ($filterDateTo)
                    <span class="filter-pill">To: {{ \Carbon\Carbon::parse($filterDateTo)->format('d M Y') }}</span>
                @endif
            </div>
        @endif

        {{-- ── Stats ── --}}
        <div class="stats-row">
            <div class="stat-cell">
                <div class="stat-value">{{ $stats['total'] }}</div>
                <div class="stat-label">Total</div>
            </div>
            <div class="stat-cell">
                <div class="stat-value">{{ $stats['confirmed'] }}</div>
                <div class="stat-label">Confirmed</div>
            </div>
            <div class="stat-cell">
                <div class="stat-value">{{ $stats['pending'] }}</div>
                <div class="stat-label">Pending</div>
            </div>
            <div class="stat-cell">
                <div class="stat-value">{{ $stats['attended'] }}</div>
                <div class="stat-label">Attended</div>
            </div>
            <div class="stat-cell">
                <div class="stat-value">{{ $stats['cancelled'] }}</div>
                <div class="stat-label">Cancelled</div>
            </div>
            <div class="stat-cell">
                <div class="stat-value">{{ $stats['waitlisted'] }}</div>
                <div class="stat-label">Waitlisted</div>
            </div>
            <div class="stat-cell revenue">
                <div class="stat-value">RM {{ number_format($stats['revenue'], 2) }}</div>
                <div class="stat-label">Revenue</div>
            </div>
        </div>

        {{-- ── Table ── --}}
        <table class="report-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Reference</th>
                    <th>Participant</th>
                    <th>Event</th>
                    <th>Ticket</th>
                    <th class="center">Qty</th>
                    <th class="right">Total (RM)</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Registered</th>
                </tr>
            </thead>
            <tbody>
                @forelse($registrations as $i => $reg)
                    <tr>
                        <td class="dim">{{ $i + 1 }}</td>
                        <td><span class="mono">{{ $reg->reference_no }}</span></td>
                        <td>
                            <div>{{ $reg->name }}</div>
                            <div class="dim">{{ $reg->email }}</div>
                            @if ($reg->phone)
                                <div class="dim">{{ $reg->phone }}</div>
                            @endif
                        </td>
                        <td>{{ $reg->event?->title ?? '-' }}</td>
                        <td>{{ $reg->ticket?->name ?? '-' }}</td>
                        <td class="center">{{ $reg->quantity }}</td>
                        <td class="right">{{ number_format((float) $reg->total_amount, 2) }}</td>
                        <td>
                            <span class="badge badge-{{ $reg->status }}">{{ ucfirst($reg->status) }}</span>
                        </td>
                        <td>
                            <span
                                class="badge badge-{{ $reg->payment_status }}">{{ strtoupper($reg->payment_status) }}</span>
                        </td>
                        <td class="dim">{{ $reg->created_at?->format('d M Y') }}</td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="10" style="text-align:center; padding:20px; color:#999;">
                            No registrations found for the selected filters.
                        </td>
                    </tr>
                @endforelse
            </tbody>
        </table>

        {{-- ── Footer ── --}}
        <div class="footer">
            <div class="footer-left">{{ config('app.name') }} &mdash; Confidential</div>
            <div class="footer-right">Total records: {{ count($registrations) }}</div>
        </div>

    </div>
</body>

</html>
