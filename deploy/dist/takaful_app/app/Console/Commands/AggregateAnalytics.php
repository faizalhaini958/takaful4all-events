<?php

namespace App\Console\Commands;

use App\Models\AnalyticsDailySummary;
use App\Models\AnalyticsEvent;
use App\Models\PageView;
use App\Models\VisitorSession;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class AggregateAnalytics extends Command
{
    protected $signature = 'analytics:aggregate
                            {--date= : ISO date to aggregate (default: yesterday)}
                            {--force : Re-aggregate even if a summary already exists for the date}';

    protected $description = 'Pre-aggregate raw analytics data into daily summary rows for fast dashboard queries';

    public function handle(): int
    {
        $dateStr = $this->option('date') ?? Carbon::yesterday()->toDateString();

        try {
            $date = Carbon::createFromFormat('Y-m-d', $dateStr)->startOfDay();
        } catch (\Throwable) {
            $this->error("Invalid date format: {$dateStr}. Expected YYYY-MM-DD.");
            return self::FAILURE;
        }

        $dateKey = $date->toDateString();
        $from    = $date->copy()->startOfDay();
        $to      = $date->copy()->endOfDay();

        if (! $this->option('force')) {
            $exists = AnalyticsDailySummary::where('date', $dateKey)
                ->where('metric_key', 'LIKE', 'sessions%')
                ->exists();

            if ($exists) {
                $this->line("Summaries for {$dateKey} already exist. Use --force to overwrite.");
                return self::SUCCESS;
            }
        }

        $this->info("Aggregating analytics for {$dateKey}…");

        $metrics = [];

        // ── Sessions ────────────────────────────────────────────────────────
        $metrics['sessions.total'] = VisitorSession::whereBetween('started_at', [$from, $to])->count();

        foreach (['mobile', 'tablet', 'desktop'] as $device) {
            $metrics["sessions.device.{$device}"] = VisitorSession::whereBetween('started_at', [$from, $to])
                ->where('device_type', $device)
                ->count();
        }

        foreach (['chrome', 'firefox', 'safari', 'edge', 'opera', 'other'] as $browser) {
            $metrics["sessions.browser.{$browser}"] = VisitorSession::whereBetween('started_at', [$from, $to])
                ->where('browser', $browser)
                ->count();
        }

        // ── Page views ───────────────────────────────────────────────────────
        $metrics['views.total'] = PageView::whereBetween('created_at', [$from, $to])->count();

        // ── Analytics events ─────────────────────────────────────────────────
        $eventCounts = AnalyticsEvent::select('event_category', 'event_type', DB::raw('COUNT(*) as cnt'))
            ->whereBetween('created_at', [$from, $to])
            ->groupBy('event_category', 'event_type')
            ->get();

        foreach ($eventCounts as $row) {
            $metrics["events.{$row->event_type}.{$row->event_category}"] = (int) $row->cnt;
        }

        // ── Funnel steps ─────────────────────────────────────────────────────
        $funnelSteps = AnalyticsEvent::select('event_label', DB::raw('COUNT(*) as cnt'))
            ->where('event_type', 'funnel_step')
            ->where('event_category', 'registration')
            ->whereBetween('created_at', [$from, $to])
            ->groupBy('event_label')
            ->get();

        foreach ($funnelSteps as $row) {
            $metrics["funnel.registration.{$row->event_label}"] = (int) $row->cnt;
        }

        // ── Upsert all metrics ────────────────────────────────────────────────
        $rows = [];
        foreach ($metrics as $key => $value) {
            $rows[] = ['date' => $dateKey, 'metric_key' => $key, 'value' => $value];
        }

        foreach (array_chunk($rows, 100) as $chunk) {
            AnalyticsDailySummary::upsert(
                $chunk,
                ['date', 'metric_key'],
                ['value']
            );
        }

        $this->info("Done. Stored " . count($metrics) . " metric(s) for {$dateKey}.");

        return self::SUCCESS;
    }
}
