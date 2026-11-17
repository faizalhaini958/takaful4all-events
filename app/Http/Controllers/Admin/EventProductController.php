<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreEventProductRequest;
use App\Models\Event;
use App\Models\EventProduct;
use App\Models\Media;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EventProductController extends Controller
{
    /**
     * Overview of add-on products across events. Products are created and edited on each
     * event's own page; old ?event=slug links are sent straight there.
     */
    public function all(Request $request): Response|RedirectResponse
    {
        if ($slug = $request->query('event')) {
            $event = Event::where('slug', $slug)->first();

            if ($event) {
                return redirect()->route('admin.events.products.index', $event);
            }
        }

        $events = Event::where('rsvp_enabled', true)
            ->with('products')
            ->orderByDesc('start_at')
            ->get()
            ->map(function (Event $event) {
                $products = $event->products;

                return [
                    'id'             => $event->id,
                    'title'          => $event->title,
                    'slug'           => $event->slug,
                    'start_at'       => $event->start_at?->toIso8601String(),
                    'products_count' => $products->count(),
                    'active_count'   => $products->where('is_active', true)->count(),
                    'currencies'     => $products->pluck('currency')->filter()->unique()->values(),
                ];
            });

        return Inertia::render('Admin/Products/Index', [
            'events' => $events,
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
