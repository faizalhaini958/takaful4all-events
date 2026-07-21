<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;

class Setting extends Model
{
    protected $fillable = ['group', 'key', 'value', 'is_encrypted'];

    protected $casts = [
        'is_encrypted' => 'boolean',
    ];

    // ─── Accessors ────────────────────────────────────────────────────────────

    public function getDecryptedValueAttribute(): ?string
    {
        if ($this->is_encrypted && $this->value) {
            try {
                return Crypt::decryptString($this->value);
            } catch (\Throwable) {
                return null;
            }
        }
        return $this->value;
    }

    // ─── Static Helpers ───────────────────────────────────────────────────────

    /**
     * Get a single setting value.
     */
    public static function get(string $group, string $key, mixed $default = null): mixed
    {
        $setting = static::where('group', $group)->where('key', $key)->first();

        if (! $setting) {
            return $default;
        }

        return $setting->is_encrypted ? $setting->decrypted_value : $setting->value;
    }

    /**
     * Get all settings for a group as key => value array.
     */
    public static function getGroup(string $group): array
    {
        return static::where('group', $group)
            ->get()
            ->mapWithKeys(function (Setting $setting) {
                $value = $setting->is_encrypted ? $setting->decrypted_value : $setting->value;
                return [$setting->key => $value];
            })
            ->toArray();
    }

    /**
     * Set a single setting.
     */
    public static function set(string $group, string $key, ?string $value, bool $encrypt = false): void
    {
        static::updateOrCreate(
            ['group' => $group, 'key' => $key],
            [
                'value'        => $encrypt && $value ? Crypt::encryptString($value) : $value,
                'is_encrypted' => $encrypt,
            ]
        );

        Cache::forget("settings.{$group}");
    }

    /**
     * Bulk-set settings for a group.
     */
    public static function setGroup(string $group, array $values, array $encryptedKeys = []): void
    {
        foreach ($values as $key => $value) {
            $encrypt = in_array($key, $encryptedKeys);
            static::set($group, $key, $value, $encrypt);
        }
    }

    /**
     * Get all settings for a group, with caching.
     */
    public static function getCached(string $group): array
    {
        return Cache::remember("settings.{$group}", 3600, function () use ($group) {
            return static::getGroup($group);
        });
    }
}
