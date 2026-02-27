<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class EventTicket extends Model
{
    protected $fillable = [
        'event_id',
        'name',
        'description',
        'type',
        'price',
        'currency',
        'quantity',
        'max_per_order',
        'sale_start_at',
        'sale_end_at',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'price'         => 'decimal:2',
        'quantity'       => 'integer',
        'max_per_order'  => 'integer',
        'sale_start_at'  => 'datetime',
        'sale_end_at'    => 'datetime',
        'is_active'      => 'boolean',
        'sort_order'     => 'integer',
    ];

    protected $appends = ['sold_count', 'available_count', 'is_on_sale'];

    // ─── Relationships ────────────────────────────────────────────────────────

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function registrations(): HasMany
    {
        return $this->hasMany(EventRegistration::class, 'ticket_id');
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeOnSale(Builder $query): Builder
    {
        return $query->active()
            ->where(function ($q) {
                $q->whereNull('sale_start_at')->orWhere('sale_start_at', '<=', now());
            })
            ->where(function ($q) {
                $q->whereNull('sale_end_at')->orWhere('sale_end_at', '>=', now());
            });
    }

    // ─── Accessors ────────────────────────────────────────────────────────────

    public function getSoldCountAttribute(): int
    {
        return $this->registrations()
            ->whereNotIn('status', ['cancelled'])
            ->sum('quantity');
    }

    public function getAvailableCountAttribute(): ?int
    {
        if ($this->quantity === null) {
            return null; // unlimited
        }

        return max(0, $this->quantity - $this->sold_count);
    }

    public function getIsOnSaleAttribute(): bool
    {
        if (!$this->is_active) return false;
        if ($this->sale_start_at && $this->sale_start_at->isFuture()) return false;
        if ($this->sale_end_at && $this->sale_end_at->isPast()) return false;
        if ($this->available_count !== null && $this->available_count <= 0) return false;

        return true;
    }
}
