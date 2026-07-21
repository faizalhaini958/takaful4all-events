<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EventZone extends Model
{
    protected $fillable = [
        'event_id',
        'name',
        'description',
        'color',
        'label_color',
        'perks',
        'image_path',
        'capacity',
        'sort_order',
    ];

    protected $casts = [
        'perks'      => 'array',
        'capacity'   => 'integer',
        'sort_order' => 'integer',
    ];

    protected $appends = ['image_url'];

    // ─── Accessors ────────────────────────────────────────────────────────────

    public function getImageUrlAttribute(): ?string
    {
        return $this->image_path ? '/storage/' . $this->image_path : null;
    }

    // ─── Relationships ────────────────────────────────────────────────────────

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function tickets(): HasMany
    {
        return $this->hasMany(EventTicket::class, 'event_zone_id')->orderBy('sort_order');
    }
}
