<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Inertia\Inertia;
use Inertia\Response;

class EventController extends Controller
{
    public function index(): Response
    {
        $status = request('status', 'all');

        $query = Event::with('media')
            ->where('is_published', true)
            ->orderByDesc('start_at');

        if (in_array($status, ['upcoming', 'past'])) {
            if ($status === 'upcoming') {
                $query->where('start_at', '>', now());
            } else {
                $query->where('start_at', '<=', now());
            }
        }

        $events = $query->paginate(12)->withQueryString();

        return Inertia::render('Public/Events/Index', [
            'events'        => $events,
            'currentStatus' => $status,
        ]);
    }

    public function show(string $slug): Response
    {
        $event = Event::where('slug', $slug)
            ->with('media')
            ->firstOrFail();

        // Append RSVP computed attributes for the frontend
        $event->append(['registration_count', 'is_registration_open']);

        $related = Event::where('id', '!=', $event->id)
            ->where('is_published', true)
            ->with('media')
            ->take(3)
            ->get();

        return Inertia::render('Public/Events/Show', [
            'event'   => $event,
            'related' => $related,
        ]);
    }
}
