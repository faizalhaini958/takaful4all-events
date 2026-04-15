<?php

namespace App\Http\Controllers;

use App\Models\Banner;
use App\Models\Event;
use App\Models\Page;
use App\Models\Post;
use App\Models\Setting;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function index(): Response
    {
        $banners = Cache::remember('home.banners', 900, fn () =>
            Banner::active()->get()
        );

        $upcomingEvents = Cache::remember('home.upcoming', 900, fn () =>
            Event::upcoming()->with('media')->take(6)->get()
        );

        $pastEvents = Cache::remember('home.past', 900, fn () =>
            Event::past()->with('media')->take(12)->get()
        );

        $aboutPage = Cache::remember('home.about', 900, fn () =>
            Page::published()->where('slug', 'about')->first()
        );

        $podcasts = Cache::remember('home.podcasts', 900, fn () =>
            Post::published()->ofType('podcast')->latest('published_at')->take(6)->with('media')->get()
        );

        $webinars = Cache::remember('home.webinars', 900, fn () =>
            Post::published()->ofType('webinar')->latest('published_at')->take(6)->with('media')->get()
        );

        $agent360 = Cache::remember('home.agent360', 900, fn () =>
            Post::published()->ofType('agent360')->latest('published_at')->take(6)->with('media')->get()
        );

        $general = Setting::getCached('general');
        $slideshowEnabled = ($general['slideshow_enabled'] ?? '0') === '1';

        return Inertia::render('Public/Home', [
            'banners'          => $banners,
            'slideshowEnabled' => $slideshowEnabled,
            'upcomingEvents'   => $upcomingEvents,
            'pastEvents'       => $pastEvents,
            'aboutPage'        => $aboutPage,
            'podcasts'         => $podcasts,
            'webinars'         => $webinars,
            'agent360'         => $agent360,
        ]);
    }
}
