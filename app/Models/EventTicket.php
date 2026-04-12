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
        'event_zone_id',
        'name',
        'color',
        'description',
        'type',
        'price',
        'early_bird_price',
        'early_bird_end_at',
        'currency',
        'quantity',
        'max_per_order',
        'sale_start_at',
        'sale_end_at',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'price'              => 'decimal:2',
        'early_bird_price'   => 'decimal:2',
        'early_bird_end_at'  => 'datetime',
        'quantity'           => 'integer',
        'max_per_order'      => 'integer',
        'sale_start_at'      => 'datetime',
        'sale_end_at'        => 'datetime',
        'is_active'          => 'boolean',
        'sort_order'         => 'integer',
    ];

    protected $appends = ['sold_count', 'available_count', 'is_on_sale', 'current_price', 'is_early_bird'];

    // ─── Relationships ────────────────────────────────────────────────────────

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function zone(): BelongsTo
    {
        return $this->belongsTo(EventZone::class, 'event_zone_id');
    }

    public function registrations(): HasMany
    {
        return $this->hasMany(EventRegistration::class, 'ticket_id');
    }

    public function discountTiers(): HasMany
    {
        return $this->hasMany(TicketDiscountTier::class, 'event_ticket_id')->orderBy('min_quantity');
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

    /**
     * Whether early bird pricing is currently active.
     */
    public function getIsEarlyBirdAttribute(): bool
    {
        if ($this->early_bird_price === null || $this->early_bird_end_at === null) {
            return false;
        }

        return $this->early_bird_end_at->isFuture();
    }

    /**
     * The price to charge right now (early bird or regular).
     */
    public function getCurrentPriceAttribute(): string
    {
        if ($this->type === 'free') {
            return '0.00';
        }

        return $this->is_early_bird
            ? number_format((float) $this->early_bird_price, 2, '.', '')
            : number_format((float) $this->price, 2, '.', '');
    }
}
