<?php

namespace App\Http\Middleware;

use App\Jobs\RecordAnalyticsJob;
use App\Services\AnalyticsService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class TrackPageView
{
    public function __construct(
        private readonly AnalyticsService $analytics
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Only track GET requests that return a successful HTML response
        if (!$request->isMethod('GET') || !$this->isTrackableResponse($response)) {
            return $response;
        }

        // Skip admin and dashboard routes — only track public-facing pages
        $routeName = $request->route()?->getName() ?? '';
        if (str_starts_with($routeName, 'admin.') || str_starts_with($routeName, 'user.')) {
            return $response;
        }

        // Bot filter + DNT check
        if (!$this->analytics->shouldTrack($request)) {
            return $response;
        }

        $sessionId   = $request->cookie('_atid');
        $isNewSession = false;

        try {
            if (!$sessionId || !\App\Models\VisitorSession::where('id', $sessionId)->exists()) {
                $sessionId    = Str::uuid()->toString();
                $isNewSession = true;
            }
        } catch (\Throwable) {
            // Analytics tables not yet migrated — skip tracking silently
            return $response;
        }

        // Set the session cookie on the response (30 days, HTTP-only, SameSite=Lax)
        $response->headers->setCookie(
            cookie('_atid', $sessionId, 60 * 24 * 30, '/', null, false, true, false, 'Lax')
        );

        $url = $request->path() . ($request->getQueryString() ? '?' . $request->getQueryString() : '');

        RecordAnalyticsJob::dispatch(
            sessionId: $sessionId,
            userId: $request->user()?->id,
            ipHash: $this->analytics->hashIp($request->ip()),
            deviceType: $this->analytics->detectDeviceType($request->userAgent() ?? ''),
            browser: $this->analytics->detectBrowser($request->userAgent() ?? ''),
            referrerDomain: $this->analytics->extractDomain($request->header('Referer')),
            utmSource: $request->query('utm_source'),
            utmMedium: $request->query('utm_medium'),
            utmCampaign: $request->query('utm_campaign'),
            routeName: $routeName ?: null,
            url: '/' . $url,
            isNewSession: $isNewSession,
        );

        return $response;
    }

    private function isTrackableResponse(Response $response): bool
    {
        $status      = $response->getStatusCode();
        $contentType = $response->headers->get('Content-Type', '');

        // Only track 200 HTML responses (not redirects, errors, JSON, file downloads)
        return $status === 200 && str_contains($contentType, 'text/html');
    }
}
