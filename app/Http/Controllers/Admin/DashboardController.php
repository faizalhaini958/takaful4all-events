<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventRegistration;
use App\Models\Media;
use App\Models\Page;
use App\Models\Post;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response|\Illuminate\Http\RedirectResponse
    {
        if (request()->user()?->isCheckinStaff()) {
            return redirect()->route('admin.events.index');
        }

        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'events' => [
                    'total'    => Event::count(),
                    'upcoming' => Event::where('is_published', true)->where('start_at', '>', now())->count(),
                    'past'     => Event::where('is_published', true)->where('start_at', '<=', now())->count(),
                    'draft'    => Event::where('is_published', false)->count(),
                ],
                'registrations' => [
                    'total'     => EventRegistration::count(),
                    'confirmed' => EventRegistration::where('status', 'confirmed')->count(),
                    'pending'   => EventRegistration::where('status', 'pending')->count(),
                    'revenue'   => EventRegistration::whereNotIn('status', ['cancelled'])->sum('total_amount'),
                ],
                'posts' => [
                    'total'   => Post::count(),
                    'podcast' => Post::where('type', 'podcast')->count(),
                    'webinar' => Post::where('type', 'webinar')->count(),
                    'article' => Post::where('type', 'article')->count(),
                ],
                'pages' => Page::count(),
                'media' => Media::count(),
            ],
            'recentEvents' => Event::with('media')
                ->withCount('registrations')
                ->latest()
                ->take(5)
                ->get(),
        ]);
    }
}
