<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class TicketDiscountTier extends Model
{
    protected $fillable = [
        'event_ticket_id',
        'min_quantity',
        'discount_type',
        'discount_value',
    ];

    protected $casts = [
        'min_quantity'   => 'integer',
        'discount_value' => 'decimal:2',
    ];

    // ─── Relationships ────────────────────────────────────────────────────────

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(EventTicket::class, 'event_ticket_id');
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    /**
     * Get the highest qualifying tier for a given quantity.
     */
    public function scopeForQuantity(Builder $query, int $quantity): Builder
    {
        return $query->where('min_quantity', '<=', $quantity)
            ->reorder('min_quantity', 'desc');
    }
}
