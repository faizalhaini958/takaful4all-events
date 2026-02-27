<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;
use Spatie\Sluggable\HasSlug;
use Spatie\Sluggable\SlugOptions;

class Event extends Model
{
    use HasSlug;

    protected $fillable = [
        'title',
        'slug',
        'excerpt',
        'content_html',
        'start_at',
        'end_at',
        'venue',
        'city',
        'state',
        'country',
        'registration_url',
        'media_id',
        'is_published',
        'rsvp_enabled',
        'rsvp_deadline',
        'max_attendees',
        'require_approval',
        'meta_json',
    ];

    protected $appends = ['status'];

    protected $casts = [
        'start_at'         => 'datetime',
        'end_at'           => 'datetime',
        'is_published'     => 'boolean',
        'rsvp_enabled'     => 'boolean',
        'rsvp_deadline'    => 'datetime',
        'max_attendees'    => 'integer',
        'require_approval' => 'boolean',
        'meta_json'        => 'array',
    ];

    public function getSlugOptions(): SlugOptions
    {
        return SlugOptions::create()
            ->generateSlugsFrom('title')
            ->saveSlugsTo('slug');
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    // --- Relationships ---

    public function media(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'media_id');
    }

    public function tickets(): HasMany
    {
        return $this->hasMany(EventTicket::class)->orderBy('sort_order');
    }

    public function products(): HasMany
    {
        return $this->hasMany(EventProduct::class)->orderBy('sort_order');
    }

    public function registrations(): HasMany
    {
        return $this->hasMany(EventRegistration::class);
    }

    // --- Scopes ---

    public function scopeUpcoming(Builder $query): Builder
    {
        return $query->where('is_published', true)->where('start_at', '>', now())->orderBy('start_at');
    }

    public function scopePast(Builder $query): Builder
    {
        return $query->where('is_published', true)->where('start_at', '<=', now())->orderByDesc('start_at');
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('is_published', true);
    }

    // --- Computed status accessor ---

    public function getStatusAttribute(): string
    {
        if (!$this->is_published) return 'draft';
        return $this->start_at->gt(now()) ? 'upcoming' : 'past';
    }

    // --- RSVP helpers ---

    public function getRegistrationCountAttribute(): int
    {
        return $this->registrations()->active()->sum('quantity');
    }

    public function getIsRegistrationOpenAttribute(): bool
    {
        if (!$this->rsvp_enabled) return false;
        if ($this->rsvp_deadline && $this->rsvp_deadline->isPast()) return false;
        if ($this->max_attendees && $this->registration_count >= $this->max_attendees) return false;

        return true;
    }
}
