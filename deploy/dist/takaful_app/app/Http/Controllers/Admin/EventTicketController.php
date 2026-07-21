<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreEventTicketRequest;
use App\Models\Event;
use App\Models\EventTicket;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EventTicketController extends Controller
{
    /**
     * Global view — all tickets with event selector.
     */
    public function all(): Response
    {
        $eventSlug = request('event', '');

        $events = Event::where('rsvp_enabled', true)
            ->orderBy('title')
            ->get(['id', 'title', 'slug']);

        $event = null;
        $tickets = collect();

        if ($eventSlug) {
            $event = Event::where('slug', $eventSlug)->first();
            if ($event) {
                $tickets = $event->tickets()
                    ->withCount(['registrations as sold_count' => function ($q) {
                        $q->whereNotIn('status', ['cancelled']);
                    }])
                    ->orderBy('sort_order')
                    ->get();
                $event->load('media');
            }
        }

        return Inertia::render('Admin/Tickets/Index', [
            'events'       => $events,
            'currentEvent' => $eventSlug,
            'event'        => $event,
            'tickets'      => $tickets,
        ]);
    }

    public function index(Event $event): Response
    {
        $tickets = $event->tickets()
            ->with('zone')
            ->withCount(['registrations as sold_count' => function ($q) {
                $q->whereNotIn('status', ['cancelled']);
            }])
            ->orderBy('sort_order')
            ->get();

        $zones = $event->zones()->orderBy('sort_order')->get();

        return Inertia::render('Admin/Events/Tickets', [
            'event'       => $event->load('media'),
            'tickets'     => $tickets,
            'zones'       => $zones,
            'venueMapMedia' => $event->venueMap,
        ]);
    }

    public function updateVenueMap(Request $request, Event $event): RedirectResponse
    {
        $data = $request->validate([
            'venue_map_media_id' => ['nullable', 'integer', 'exists:media,id'],
        ]);

        $event->update([
            'venue_map_media_id' => $data['venue_map_media_id'],
        ]);

        return redirect()->route('admin.events.tickets.index', $event)
            ->with('success', 'Venue / seating map updated.');
    }

    public function store(StoreEventTicketRequest $request, Event $event): RedirectResponse
    {
        $event->tickets()->create($request->validated());

        return redirect()->route('admin.events.tickets.index', $event)
            ->with('success', 'Ticket created successfully.');
    }

    public function update(StoreEventTicketRequest $request, Event $event, EventTicket $ticket): RedirectResponse
    {
        $oldName = $ticket->name;
        $ticket->update($request->validated());
        $newName = $ticket->fresh()->name;

        // When a ticket is renamed, update ticket_scope and options_override keys in registration fields
        if ($oldName !== $newName) {
            $fields  = $event->registration_fields ?? [];
            $updated = false;
            foreach ($fields as &$field) {
                // Sweep ticket_scope array
                if (!empty($field['ticket_scope']) && in_array($oldName, $field['ticket_scope'])) {
                    $field['ticket_scope'] = array_map(fn($n) => $n === $oldName ? $newName : $n, $field['ticket_scope']);
                    $updated = true;
                }
                // Sweep options_override keys
                if (!empty($field['options_override']) && array_key_exists($oldName, $field['options_override'])) {
                    $field['options_override'][$newName] = $field['options_override'][$oldName];
                    unset($field['options_override'][$oldName]);
                    $updated = true;
                }
            }
            unset($field);
            if ($updated) {
                $event->update(['registration_fields' => $fields]);
            }
        }

        return redirect()->route('admin.events.tickets.index', $event)
            ->with('success', 'Ticket updated successfully.');
    }

    public function destroy(Event $event, EventTicket $ticket): RedirectResponse
    {
        // Prevent deleting tickets that have registrations
        if ($ticket->registrations()->active()->exists()) {
            return redirect()->route('admin.events.tickets.index', $event)
                ->with('error', 'Cannot delete a ticket that has active registrations.');
        }

        $ticket->delete();

        return redirect()->route('admin.events.tickets.index', $event)
            ->with('success', 'Ticket deleted.');
    }
}
