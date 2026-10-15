<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class AppSetting extends Model
{
    protected $fillable = [
        'key',
        'value',
        'group',
        'label',
        'description',
        'sort_order',
    ];

    const CACHE_ALL_FEATURES = 'app_settings_features';

    /**
     * Memeriksa apakah suatu fitur aktif
     */
    public static function isEnabled(string $key, bool $default = true): bool
    {
        $features = static::getFeatures();
        return $features[$key] ?? $default;
    }

    /**
     * Mengambil semua status fitur (cached)
     *
     * @return array<string, bool>
     */
    public static function getFeatures(): array
    {
        return Cache::rememberForever(static::CACHE_ALL_FEATURES, function () {
            try {
                return static::where('group', 'features')
                    ->pluck('value', 'key')
                    ->map(fn($val) => (bool) $val)
                    ->toArray();
            } catch (\Throwable $e) {
                return [];
            }
        });
    }

    /**
     * Mengatur status fitur
     */
    public static function setFeature(string $key, bool $enabled): void
    {
        static::updateOrCreate(
            ['key' => $key],
            [
                'value' => $enabled ? '1' : '0',
                'group' => 'features',
            ]
        );

        Cache::forget(static::CACHE_ALL_FEATURES);
    }

    /**
     * Clear cache otomatis saat ada perubahan model
     */
    protected static function booted(): void
    {
        static::saved(function () {
            Cache::forget(static::CACHE_ALL_FEATURES);
        });

        static::deleted(function () {
            Cache::forget(static::CACHE_ALL_FEATURES);
        });
    }
}
