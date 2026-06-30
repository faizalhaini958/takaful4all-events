<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AnalyticsDailySummary;
use App\Models\AnalyticsEvent;
use App\Models\Event;
use App\Models\EventRegistration;
use App\Models\PageView;
use App\Models\Setting;
use App\Models\VisitorSession;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AnalyticsController extends Controller
{
    /**
     * Main analytics dashboard.
     */
    public function index(Request $request): Response
    {
        $days  = (int) $request->query('days', 30);
        $days  = in_array($days, [7, 14, 30, 90]) ? $days : 30;
        $from  = now()->subDays($days)->startOfDay();
        $to    = now()->endOfDay();

        return Inertia::render('Admin/Analytics/Index', [
            'days'            => $days,
            'overview'        => $this->getOverview($from, $to),
            'topPages'        => $this->getTopPages($from, $to),
            'deviceBreakdown' => $this->getDeviceBreakdown($from, $to),
            'browserBreakdown'=> $this->getBrowserBreakdown($from, $to),
            'topReferrers'    => $this->getTopReferrers($from, $to),
            'utmSummary'      => $this->getUtmSummary($from, $to),
            'visitorsOverTime'=> $this->getVisitorsOverTime($from, $to),
            'topEvents'       => $this->getTopEvents($from, $to),
        ]);
    }

    /**
     * Real-time active visitor data — polled every 30 seconds by the frontend.
     */
    public function realtime(): JsonResponse
    {
        $cutoff = now()->subMinutes(5);

        $activeSessions = VisitorSession::where('last_seen_at', '>=', $cutoff)->count();

        $activePages = PageView::select('url', DB::raw('COUNT(DISTINCT session_id) as visitors'))
            ->where('created_at', '>=', $cutoff)
            ->groupBy('url')
            ->orderByDesc('visitors')
            ->limit(10)
            ->get();

        return response()->json([
            'active_sessions' => $activeSessions,
            'active_pages'    => $activePages,
        ]);
    }

    /**
     * Per-event analytics data.
     */
    public function event(Request $request, string $slug): JsonResponse
    {
        $event = Event::where('slug', $slug)->firstOrFail();

        $views = PageView::where('route_name', 'events.show')
            ->where('url', 'like', '%/events/' . $slug . '%')
            ->count();

        $uniqueVisitors = PageView::where('route_name', 'events.show')
            ->where('url', 'like', '%/events/' . $slug . '%')
            ->distinct('session_id')
            ->count('session_id');

        $registerClicks = AnalyticsEvent::where('event_category', 'register_button')
            ->where('event_label', $slug)
            ->count();

        $registrations = EventRegistration::where('event_id', $event->id)
            ->whereIn('status', ['confirmed', 'attended'])
            ->count();

        $conversionRate = $views > 0
            ? round(($registrations / $views) * 100, 1)
            : 0;

        $viewsOverTime = PageView::select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('COUNT(*) as views')
            )
            ->where('route_name', 'events.show')
            ->where('url', 'like', '%/events/' . $slug . '%')
            ->where('created_at', '>=', now()->subDays(30))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return response()->json([
            'views'           => $views,
            'unique_visitors' => $uniqueVisitors,
            'register_clicks' => $registerClicks,
            'registrations'   => $registrations,
            'conversion_rate' => $conversionRate,
            'views_over_time' => $viewsOverTime,
        ]);
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private function getOverview($from, $to): array
    {
        $totalSessions = VisitorSession::whereBetween('started_at', [$from, $to])->count();
        $totalViews    = PageView::whereBetween('created_at', [$from, $to])->count();

        $previousFrom  = (clone $from)->subDays($from->diffInDays($to));
        $previousTo    = $from;
        $prevSessions  = VisitorSession::whereBetween('started_at', [$previousFrom, $previousTo])->count();
        $prevViews     = PageView::whereBetween('created_at', [$previousFrom, $previousTo])->count();

        return [
            'total_sessions'         => $totalSessions,
            'total_views'            => $totalViews,
            'sessions_change_pct'    => $prevSessions > 0 ? round((($totalSessions - $prevSessions) / $prevSessions) * 100, 1) : null,
            'views_change_pct'       => $prevViews > 0 ? round((($totalViews - $prevViews) / $prevViews) * 100, 1) : null,
        ];
    }

    private function getTopPages($from, $to): array
    {
        return PageView::select('url', 'route_name', DB::raw('COUNT(*) as views'))
            ->whereBetween('created_at', [$from, $to])
            ->groupBy('url', 'route_name')
            ->orderByDesc('views')
            ->limit(10)
            ->get()
            ->toArray();
    }

    private function getDeviceBreakdown($from, $to): array
    {
        return VisitorSession::select('device_type', DB::raw('COUNT(*) as sessions'))
            ->whereBetween('started_at', [$from, $to])
            ->groupBy('device_type')
            ->orderByDesc('sessions')
            ->get()
            ->toArray();
    }

    private function getBrowserBreakdown($from, $to): array
    {
        return VisitorSession::select('browser', DB::raw('COUNT(*) as sessions'))
            ->whereBetween('started_at', [$from, $to])
            ->groupBy('browser')
            ->orderByDesc('sessions')
            ->get()
            ->toArray();
    }

    private function getTopReferrers($from, $to): array
    {
        return VisitorSession::select('referrer_domain', DB::raw('COUNT(*) as sessions'))
            ->whereBetween('started_at', [$from, $to])
            ->whereNotNull('referrer_domain')
            ->groupBy('referrer_domain')
            ->orderByDesc('sessions')
            ->limit(10)
            ->get()
            ->toArray();
    }

    private function getUtmSummary($from, $to): array
    {
        return VisitorSession::select('utm_source', 'utm_medium', 'utm_campaign', DB::raw('COUNT(*) as sessions'))
            ->whereBetween('started_at', [$from, $to])
            ->whereNotNull('utm_source')
            ->groupBy('utm_source', 'utm_medium', 'utm_campaign')
            ->orderByDesc('sessions')
            ->limit(10)
            ->get()
            ->toArray();
    }

    private function getVisitorsOverTime($from, $to): array
    {
        return VisitorSession::select(
                DB::raw('DATE(started_at) as date'),
                DB::raw('COUNT(*) as sessions')
            )
            ->whereBetween('started_at', [$from, $to])
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->toArray();
    }

    private function getTopEvents($from, $to): array
    {
        return PageView::select('url', DB::raw('COUNT(*) as views'), DB::raw('COUNT(DISTINCT session_id) as unique_visitors'))
            ->where('route_name', 'events.show')
            ->whereBetween('created_at', [$from, $to])
            ->groupBy('url')
            ->orderByDesc('views')
            ->limit(10)
            ->get()
            ->toArray();
    }

    /**
     * Export analytics data as PDF report.
     */
    public function exportPdf(Request $request): \Illuminate\Http\Response
    {
        $days = (int) $request->query('days', 30);
        $days = in_array($days, [7, 14, 30, 90]) ? $days : 30;
        $from = now()->subDays($days)->startOfDay();
        $to   = now()->endOfDay();

        $dompdfPublicPath = $this->resolveDompdfPublicPath();
        Config::set('dompdf.public_path', $dompdfPublicPath);

        $pdf = Pdf::setOption('chroot', $dompdfPublicPath)
            ->setPaper('a4', 'portrait')
            ->loadView('reports.analytics', [
                'days'             => $days,
                'from'             => $from,
                'to'               => $to,
                'settings'         => Setting::getGroup('invoicing'),
                'overview'         => $this->getOverview($from, $to),
                'topPages'         => $this->getTopPages($from, $to),
                'deviceBreakdown'  => $this->getDeviceBreakdown($from, $to),
                'browserBreakdown' => $this->getBrowserBreakdown($from, $to),
                'topReferrers'     => $this->getTopReferrers($from, $to),
                'utmSummary'       => $this->getUtmSummary($from, $to),
                'visitorsOverTime' => $this->getVisitorsOverTime($from, $to),
                'topEvents'        => $this->getTopEvents($from, $to),
            ]);

        $filename = 'analytics-report-' . now()->format('Ymd-His') . '.pdf';

        return $pdf->download($filename);
    }

    /**
     * Resolve a real public path for DomPDF (shared hosting safe).
     */
    private function resolveDompdfPublicPath(): string
    {
        $candidates = [
            env('APP_PUBLIC_PATH'),
            public_path(),
            dirname(base_path()) . '/public_html',
            base_path('../public_html'),
            storage_path('app/public'),
            base_path('public'),
        ];

        foreach ($candidates as $candidate) {
            if (!empty($candidate) && is_dir($candidate)) {
                return $candidate;
            }
        }

        return base_path();
    }
}
