<?php

namespace App\Jobs;

use App\Models\VisitorSession;
use App\Services\AnalyticsService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Http\Request;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class RecordAnalyticsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 2;
    public $backoff = 5;

    public function __construct(
        public readonly string $sessionId,
        public readonly ?int $userId,
        public readonly string $ipHash,
        public readonly string $deviceType,
        public readonly string $browser,
        public readonly ?string $referrerDomain,
        public readonly ?string $utmSource,
        public readonly ?string $utmMedium,
        public readonly ?string $utmCampaign,
        public readonly ?string $routeName,
        public readonly string $url,
        public readonly bool $isNewSession,
    ) {}

    public function handle(): void
    {
        if ($this->isNewSession) {
            VisitorSession::create([
                'id'              => $this->sessionId,
                'user_id'         => $this->userId,
                'ip_hash'         => $this->ipHash,
                'device_type'     => $this->deviceType,
                'browser'         => $this->browser,
                'country_code'    => null,
                'referrer_domain' => $this->referrerDomain,
                'utm_source'      => $this->utmSource,
                'utm_medium'      => $this->utmMedium,
                'utm_campaign'    => $this->utmCampaign,
                'page_count'      => 1,
                'started_at'      => now(),
                'last_seen_at'    => now(),
            ]);
        } else {
            $updates = [
                'last_seen_at' => now(),
            ];

            // Link to user if they authenticated during this session
            if ($this->userId) {
                $updates['user_id'] = $this->userId;
            }

            VisitorSession::where('id', $this->sessionId)->update($updates);
            VisitorSession::where('id', $this->sessionId)->increment('page_count');
        }

        \App\Models\PageView::create([
            'session_id'      => $this->sessionId,
            'user_id'         => $this->userId,
            'route_name'      => $this->routeName,
            'url'             => $this->url,
            'referrer_domain' => $this->referrerDomain,
            'created_at'      => now(),
        ]);
    }
}
