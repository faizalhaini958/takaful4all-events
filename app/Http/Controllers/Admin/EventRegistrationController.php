<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventRegistration;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EventRegistrationController extends Controller
{
    /**
     * Global view — all registrations across all events.
     */
    public function all(): Response
    {
        $search = request('search', '');
        $status = request('status', 'all');
        $eventSlug = request('event', '');

        $query = EventRegistration::with(['event.media', 'ticket'])
            ->latest();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('reference_no', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if (in_array($status, ['pending', 'confirmed', 'cancelled', 'waitlisted', 'attended'])) {
            $query->where('status', $status);
        }

        if ($eventSlug) {
            $query->whereHas('event', fn ($q) => $q->where('slug', $eventSlug));
        }

        $registrations = $query->paginate(20)->withQueryString();

        // Summary stats
        $stats = [
            'total'      => EventRegistration::count(),
            'confirmed'  => EventRegistration::where('status', 'confirmed')->count(),
            'pending'    => EventRegistration::where('status', 'pending')->count(),
            'attended'   => EventRegistration::where('status', 'attended')->count(),
            'cancelled'  => EventRegistration::where('status', 'cancelled')->count(),
            'waitlisted' => EventRegistration::where('status', 'waitlisted')->count(),
            'revenue'    => EventRegistration::whereNotIn('status', ['cancelled'])->sum('total_amount'),
        ];

        // Events dropdown filter
        $events = Event::where('rsvp_enabled', true)
            ->orderBy('title')
            ->get(['id', 'title', 'slug']);

        return Inertia::render('Admin/Registrations/Index', [
            'registrations'  => $registrations,
            'stats'          => $stats,
            'events'         => $events,
            'currentStatus'  => $status,
            'currentSearch'  => $search,
            'currentEvent'   => $eventSlug,
        ]);
    }

    public function index(Event $event): Response
    {
        $status = request('status', 'all');

        $query = $event->registrations()
            ->with(['ticket', 'products.product'])
            ->latest();

        if (in_array($status, ['pending', 'confirmed', 'cancelled', 'waitlisted', 'attended'])) {
            $query->where('status', $status);
        }

        $registrations = $query->paginate(20)->withQueryString();

        // Summary stats
        $stats = [
            'total'      => $event->registrations()->count(),
            'confirmed'  => $event->registrations()->where('status', 'confirmed')->count(),
            'pending'    => $event->registrations()->where('status', 'pending')->count(),
            'attended'   => $event->registrations()->where('status', 'attended')->count(),
            'cancelled'  => $event->registrations()->where('status', 'cancelled')->count(),
            'waitlisted' => $event->registrations()->where('status', 'waitlisted')->count(),
            'revenue'    => $event->registrations()->whereNotIn('status', ['cancelled'])->sum('total_amount'),
        ];

        return Inertia::render('Admin/Events/Registrations/Index', [
            'event'          => $event->load('media'),
            'registrations'  => $registrations,
            'stats'          => $stats,
            'currentStatus'  => $status,
        ]);
    }

    public function show(Event $event, EventRegistration $registration): Response
    {
        $registration->load(['ticket', 'products.product.media', 'event']);

        return Inertia::render('Admin/Events/Registrations/Show', [
            'event'        => $event->load('media'),
            'registration' => $registration,
        ]);
    }

    public function updateStatus(Request $request, Event $event, EventRegistration $registration): RedirectResponse
    {
        $request->validate([
            'status' => 'required|in:pending,confirmed,cancelled,waitlisted,attended',
        ]);

        $update = ['status' => $request->status];

        // Auto-set check-in time when marking as attended
        if ($request->status === 'attended' && !$registration->checked_in_at) {
            $update['checked_in_at'] = now();
        }

        $registration->update($update);

        return redirect()->back()->with('success', 'Registration status updated.');
    }

    public function checkIn(Event $event, EventRegistration $registration): RedirectResponse
    {
        $registration->markAsCheckedIn();

        return redirect()->back()->with('success', "{$registration->name} checked in successfully.");
    }

    public function bulkUpdateStatus(Request $request, Event $event): RedirectResponse
    {
        $request->validate([
            'ids'    => 'required|array|min:1',
            'ids.*'  => 'exists:event_registrations,id',
            'status' => 'required|in:pending,confirmed,cancelled,waitlisted,attended',
        ]);

        EventRegistration::whereIn('id', $request->ids)
            ->where('event_id', $event->id)
            ->update(['status' => $request->status]);

        return redirect()->back()->with('success', count($request->ids) . ' registration(s) updated.');
    }

    public function destroy(Event $event, EventRegistration $registration): RedirectResponse
    {
        $registration->delete();

        return redirect()->route('admin.events.registrations.index', $event)
            ->with('success', 'Registration deleted.');
    }
}
