<?php

namespace App\Http\Controllers;

use App\Jobs\RecordAnalyticsJob;
use App\Models\AnalyticsEvent;
use App\Models\VisitorSession;
use App\Services\AnalyticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnalyticsController extends Controller
{
    public function __construct(
        private readonly AnalyticsService $analytics
    ) {}

    /**
     * Receive a client-side analytics event.
     * Rate-limited to 60 requests/minute per session.
     */
    public function track(Request $request): JsonResponse
    {
        // Validate — strict whitelist to prevent abuse and PII leakage
        $validated = $request->validate([
            'event_type'     => ['required', 'string', 'in:' . implode(',', AnalyticsService::ALLOWED_EVENT_TYPES)],
            'event_category' => ['required', 'string', 'in:' . implode(',', AnalyticsService::ALLOWED_EVENT_CATEGORIES)],
            'event_label'    => ['nullable', 'string', 'max:255', 'regex:/^[a-zA-Z0-9_\-\.]+$/'],
            'event_data'     => ['nullable', 'array', 'max:10'],
            'event_data.*'   => ['nullable', 'string', 'max:200'],
        ]);

        $sessionId = $request->cookie('_atid');

        // Silently ignore requests without a valid session cookie
        if (!$sessionId || !VisitorSession::where('id', $sessionId)->exists()) {
            return response()->json(['ok' => true]);
        }

        AnalyticsEvent::create([
            'session_id'     => $sessionId,
            'user_id'        => $request->user()?->id,
            'event_type'     => $validated['event_type'],
            'event_category' => $validated['event_category'],
            'event_label'    => $validated['event_label'] ?? null,
            'event_data'     => $validated['event_data'] ?? null,
            'created_at'     => now(),
        ]);

        VisitorSession::where('id', $sessionId)->update(['last_seen_at' => now()]);

        return response()->json(['ok' => true]);
    }
}
