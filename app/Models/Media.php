<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Media extends Model
{
    protected $fillable = [
        'disk',
        'path',
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

    /**
     * Get the full URL for the media file.
     * Handles both relative paths (/storage/...) and old absolute URLs.
     */
    public function getUrlAttribute($value): string
    {
        // If it's already a full URL (starts with http), return as-is
        if (str_starts_with($value, 'http://') || str_starts_with($value, 'https://')) {
            // Convert old localhost URLs to relative paths
            if (str_contains($value, 'localhost')) {
                $path = parse_url($value, PHP_URL_PATH);
                return config('app.url') . $path;
            }
            return $value;
        }

        // If it's a relative path, prepend the APP_URL
        if (str_starts_with($value, '/')) {
            return config('app.url') . $value;
        }

        // Fallback: assume it's just the storage path
        return config('app.url') . '/storage/' . $value;
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
