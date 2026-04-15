<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Media extends Model
{
    protected $fillable = [
        'disk',
        'path',
        'thumbnail_path',
        'url',
        'alt',
        'title',
        'mime',
        'size',
        'width',
        'height',
    ];

    protected $casts = [
        'size'   => 'integer',
        'width'  => 'integer',
        'height' => 'integer',
    ];

    protected $appends = ['thumbnail_url'];

    /**
     * Get the URL for the media file.
     * Returns relative paths so the app works on any domain.
     */
    public function getUrlAttribute($value): string
    {
        // If it's already a full URL, extract just the path
        if (str_starts_with($value, 'http://') || str_starts_with($value, 'https://')) {
            return parse_url($value, PHP_URL_PATH) ?: $value;
        }

        // If it's a relative path starting with /, return as-is
        if (str_starts_with($value, '/')) {
            return $value;
        }

        // Fallback: assume it's just the storage path
        return '/storage/' . $value;
    }

    public function getThumbnailUrlAttribute(): ?string
    {
        if (!$this->thumbnail_path) {
            return null;
        }

        return '/storage/' . $this->thumbnail_path;
    }

    public function events(): HasMany
    {
        return $this->hasMany(Event::class, 'featured_image_id');
    }

    public function posts(): HasMany
    {
        return $this->hasMany(Post::class, 'featured_image_id');
    }
}
