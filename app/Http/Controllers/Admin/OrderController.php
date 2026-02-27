<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventProduct;
use App\Models\EventRegistrationProduct;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function index(): Response
    {
        $search = request('search', '');
        $eventSlug = request('event', '');
        $productId = request('product', '');

        $query = EventRegistrationProduct::with([
            'registration.event',
            'registration.ticket',
            'product.media',
        ])
            ->whereHas('registration', fn ($q) => $q->whereNotIn('status', ['cancelled']))
            ->latest();

        if ($search) {
            $query->whereHas('registration', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('reference_no', 'like', "%{$search}%");
            });
        }

        if ($eventSlug) {
            $query->whereHas('registration.event', fn ($q) => $q->where('slug', $eventSlug));
        }

        if ($productId) {
            $query->where('product_id', $productId);
        }

        $orders = $query->paginate(20)->withQueryString();

        // Stats
        $statsQuery = EventRegistrationProduct::whereHas('registration', fn ($q) => $q->whereNotIn('status', ['cancelled']));

        $stats = [
            'total_orders'    => $statsQuery->count(),
            'total_items'     => (clone $statsQuery)->sum('quantity'),
            'total_revenue'   => (clone $statsQuery)->selectRaw('SUM(quantity * unit_price) as total')->value('total') ?? 0,
        ];

        // Filters data
        $events = Event::where('rsvp_enabled', true)
            ->whereHas('products')
            ->orderBy('title')
            ->get(['id', 'title', 'slug']);

        $products = EventProduct::orderBy('name')->get(['id', 'name', 'event_id']);

        if ($eventSlug) {
            $eventModel = Event::where('slug', $eventSlug)->first();
            if ($eventModel) {
                $products = EventProduct::where('event_id', $eventModel->id)->orderBy('name')->get(['id', 'name', 'event_id']);
            }
        }

        return Inertia::render('Admin/Orders/Index', [
            'orders'         => $orders,
            'stats'          => $stats,
            'events'         => $events,
            'products'       => $products,
            'currentSearch'  => $search,
            'currentEvent'   => $eventSlug,
            'currentProduct' => $productId,
        ]);
    }
}
