<?php

namespace App\Models;

use DateTimeInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class PromoCode extends Model
{
    use LogsActivity;

    protected $fillable = [
        'code',
        'discount_type',
        'discount_value',
        'max_uses',
        'used_count',
        'max_uses_per_user',
        'min_order_amount',
        'event_id',
        'starts_at',
        'expires_at',
        'is_active',
        'created_by',
    ];

    protected $casts = [
        'discount_value'     => 'decimal:2',
        'max_uses'           => 'integer',
        'used_count'         => 'integer',
        'max_uses_per_user'  => 'integer',
        'min_order_amount'   => 'decimal:2',
        'starts_at'          => 'datetime',
        'expires_at'         => 'datetime',
        'is_active'          => 'boolean',
    ];

    protected function serializeDate(DateTimeInterface $date): string
    {
        return $date->format('Y-m-d\TH:i:s');
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['code', 'discount_type', 'discount_value', 'max_uses', 'expires_at', 'is_active'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('promo_code');
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function isValid(): bool
    {
        if (! $this->is_active) {
            return false;
        }

        if ($this->starts_at && now()->lt($this->starts_at)) {
            return false;
        }

        if ($this->expires_at && now()->gt($this->expires_at)) {
            return false;
        }

        if ($this->max_uses !== null && $this->used_count >= $this->max_uses) {
            return false;
        }

        return true;
    }

    public function isValidForEvent(?int $eventId): bool
    {
        if (! $this->isValid()) {
            return false;
        }

        // If code is scoped to a specific event, it must match
        if ($this->event_id !== null && $this->event_id !== $eventId) {
            return false;
        }

        return true;
    }

    public function canBeUsedByUser(?int $userId): bool
    {
        if ($this->max_uses_per_user === null || $userId === null) {
            return true;
        }

        $userUsageCount = EventRegistration::where('promo_code_id', $this->id)
            ->where('user_id', $userId)
            ->whereNotIn('status', ['cancelled'])
            ->count();

        return $userUsageCount < $this->max_uses_per_user;
    }
}
