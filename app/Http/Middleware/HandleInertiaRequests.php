<?php

namespace App\Http\Middleware;

use App\Models\Menu;
use Illuminate\Http\Request;
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
        ];
    }
}
