<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class ShippingZone extends Model
{
    protected $fillable = [
        'name',
        'countries',
        'states',
        'rate',
        'rate_type',
        'free_shipping_min',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'countries'         => 'array',
        'states'            => 'array',
        'rate'              => 'decimal:2',
        'free_shipping_min' => 'decimal:2',
        'is_active'         => 'boolean',
        'sort_order'        => 'integer',
    ];

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Find the shipping zone that covers a given country and optional state.
     * State-level matching takes priority over country-only matching.
     */
    public static function findByLocation(string $countryCode, ?string $stateCode = null): ?self
    {
        $zones = static::active()->ordered()->get()
            ->filter(fn (self $zone) => in_array($countryCode, $zone->countries ?? [], true));

        if ($stateCode && $zones->count() > 1) {
            // Prefer zone with matching state
            $stateMatch = $zones->first(fn (self $zone) =>
                !empty($zone->states) && in_array($stateCode, $zone->states, true)
            );

            if ($stateMatch) {
                return $stateMatch;
            }
        }

        // Fall back to first zone matching the country (zone without states = covers whole country)
        return $zones->first(fn (self $zone) => empty($zone->states)) ?? $zones->first();
    }

    /**
     * Calculate shipping cost for a given subtotal and item count.
     */
    public function calculateShipping(float $subtotal, int $itemCount = 1): float
    {
        if ($this->free_shipping_min && $subtotal >= (float) $this->free_shipping_min) {
            return 0;
        }

        return $this->rate_type === 'per_item'
            ? (float) $this->rate * $itemCount
            : (float) $this->rate;
    }
}
