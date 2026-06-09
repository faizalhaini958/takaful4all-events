<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class ContentBanner extends Model
{
    protected $fillable = [
        'title',
        'subtitle',
        'image_path',
        'button_text',
        'button_link',
        'is_active',
        'sort_order',
        'start_date',
        'end_date',
        'created_by',
    ];

    protected $casts = [
        'is_active'  => 'boolean',
        'sort_order' => 'integer',
        'start_date' => 'datetime',
        'end_date'   => 'datetime',
    ];

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true)->orderBy('sort_order');
    }

    public function scopePublished(Builder $query): Builder
    {
        $now = now();

        return $query
            ->where('is_active', true)
            ->where(function (Builder $q) use ($now) {
                $q->whereNull('start_date')
                    ->orWhere('start_date', '<=', $now);
            })
            ->where(function (Builder $q) use ($now) {
                $q->whereNull('end_date')
                    ->orWhere('end_date', '>=', $now);
            })
            ->orderBy('sort_order');
    }

    public function getImageUrlAttribute(): string
    {
        if (str_starts_with($this->image_path, 'http')) {
            return parse_url($this->image_path, PHP_URL_PATH) ?: $this->image_path;
        }

        return '/storage/' . $this->image_path;
    }

    public function getMobileImageUrlAttribute(): ?string
    {
        return null;
    }

    public function getLinkUrlAttribute(): ?string
    {
        return $this->button_link;
    }

    protected $appends = ['image_url', 'mobile_image_url', 'link_url'];
}
