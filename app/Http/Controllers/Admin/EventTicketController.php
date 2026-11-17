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
     * Overview of ticket sales across events. Tickets are created and edited on each
     * event's own page; old ?event=slug links are sent straight there.
     */
    public function all(Request $request): Response|RedirectResponse
    {
        if ($slug = $request->query('event')) {
            $event = Event::where('slug', $slug)->first();

            if ($event) {
                return redirect()->route('admin.events.tickets.index', $event);
            }
        }

        $events = Event::where('rsvp_enabled', true)
            ->with(['tickets' => function ($q) {
                $q->withCount(['registrations as sold_count' => function ($q) {
                    $q->whereNotIn('status', ['cancelled']);
                }]);
            }])
            ->orderByDesc('start_at')
            ->get()
            ->map(function (Event $event) {
                $tickets = $event->tickets;

                return [
                    'id'            => $event->id,
                    'title'         => $event->title,
                    'slug'          => $event->slug,
                    'start_at'      => $event->start_at?->toIso8601String(),
                    'status'        => $event->status,
                    'tickets_count' => $tickets->count(),
                    'on_sale_count' => $tickets->filter(fn (EventTicket $t) => $t->is_on_sale)->count(),
                    'sold'          => (int) $tickets->sum('sold_count'),
                    // null means at least one ticket has no cap
                    'capacity'      => $tickets->contains(fn (EventTicket $t) => $t->quantity === null)
                        ? null
                        : (int) $tickets->sum('quantity'),
                    'currencies'    => $tickets->pluck('currency')->filter()->unique()->values(),
                ];
            });

        return Inertia::render('Admin/Tickets/Index', [
            'events' => $events,
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
