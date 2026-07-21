<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class VisitorSession extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'id',
        'user_id',
        'ip_hash',
        'device_type',
        'browser',
        'country_code',
        'referrer_domain',
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'page_count',
        'started_at',
        'last_seen_at',
    ];

    protected $casts = [
        'page_count'   => 'integer',
        'started_at'   => 'datetime',
        'last_seen_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function pageViews(): HasMany
    {
        return $this->hasMany(PageView::class, 'session_id');
    }

    public function analyticsEvents(): HasMany
    {
        return $this->hasMany(AnalyticsEvent::class, 'session_id');
    }
}
