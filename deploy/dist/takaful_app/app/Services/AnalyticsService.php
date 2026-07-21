<?php

namespace App\Services;

use App\Models\AnalyticsEvent;
use App\Models\PageView;
use App\Models\VisitorSession;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AnalyticsService
{
    /**
     * Known bot User-Agent signatures to filter out.
     */
    private const BOT_SIGNATURES = [
        'bot', 'crawl', 'spider', 'slurp', 'mediapartners',
        'googlebot', 'bingbot', 'yandexbot', 'duckduckbot',
        'facebookexternalhit', 'twitterbot', 'linkedinbot',
        'whatsapp', 'telegram', 'curl', 'wget', 'python-requests',
        'go-http-client', 'okhttp', 'apache-httpclient',
    ];

    /**
     * Allowed event types for client-side tracking (whitelist).
     */
    public const ALLOWED_EVENT_TYPES = ['click', 'view', 'funnel_step'];

    /**
     * Allowed event categories for client-side tracking (whitelist).
     */
    public const ALLOWED_EVENT_CATEGORIES = [
        'event_card',
        'register_button',
        'event_detail',
        'registration',
        'banner',
        'webinar_card',
        'podcast_card',
    ];

    /**
     * Determine if this request should be tracked.
     * Returns false for bots, empty UAs, and Do Not Track requests.
     */
    public function shouldTrack(Request $request): bool
    {
        // Respect Do Not Track header
        if ($request->header('DNT') === '1') {
            return false;
        }

        $userAgent = strtolower($request->userAgent() ?? '');

        // Skip empty User-Agents
        if (empty($userAgent)) {
            return false;
        }

        // Skip known bots and crawlers
        foreach (self::BOT_SIGNATURES as $bot) {
            if (str_contains($userAgent, $bot)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Resolve an existing session from cookie or create a new one.
     */
    public function resolveOrCreateSession(Request $request): VisitorSession
    {
        $sessionId = $request->cookie('_atid');

        if ($sessionId) {
            $session = VisitorSession::find($sessionId);
            if ($session) {
                return $session;
            }
        }

        return $this->createSession($request);
    }

    /**
     * Create a brand-new anonymous visitor session.
     */
    public function createSession(Request $request): VisitorSession
    {
        return VisitorSession::create([
            'id'               => Str::uuid()->toString(),
            'user_id'          => $request->user()?->id,
            'ip_hash'          => $this->hashIp($request->ip()),
            'device_type'      => $this->detectDeviceType($request->userAgent() ?? ''),
            'browser'          => $this->detectBrowser($request->userAgent() ?? ''),
            'country_code'     => null, // Reserved for future geolocation
            'referrer_domain'  => $this->extractDomain($request->header('Referer')),
            'utm_source'       => $request->query('utm_source'),
            'utm_medium'       => $request->query('utm_medium'),
            'utm_campaign'     => $request->query('utm_campaign'),
            'page_count'       => 0,
            'started_at'       => now(),
            'last_seen_at'     => now(),
        ]);
    }

    /**
     * Record a single page view and update session metadata.
     */
    public function recordPageView(VisitorSession $session, Request $request): void
    {
        PageView::create([
            'session_id'      => $session->id,
            'user_id'         => $request->user()?->id,
            'route_name'      => $request->route()?->getName(),
            'url'             => $request->path() . ($request->getQueryString() ? '?' . $request->getQueryString() : ''),
            'referrer_domain' => $this->extractDomain($request->header('Referer')),
            'created_at'      => now(),
        ]);

        // Update session counters and timestamps
        $session->increment('page_count');
        $updates = ['last_seen_at' => now()];

        // Link session to user if they just authenticated
        if (!$session->user_id && $request->user()) {
            $updates['user_id'] = $request->user()->id;
        }

        $session->update($updates);
    }

    /**
     * Record a client-side analytics event.
     */
    public function recordEvent(
        VisitorSession $session,
        Request $request,
        string $eventType,
        string $eventCategory,
        ?string $eventLabel,
        ?array $eventData
    ): void {
        AnalyticsEvent::create([
            'session_id'     => $session->id,
            'user_id'        => $request->user()?->id,
            'event_type'     => $eventType,
            'event_category' => $eventCategory,
            'event_label'    => $eventLabel,
            'event_data'     => $eventData,
            'created_at'     => now(),
        ]);

        $session->update(['last_seen_at' => now()]);
    }

    /**
     * Hash an IP address with a server-side salt derived from APP_KEY.
     * The result is irreversible — no raw IP is ever stored.
     */
    public function hashIp(?string $ip): ?string
    {
        if (!$ip) {
            return null;
        }

        $salt = substr(config('app.key'), 0, 16);

        return hash('sha256', $ip . $salt);
    }

    /**
     * Derive device type from User-Agent string.
     */
    public function detectDeviceType(string $userAgent): string
    {
        $ua = strtolower($userAgent);

        if (str_contains($ua, 'mobile') || str_contains($ua, 'android') || str_contains($ua, 'iphone')) {
            return 'mobile';
        }

        if (str_contains($ua, 'tablet') || str_contains($ua, 'ipad')) {
            return 'tablet';
        }

        return 'desktop';
    }

    /**
     * Derive browser family from User-Agent string.
     */
    public function detectBrowser(string $userAgent): string
    {
        $ua = strtolower($userAgent);

        if (str_contains($ua, 'edg/') || str_contains($ua, 'edge/')) {
            return 'edge';
        }

        if (str_contains($ua, 'firefox/')) {
            return 'firefox';
        }

        if (str_contains($ua, 'opr/') || str_contains($ua, 'opera/')) {
            return 'opera';
        }

        if (str_contains($ua, 'chrome/') || str_contains($ua, 'chromium/')) {
            return 'chrome';
        }

        if (str_contains($ua, 'safari/')) {
            return 'safari';
        }

        return 'other';
    }

    /**
     * Extract just the domain from a full URL (referrer).
     * Strips path, query, and fragment so no PII leaks from referrer URLs.
     */
    public function extractDomain(?string $url): ?string
    {
        if (!$url) {
            return null;
        }

        $host = parse_url($url, PHP_URL_HOST);

        return $host ?: null;
    }
}
