<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreEventProductRequest;
use App\Models\Event;
use App\Models\EventProduct;
use App\Models\Media;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class EventProductController extends Controller
{
    /**
     * Global view — all products with event selector.
     */
    public function all(): Response
    {
        $eventSlug = request('event', '');

        $events = Event::where('rsvp_enabled', true)
            ->orderBy('title')
            ->get(['id', 'title', 'slug']);

        $event = null;
        $products = collect();

        if ($eventSlug) {
            $event = Event::where('slug', $eventSlug)->first();
            if ($event) {
                $products = $event->products()
                    ->with('media')
                    ->orderBy('sort_order')
                    ->get();
                $event->load('media');
            }
        }

        return Inertia::render('Admin/Products/Index', [
            'events'       => $events,
            'currentEvent' => $eventSlug,
            'event'        => $event,
            'products'     => $products,
            'mediaList'    => Media::latest()->get(['id', 'url', 'title']),
        ]);
    }

    public function index(Event $event): Response
    {
        $products = $event->products()
            ->with('media')
            ->orderBy('sort_order')
            ->get();

        return Inertia::render('Admin/Events/Products', [
            'event'     => $event->load('media'),
            'products'  => $products,
            'mediaList' => Media::latest()->get(['id', 'url', 'title']),
        ]);
    }

    public function store(StoreEventProductRequest $request, Event $event): RedirectResponse
    {
        $event->products()->create($request->validated());

        return redirect()->route('admin.events.products.index', $event)
            ->with('success', 'Product created successfully.');
    }

    public function update(StoreEventProductRequest $request, Event $event, EventProduct $product): RedirectResponse
    {
        $product->update($request->validated());

        return redirect()->route('admin.events.products.index', $event)
            ->with('success', 'Product updated successfully.');
    }

    public function destroy(Event $event, EventProduct $product): RedirectResponse
    {
        $product->delete();

        return redirect()->route('admin.events.products.index', $event)
            ->with('success', 'Product deleted.');
    }
}
