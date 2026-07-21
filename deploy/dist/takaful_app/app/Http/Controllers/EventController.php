<?php

namespace App\Http\Controllers;

use App\Models\Banner;
use App\Models\Event;
use Inertia\Inertia;
use Inertia\Response;

class EventController extends Controller
{
    private const VALID_CATEGORIES = [
        'conference', 'workshop', 'sports', 'exhibition',
        'entertainment', 'dinner',
    ];

    private const CATEGORY_LABELS = [
        'conference'    => 'Takaful Conferences',
        'workshop'      => 'Takaful Workshops',
        'sports'        => 'Takaful Sports Events',
        'exhibition'    => 'Takaful Exhibitions',
        'entertainment' => 'Takaful Entertainment Events',
        'dinner'        => 'Takaful Dinners',
    ];

    public function index(): Response
    {
        $status   = request('status', 'all');
        $category = request('category');

        $query = Event::with(['media', 'mobileMedia'])
            ->where('is_published', true)
            ->orderByDesc('start_at');

        if (in_array($status, ['upcoming', 'past'])) {
            if ($status === 'upcoming') {
                $query->where('start_at', '>', now());
            } else {
                $query->where('start_at', '<=', now());
            }
        }

        if (in_array($category, self::VALID_CATEGORIES, true)) {
            $query->where('event_category', $category);
        } else {
            $category = null;
        }

        $events = $query->paginate(12)->withQueryString();

        $banners = Banner::active()->get();

        return Inertia::render('Public/Events/Index', [
            'events'          => $events,
            'currentStatus'   => $status,
            'currentCategory' => $category,
            'banners'         => $banners,
            'canonicalUrl'    => $this->buildCanonicalUrl($status, $category),
            'metaTitle'       => $this->buildMetaTitle($status, $category),
            'metaDescription' => $this->buildMetaDescription($status, $category),
        ]);
    }

    private function buildCanonicalUrl(string $status, ?string $category): string
    {
        $params = [];

        if ($status !== 'all') {
            $params['status'] = $status;
        }

        if ($category) {
            $params['category'] = $category;
        }

        if (empty($params)) {
            return route('events.index');
        }

        return route('events.index') . '?' . http_build_query($params);
    }

    private function buildMetaTitle(string $status, ?string $category): string
    {
        if ($category && isset(self::CATEGORY_LABELS[$category])) {
            return self::CATEGORY_LABELS[$category] . ' | Events by MTA';
        }

        if ($status === 'upcoming') {
            return 'Upcoming Takaful Events | MTA';
        }

        if ($status === 'past') {
            return 'Past Takaful Events | MTA';
        }

        return 'Events | Takaful4All Events';
    }

    private function buildMetaDescription(string $status, ?string $category): string
    {
        $categoryLabels = [
            'conference'    => 'conference',
            'workshop'      => 'workshop',
            'sports'        => 'sports',
            'exhibition'    => 'exhibition',
            'entertainment' => 'entertainment',
            'dinner'        => 'dinner',
        ];

        if ($category && isset($categoryLabels[$category])) {
            $prefix = $status === 'upcoming' ? 'Browse upcoming ' : 'Browse ';

            return $prefix . $categoryLabels[$category] . ' events from the Malaysian Takaful Association.';
        }

        if ($status === 'upcoming') {
            return 'Browse upcoming takaful events from the Malaysian Takaful Association.';
        }

        if ($status === 'past') {
            return 'Browse past takaful events from the Malaysian Takaful Association.';
        }

        return 'Browse all upcoming and past events by Takaful4All — conferences, webinars, workshops and more.';
    }

    public function show(string $slug): Response
    {
        $event = Event::where('slug', $slug)
            ->where('is_published', true)
            ->with(['media', 'mobileMedia', 'venueMap', 'zones', 'tickets.zone'])
            ->firstOrFail();

        // Append RSVP computed attributes for the frontend
        $event->append(['registration_count', 'is_registration_open']);

        $related = Event::where('id', '!=', $event->id)
            ->where('is_published', true)
            ->where('start_at', '>=', now())
            ->orderBy('start_at', 'asc')
            ->with('media')
            ->take(9)
            ->get();

        return Inertia::render('Public/Events/Show', [
            'event'   => $event,
            'related' => $related,
            'ogUrl'   => route('events.show', $slug),
        ])->withViewData('heroImage', $event->media?->url);
    }
}
