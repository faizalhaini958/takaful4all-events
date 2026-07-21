<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventRegistration;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Activitylog\Models\Activity;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ActivityLogController extends Controller
{
    private const MODEL_TYPES = [
        'Event'            => ['label' => 'Events', 'route' => 'admin.events.edit', 'routeKey' => 'event'],
        'EventRegistration'=> ['label' => 'Registrations', 'route' => 'admin.events.registrations.show', 'routeKey' => null],
        'Post'             => ['label' => 'Posts', 'route' => 'admin.posts.edit', 'routeKey' => 'post'],
        'Page'             => ['label' => 'Pages', 'route' => 'admin.pages.edit', 'routeKey' => 'page'],
        'User'             => ['label' => 'Users', 'route' => 'admin.users.edit', 'routeKey' => 'user'],
    ];

    public function index(Request $request): Response
    {
        $search    = $request->get('search', '');
        $dateFrom  = $request->get('date_from', '');
        $dateTo    = $request->get('date_to', '');
        $modelType = $request->get('type', '');

        $query = Activity::with('causer')
            ->latest();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                  ->orWhereHas('causer', fn ($u) => $u->where('name', 'like', "%{$search}%"));
            });
        }

        if ($dateFrom) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }

        if ($dateTo) {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        if ($modelType && isset(self::MODEL_TYPES[$modelType])) {
            $query->where('subject_type', 'App\\Models\\' . $modelType);
        }

        $logs = $query->paginate(30)->withQueryString();

        $todayCount  = Activity::whereDate('created_at', today())->count();
        $weekCount   = Activity::whereDate('created_at', '>=', now()->subDays(7))->count();
        $mostActive  = Activity::selectRaw('causer_id, causer_type, count(*) as count')
            ->whereDate('created_at', '>=', now()->subDays(30))
            ->whereNotNull('causer_id')
            ->groupBy('causer_id', 'causer_type')
            ->orderByDesc('count')
            ->first();
        $mostActiveName = null;
        if ($mostActive?->causer_type && $mostActive?->causer_id) {
            $mostActiveName = \App\Models\User::find($mostActive->causer_id)?->name;
        }

        return Inertia::render('Admin/ActivityLog', [
            'logs'            => $logs->through(fn ($log) => [
                'id'            => $log->id,
                'description'   => $log->description,
                'subject_type'  => $log->subject_type ? class_basename($log->subject_type) : null,
                'subject_id'    => $log->subject_id,
                'subject_url'   => $this->buildSubjectUrl($log),
                'properties'    => $log->properties,
                'created_at'    => $log->created_at?->toIso8601String(),
                'causer'        => $log->causer ? [
                    'id'   => $log->causer->id,
                    'name' => $log->causer->name,
                ] : null,
            ]),
            'stats'           => [
                'today'             => $todayCount,
                'week'              => $weekCount,
                'most_active_name'  => $mostActiveName,
                'most_active_count' => $mostActive?->count ?? 0,
            ],
            'modelTypes'      => self::MODEL_TYPES,
            'currentSearch'   => $search,
            'currentDateFrom' => $dateFrom,
            'currentDateTo'   => $dateTo,
            'currentType'     => $modelType,
        ]);
    }

    public function export(Request $request): StreamedResponse
    {
        $search    = $request->get('search', '');
        $dateFrom  = $request->get('date_from', '');
        $dateTo    = $request->get('date_to', '');
        $modelType = $request->get('type', '');

        $query = Activity::with('causer')->latest();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                  ->orWhereHas('causer', fn ($u) => $u->where('name', 'like', "%{$search}%"));
            });
        }

        if ($dateFrom) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }

        if ($dateTo) {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        if ($modelType && isset(self::MODEL_TYPES[$modelType])) {
            $query->where('subject_type', 'App\\Models\\' . $modelType);
        }

        $logs = $query->get();

        $filename = 'activity-log-' . now()->format('Ymd-His') . '.csv';

        $headers = [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];

        $callback = function () use ($logs) {
            $handle = fopen('php://output', 'w');
            fwrite($handle, "\xEF\xBB\xBF");
            fputcsv($handle, ['Time', 'Admin', 'Action', 'Subject Type', 'Subject ID', 'Changes']);

            foreach ($logs as $log) {
                $subjectType = $log->subject_type ? class_basename($log->subject_type) : '';
                $changes = '';
                $attrs = $log->properties['attributes'] ?? null;
                $old = $log->properties['old'] ?? null;
                if ($attrs) {
                    $parts = [];
                    foreach ($attrs as $key => $val) {
                        $from = $old[$key] ?? '—';
                        $parts[] = "{$key}: {$from} → {$val}";
                    }
                    $changes = implode('; ', $parts);
                }

                fputcsv($handle, [
                    $log->created_at?->format('Y-m-d H:i:s'),
                    $log->causer?->name ?? 'System',
                    $log->description,
                    $subjectType,
                    $log->subject_id ?? '',
                    $changes,
                ]);
            }

            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }

    private function buildSubjectUrl(Activity $log): ?string
    {
        if (!$log->subject_type || !$log->subject_id) {
            return null;
        }

        $type   = class_basename($log->subject_type);
        $config = self::MODEL_TYPES[$type] ?? null;
        if (!$config || empty($config['route'])) {
            return null;
        }

        try {
            if ($config['routeKey']) {
                $subject = $log->subject;
                if ($subject) {
                    return route($config['route'], [$config['routeKey'] => $subject->getRouteKey()]);
                }
            }

            // Registration needs event slug
            if ($type === 'EventRegistration') {
                $registration = \App\Models\EventRegistration::with('event')->find($log->subject_id);
                if ($registration?->event) {
                    return route('admin.events.registrations.show', [
                        'event'        => $registration->event->slug,
                        'registration' => $registration->id,
                    ]);
                }
            }

            return null;
        } catch (\Throwable) {
            return null;
        }
    }
}
