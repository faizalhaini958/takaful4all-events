<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>Analytics Report</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 10px;
            color: #333;
            line-height: 1.4;
        }

        .page {
            padding: 25px 30px;
        }

        /* ── Header ─────────────────────────────── */
        .header {
            display: table;
            width: 100%;
            border-bottom: 3px solid #003366;
            padding-bottom: 14px;
            margin-bottom: 18px;
        }

        .header-left {
            display: table-cell;
            vertical-align: top;
            width: 55%;
        }

        .header-right {
            display: table-cell;
            vertical-align: top;
            text-align: right;
            width: 45%;
        }

        .org-name {
            font-size: 16px;
            font-weight: bold;
            color: #003366;
        }

        .report-title {
            font-size: 20px;
            font-weight: bold;
            color: #003366;
            margin-bottom: 2px;
        }

        .report-meta {
            font-size: 9px;
            color: #777;
        }

        /* ── Section titles ─────────────────────── */
        .section-title {
            font-size: 13px;
            font-weight: bold;
            color: #003366;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 6px;
            margin-bottom: 12px;
            margin-top: 20px;
        }

        .section-title:first-of-type {
            margin-top: 0;
        }

        /* ── KPI cards ──────────────────────────── */
        .kpi-row {
            display: table;
            width: 100%;
            border-collapse: separate;
            border-spacing: 8px;
            margin-bottom: 6px;
        }

        .kpi-cell {
            display: table-cell;
            text-align: center;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 10px 8px;
            width: 25%;
        }

        .kpi-value {
            font-size: 22px;
            font-weight: bold;
            color: #003366;
        }

        .kpi-label {
            font-size: 8px;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            color: #888;
            margin-top: 3px;
        }

        .kpi-change {
            font-size: 9px;
            font-weight: bold;
            margin-top: 2px;
        }

        .kpi-change.up {
            color: #059669;
        }

        .kpi-change.down {
            color: #dc2626;
        }

        /* ── Table ──────────────────────────────── */
        .report-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
        }

        .report-table thead tr {
            background-color: #003366;
            color: #fff;
        }

        .report-table th {
            padding: 7px 8px;
            text-align: left;
            font-size: 8px;
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
            padding: 6px 8px;
            border-bottom: 1px solid #eef0f3;
            font-size: 9px;
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
            font-size: 8px;
            color: #555;
        }

        .dim {
            font-size: 8px;
            color: #888;
        }

        .bold {
            font-weight: bold;
        }

        .text-right {
            text-align: right;
        }

        /* ── Progress bar ────────────────────────── */
        .bar-wrapper {
            display: inline-block;
            width: 60px;
            height: 8px;
            background: #e2e8f0;
            border-radius: 4px;
            vertical-align: middle;
            margin-right: 6px;
        }

        .bar-fill {
            height: 8px;
            border-radius: 4px;
            background: #003366;
        }

        /* ── Split layout ────────────────────────── */
        .two-col {
            display: table;
            width: 100%;
            border-collapse: separate;
            border-spacing: 10px;
            margin-bottom: 10px;
        }

        .two-col-cell {
            display: table-cell;
            width: 50%;
            vertical-align: top;
        }

        /* ── Footer ─────────────────────────────── */
        .footer {
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
            display: table;
            width: 100%;
            margin-top: 16px;
        }

        .footer-left {
            display: table-cell;
            font-size: 8px;
            color: #aaa;
        }

        .footer-right {
            display: table-cell;
            text-align: right;
            font-size: 8px;
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
                <div class="report-title">Analytics Report</div>
                <div class="report-meta">
                    {{ $from->format('d M Y') }} – {{ $to->format('d M Y') }} &nbsp;·&nbsp;
                    Generated: {{ now()->format('d M Y, h:i A') }}
                </div>
            </div>
        </div>

        {{-- ── Overview KPIs ── --}}
        <div class="section-title">Overview</div>
        <div class="kpi-row">
            <div class="kpi-cell">
                <div class="kpi-value">{{ number_format($overview['total_sessions']) }}</div>
                <div class="kpi-label">Total Visits</div>
                @if ($overview['sessions_change_pct'] !== null)
                    <div class="kpi-change {{ $overview['sessions_change_pct'] >= 0 ? 'up' : 'down' }}">
                        {{ $overview['sessions_change_pct'] >= 0 ? '+' : '' }}{{ $overview['sessions_change_pct'] }}%
                    </div>
                @endif
            </div>
            <div class="kpi-cell">
                <div class="kpi-value">{{ number_format($overview['total_views']) }}</div>
                <div class="kpi-label">Page Views</div>
                @if ($overview['views_change_pct'] !== null)
                    <div class="kpi-change {{ $overview['views_change_pct'] >= 0 ? 'up' : 'down' }}">
                        {{ $overview['views_change_pct'] >= 0 ? '+' : '' }}{{ $overview['views_change_pct'] }}%
                    </div>
                @endif
            </div>
            <div class="kpi-cell">
                <div class="kpi-value">
                    {{ $overview['total_sessions'] > 0 ? number_format($overview['total_views'] / $overview['total_sessions'], 1) : '0' }}
                </div>
                <div class="kpi-label">Pages per Visit</div>
            </div>
            <div class="kpi-cell">
                <div class="kpi-value">{{ count($visitorsOverTime) }}</div>
                <div class="kpi-label">Active Days</div>
            </div>
        </div>

        {{-- ── Daily Visitors ── --}}
        <div class="section-title">Daily Visitors</div>
        @if (count($visitorsOverTime) > 0)
            @php
                $maxSessions = max(array_column($visitorsOverTime, 'sessions'));
                $totalSessions = array_sum(array_column($visitorsOverTime, 'sessions'));
                $avgSessions = $totalSessions / count($visitorsOverTime);
            @endphp
            <table class="report-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th class="right">Sessions</th>
                        <th class="right">vs. Avg</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($visitorsOverTime as $point)
                        <tr>
                            <td>{{ \Carbon\Carbon::parse($point['date'])->format('d M Y (D)') }}</td>
                            <td class="right bold">
                                <span class="bar-wrapper">
                                    <div class="bar-fill" style="width:{{ $maxSessions > 0 ? round(($point['sessions'] / $maxSessions) * 100) : 0 }}%"></div>
                                </span>
                                {{ number_format($point['sessions']) }}
                            </td>
                            <td class="right dim">
                                @php $diff = $point['sessions'] - $avgSessions; @endphp
                                {{ $diff >= 0 ? '+' : '' }}{{ number_format($diff) }}
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
            <p class="dim text-right" style="margin-top:-10px; margin-bottom:12px;">
                Min: {{ number_format(min(array_column($visitorsOverTime, 'sessions'))) }}
                &nbsp;·&nbsp;
                Avg: {{ number_format($avgSessions, 0) }}
                &nbsp;·&nbsp;
                Max: {{ number_format($maxSessions) }}
                &nbsp;·&nbsp;
                Total: {{ number_format($totalSessions) }}
            </p>
        @else
            <p class="dim" style="margin-bottom:12px;">No visitor data for this period.</p>
        @endif

        {{-- ── Top Pages + Device/Browser (side by side) ── --}}
        <div class="two-col">
            {{-- Top Pages --}}
            <div class="two-col-cell">
                <div class="section-title">Most Visited Pages</div>
                @if (count($topPages) > 0)
                    @php $maxViews = $topPages[0]['views'] ?? 1; @endphp
                    <table class="report-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Page</th>
                                <th class="right">Views</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach (array_slice($topPages, 0, 8) as $i => $page)
                                <tr>
                                    <td class="dim">{{ $i + 1 }}</td>
                                    <td>
                                        @php
                                            $path = parse_url($page['url'], PHP_URL_PATH) ?: '/';
                                            $path = preg_replace('/^\/admin/', 'Admin ›', $path);
                                            $path = preg_replace('/^\/events\/([^\/]+)$/', 'Event › $1', $path);
                                        @endphp
                                        {{ mb_strlen($path) > 40 ? mb_substr($path, 0, 37) . '...' : $path }}
                                    </td>
                                    <td class="right bold">{{ number_format($page['views']) }}</td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                @else
                    <p class="dim">No page views yet.</p>
                @endif
            </div>

            {{-- Device Breakdown --}}
            <div class="two-col-cell">
                <div class="section-title">Visitor Devices</div>
                @if (count($deviceBreakdown) > 0)
                    @php $totalDevices = array_sum(array_column($deviceBreakdown, 'sessions')); @endphp
                    <table class="report-table">
                        <thead>
                            <tr>
                                <th>Device</th>
                                <th class="right">Sessions</th>
                                <th class="right">%</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach ($deviceBreakdown as $d)
                                <tr>
                                    <td>{{ ucfirst($d['device_type']) }}</td>
                                    <td class="right bold">{{ number_format($d['sessions']) }}</td>
                                    <td class="right dim">{{ $totalDevices > 0 ? round(($d['sessions'] / $totalDevices) * 100) : 0 }}%</td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                @else
                    <p class="dim">No device data yet.</p>
                @endif

                {{-- Browser Breakdown --}}
                <div class="section-title" style="margin-top:14px;">Visitor Browsers</div>
                @if (count($browserBreakdown) > 0)
                    @php $totalBrowsers = array_sum(array_column($browserBreakdown, 'sessions')); @endphp
                    <table class="report-table">
                        <thead>
                            <tr>
                                <th>Browser</th>
                                <th class="right">Sessions</th>
                                <th class="right">%</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach ($browserBreakdown as $b)
                                <tr>
                                    <td>{{ ucfirst($b['browser']) }}</td>
                                    <td class="right bold">{{ number_format($b['sessions']) }}</td>
                                    <td class="right dim">{{ $totalBrowsers > 0 ? round(($b['sessions'] / $totalBrowsers) * 100) : 0 }}%</td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                @else
                    <p class="dim">No browser data yet.</p>
                @endif
            </div>
        </div>

        {{-- ── Top Events ── --}}
        <div class="section-title">Event Pages</div>
        @if (count($topEvents) > 0)
            <table class="report-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Event</th>
                        <th class="right">Total Views</th>
                        <th class="right">Unique Visitors</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($topEvents as $i => $ev)
                        <tr>
                            <td class="dim">{{ $i + 1 }}</td>
                            <td>
                                @php
                                    $slug = preg_match('/\/events\/([^\/?#]+)/', $ev['url'], $m) ? $m[1] : $ev['url'];
                                    $title = ucwords(str_replace('-', ' ', $slug));
                                @endphp
                                {{ mb_strlen($title) > 50 ? mb_substr($title, 0, 47) . '...' : $title }}
                            </td>
                            <td class="right bold">{{ number_format($ev['views']) }}</td>
                            <td class="right">{{ number_format($ev['unique_visitors']) }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        @else
            <p class="dim">No event page views for this period.</p>
        @endif

        {{-- ── Traffic Sources ── --}}
        <div class="section-title">Traffic Sources</div>

        {{-- Top Referrers --}}
        @if (count($topReferrers) > 0)
            @php $maxRef = $topReferrers[0]['sessions'] ?? 1; @endphp
            <table class="report-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Source</th>
                        <th class="right">Visits</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($topReferrers as $i => $ref)
                        <tr>
                            <td class="dim">{{ $i + 1 }}</td>
                            <td>{{ $ref['referrer_domain'] }}</td>
                            <td class="right bold">
                                <span class="bar-wrapper">
                                    <div class="bar-fill" style="width:{{ round(($ref['sessions'] / $maxRef) * 100) }}%"></div>
                                </span>
                                {{ number_format($ref['sessions']) }}
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        @else
            <p class="dim">No referral traffic for this period.</p>
        @endif

        {{-- UTM Campaigns --}}
        @if (count($utmSummary) > 0)
            <div class="section-title">Marketing Campaigns</div>
            <table class="report-table">
                <thead>
                    <tr>
                        <th>Channel</th>
                        <th>Type</th>
                        <th>Campaign</th>
                        <th class="right">Visits</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($utmSummary as $u)
                        <tr>
                            <td>{{ $u['utm_source'] }}</td>
                            <td>{{ $u['utm_medium'] ?? '—' }}</td>
                            <td>{{ $u['utm_campaign'] ?? '—' }}</td>
                            <td class="right bold">{{ number_format($u['sessions']) }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        @endif

        {{-- ── Footer ── --}}
        <div class="footer">
            <div class="footer-left">{{ config('app.name') }} &mdash; Confidential</div>
            <div class="footer-right">{{ $days }}-day report &nbsp;·&nbsp; Page 1</div>
        </div>

    </div>
</body>

</html>
