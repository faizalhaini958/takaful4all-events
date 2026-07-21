<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class Banner extends Model
{
    protected $fillable = [
        'title',
        'image_path',
        'mobile_image_path',
        'link_url',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'sort_order' => 'integer',
        'is_active'  => 'boolean',
    ];

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true)->orderBy('sort_order');
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
        if (! $this->mobile_image_path) {
            return null;
        }

        if (str_starts_with($this->mobile_image_path, 'http')) {
            return parse_url($this->mobile_image_path, PHP_URL_PATH) ?: $this->mobile_image_path;
        }

        return '/storage/' . $this->mobile_image_path;
    }

    protected $appends = ['image_url', 'mobile_image_url'];
}
