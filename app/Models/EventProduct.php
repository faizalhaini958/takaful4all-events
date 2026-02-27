<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class EventProduct extends Model
{
    protected $fillable = [
        'event_id',
        'name',
        'description',
        'price',
        'currency',
        'variants_json',
        'stock',
        'media_id',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'price'         => 'decimal:2',
        'variants_json' => 'array',
        'stock'         => 'integer',
        'is_active'     => 'boolean',
        'sort_order'    => 'integer',
    ];

    // ─── Relationships ────────────────────────────────────────────────────────

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function media(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'media_id');
    }

    public function registrationProducts(): HasMany
    {
        return $this->hasMany(EventRegistrationProduct::class, 'product_id');
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }
}
