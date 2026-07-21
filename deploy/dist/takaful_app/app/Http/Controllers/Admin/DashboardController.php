<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventRegistration;
use App\Models\Media;
use App\Models\Page;
use App\Models\PageView;
use App\Models\Post;
use App\Models\VisitorSession;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response|\Illuminate\Http\RedirectResponse
    {
        if (request()->user()?->isCheckinStaff()) {
            return redirect()->route('admin.events.index');
        }

        return Inertia::render('Admin/DashboardV2', $this->buildDashboardData());
    }

    public function preview(): Response|\Illuminate\Http\RedirectResponse
    {
        if (request()->user()?->isCheckinStaff()) {
            return redirect()->route('admin.events.index');
        }

        return Inertia::render('Admin/DashboardV2', $this->buildDashboardData());
    }

    private function buildDashboardData(): array
    {
        $now = now();
        $thirtyDaysAgo = $now->copy()->subDays(30)->startOfDay();
        $previousThirty = $thirtyDaysAgo->copy()->subDays(30)->startOfDay();

        return [
            'stats' => [
                'events' => [
                    'total'    => Event::count(),
                    'upcoming' => Event::where('is_published', true)->where('start_at', '>', $now)->count(),
                    'past'     => Event::where('is_published', true)->where('start_at', '<=', $now)->count(),
                    'draft'    => Event::where('is_published', false)->count(),
                ],
                'registrations' => [
                    'total'             => EventRegistration::count(),
                    'confirmed'         => EventRegistration::where('status', 'confirmed')->count(),
                    'pending'           => EventRegistration::where('status', 'pending')->count(),
                    'awaiting_payment'  => EventRegistration::where('status', 'awaiting_payment')->count(),
                    'revenue'           => EventRegistration::where('payment_status', 'paid')->sum('total_amount'),
                ],
                'posts' => [
                    'total'   => Post::count(),
                    'podcast' => Post::where('type', 'podcast')->count(),
                    'webinar' => Post::where('type', 'webinar')->count(),
                    'article' => Post::where('type', 'article')->count(),
                ],
                'pages' => Page::count(),
                'media' => Media::count(),
            ],

            'monthOverMonth' => [
                'events' => $this->compare(
                    Event::whereBetween('created_at', [$thirtyDaysAgo, $now])->count(),
                    Event::whereBetween('created_at', [$previousThirty, $thirtyDaysAgo])->count(),
                ),
                'registrations' => $this->compare(
                    EventRegistration::whereBetween('created_at', [$thirtyDaysAgo, $now])->count(),
                    EventRegistration::whereBetween('created_at', [$previousThirty, $thirtyDaysAgo])->count(),
                ),
                'revenue' => $this->compare(
                    (float) EventRegistration::where('payment_status', 'paid')->whereBetween('created_at', [$thirtyDaysAgo, $now])->sum('total_amount'),
                    (float) EventRegistration::where('payment_status', 'paid')->whereBetween('created_at', [$previousThirty, $thirtyDaysAgo])->sum('total_amount'),
                ),
            ],

            'registrationTrend' => $this->fillDailyGaps(
                EventRegistration::select(
                        DB::raw('DATE(created_at) as date'),
                        DB::raw('COUNT(*) as count')
                    )
                    ->where('created_at', '>=', $thirtyDaysAgo)
                    ->groupBy('date')
                    ->pluck('count', 'date')
                    ->all(),
                $thirtyDaysAgo,
                $now,
                'count',
            ),

            'revenueTrend' => $this->fillDailyGaps(
                EventRegistration::select(
                        DB::raw('DATE(created_at) as date'),
                        DB::raw('SUM(total_amount) as amount')
                    )
                    ->where('payment_status', 'paid')
                    ->where('created_at', '>=', $thirtyDaysAgo)
                    ->groupBy('date')
                    ->pluck('amount', 'date')
                    ->all(),
                $thirtyDaysAgo,
                $now,
                'amount',
            ),

            'eventCategoryBreakdown' => Event::select(
                    'event_category',
                    DB::raw('COUNT(*) as count')
                )
                ->whereNotNull('event_category')
                ->groupBy('event_category')
                ->orderByDesc('count')
                ->get()
                ->toArray(),

            'registrationStatusBreakdown' => EventRegistration::select(
                    'status',
                    DB::raw('COUNT(*) as count')
                )
                ->groupBy('status')
                ->orderByDesc('count')
                ->get()
                ->toArray(),

            'recentRegistrations' => EventRegistration::with(['event' => fn ($q) => $q->select('id', 'title', 'slug')])
                ->latest()
                ->take(10)
                ->get()
                ->map(fn ($r) => [
                    'id'           => $r->id,
                    'name'         => $r->name,
                    'email'        => $r->email,
                    'event'        => $r->event ? ['title' => $r->event->title, 'slug' => $r->event->slug] : null,
                    'status'       => $r->status,
                    'total_amount' => $r->total_amount,
                    'created_at'   => $r->created_at->toISOString(),
                ])
                ->values()
                ->toArray(),

            'recentEvents' => Event::with('media')
                ->withCount('registrations')
                ->latest()
                ->take(5)
                ->get(),

            'analyticsSnapshot' => [
                'today_visits'     => VisitorSession::whereDate('started_at', today())->count(),
                'today_page_views' => PageView::whereDate('created_at', today())->count(),
                'active_visitors'  => VisitorSession::where('last_seen_at', '>=', now()->subMinutes(5))->count(),
                'top_pages'        => PageView::select('url', DB::raw('COUNT(*) as views'))
                    ->whereDate('created_at', today())
                    ->groupBy('url')
                    ->orderByDesc('views')
                    ->limit(5)
                    ->get()
                    ->toArray(),
                'daily_visitors'   => VisitorSession::select(
                        DB::raw('DATE(started_at) as date'),
                        DB::raw('COUNT(*) as sessions')
                    )
                    ->where('started_at', '>=', now()->subDays(7)->startOfDay())
                    ->groupBy('date')
                    ->orderBy('date')
                    ->get()
                    ->toArray(),
            ],
        ];
    }

    /**
     * Build a comparison payload the frontend can render sensibly at any baseline.
     * Percentage is only meaningful when previous is non-zero; otherwise the
     * client falls back to absolute delta.
     */
    private function compare(float|int $current, float|int $previous): array
    {
        $delta = $current - $previous;

        return [
            'current'    => $current,
            'previous'   => $previous,
            'delta'      => $delta,
            'change_pct' => $previous > 0 ? round(($delta / $previous) * 100, 1) : null,
        ];
    }

    /**
     * Fill missing days in a daily-aggregate series with zeros so a 30-day chart
     * actually spans 30 days on the x-axis.
     */
    private function fillDailyGaps(array $rowsByDate, Carbon $start, Carbon $end, string $valueKey): array
    {
        $out = [];
        $cursor = $start->copy()->startOfDay();
        $last = $end->copy()->startOfDay();
        $castInt = $valueKey === 'count';

        while ($cursor <= $last) {
            $key = $cursor->toDateString();
            $raw = $rowsByDate[$key] ?? 0;
            $out[] = [
                'date'    => $key,
                $valueKey => $castInt ? (int) $raw : (float) $raw,
            ];
            $cursor->addDay();
        }

        return $out;
    }
}
