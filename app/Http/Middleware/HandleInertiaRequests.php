<?php

namespace App\Http\Middleware;

use App\Models\Menu;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $locale = app()->getLocale();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error'   => fn () => $request->session()->get('error'),
            ],
            'menus' => fn () => Menu::with(['items' => fn ($q) => $q->orderBy('sort')])
                ->get()
                ->keyBy('slug')
                ->map(fn ($menu) => $menu->items),
            'locale'           => $locale,
            'availableLocales' => [
                ['code' => 'en', 'name' => 'English'],
                ['code' => 'ms', 'name' => 'Bahasa Melayu'],
            ],
            'translations' => fn () => $this->getTranslations($locale),
        ];
    }

    private function getTranslations(string $locale): array
    {
        $path = lang_path("{$locale}.json");

        if (File::exists($path)) {
            return json_decode(File::get($path), true) ?? [];
        }

        return [];
    }
}
