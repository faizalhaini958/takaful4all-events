<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreEventRequest;
use App\Http\Requests\UpdateEventRequest;
use App\Models\Event;
use App\Models\Media;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class EventController extends Controller
{
    public function index(): Response
    {
        $perPage = (int) request()->input('per_page', 15);
        $perPage = in_array($perPage, [10, 15, 25, 50]) ? $perPage : 15;

        $query = Event::with('media')
            ->withCount(['registrations', 'tickets', 'products', 'zones']);

        // Check-in staff can only see upcoming & current (non-past) published events
        if (request()->user()?->isCheckinStaff()) {
            $query->where('is_published', true)
                  ->where(function ($q) {
                      $q->where('start_at', '>', now())                // upcoming
                        ->orWhere(function ($q2) {                     // currently running
                            $q2->where('start_at', '<=', now())
                               ->where('end_at', '>=', now());
                        })
                        ->orWhere(function ($q2) {                     // started today, no end date
                            $q2->where('start_at', '<=', now())
                               ->whereNull('end_at')
                               ->whereDate('start_at', now()->toDateString());
                        });
                  });
        }

        $events = $query->latest()
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('Admin/Events/Index', [
            'events' => $events,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Events/Create', [
            'mediaList' => Media::latest()->get(['id', 'url', 'title']),
        ]);
    }

    public function store(StoreEventRequest $request): RedirectResponse
    {
        $event = Event::create($request->validated());
        Cache::forget('home.upcoming');
        Cache::forget('home.past');

        return redirect()->route('admin.events.edit', $event)
            ->with('success', 'Event created successfully.');
    }

    public function edit(Event $event): Response
    {
        return Inertia::render('Admin/Events/Edit', [
            'event'         => $event->load('media'),
            'mediaList'     => Media::latest()->get(['id', 'url', 'title']),
        ]);
    }

    public function update(UpdateEventRequest $request, Event $event): RedirectResponse
    {
        $event->update($request->validated());
        Cache::forget('home.upcoming');
        Cache::forget('home.past');

        return redirect()->route('admin.events.edit', $event)
            ->with('success', 'Event saved successfully.');
    }

    public function duplicate(Event $event): RedirectResponse
    {
        $newEvent = $event->replicate(['slug']);
        $newEvent->title        = 'Copy of ' . $event->title;
        $newEvent->is_published = false;
        $newEvent->save(); // HasSlug auto-generates slug from new title

        return redirect()->route('admin.events.edit', $newEvent)
            ->with('success', 'Event duplicated. You are now editing the copy.');
    }

    public function destroy(Event $event): RedirectResponse
    {
        $event->delete();
        Cache::forget('home.upcoming');
        Cache::forget('home.past');

        return redirect()->route('admin.events.index')
            ->with('success', 'Event deleted.');
    }
}
