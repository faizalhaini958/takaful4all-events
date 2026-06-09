<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\RegistrationConfirmationMail;
use App\Models\CheckInLog;
use App\Models\Event;
use App\Models\EventProduct;
use App\Models\EventRegistration;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
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

        $query = EventRegistration::with(['event.media', 'ticket', 'products.product', 'attendees', 'invoice'])
            ->latest();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('reference_no', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhereHas('attendees', function ($aq) use ($search) {
                      $aq->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        if (in_array($status, ['pending', 'awaiting_payment', 'confirmed', 'cancelled', 'waitlisted', 'attended'])) {
            $query->where('status', $status);
        }

        if ($eventSlug) {
            $query->whereHas('event', fn ($q) => $q->where('slug', $eventSlug));
        }

        $registrations = $query->paginate(20)->withQueryString();

        // Summary stats
        $stats = [
            'total'             => EventRegistration::count(),
            'confirmed'         => EventRegistration::where('status', 'confirmed')->count(),
            'pending'           => EventRegistration::where('status', 'pending')->count(),
            'awaiting_payment'  => EventRegistration::where('status', 'awaiting_payment')->count(),
            'attended'          => EventRegistration::where('status', 'attended')->count(),
            'cancelled'         => EventRegistration::where('status', 'cancelled')->count(),
            'waitlisted'        => EventRegistration::where('status', 'waitlisted')->count(),
            'revenue'           => EventRegistration::where('payment_status', 'paid')->sum('total_amount'),
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
            ->with(['ticket', 'products.product', 'attendees', 'invoice'])
            ->latest();

        if (in_array($status, ['pending', 'awaiting_payment', 'confirmed', 'cancelled', 'waitlisted', 'attended'])) {
            $query->where('status', $status);
        }

        $registrations = $query->paginate(20)->withQueryString();

        // Summary stats
        $stats = [
            'total'             => $event->registrations()->count(),
            'confirmed'         => $event->registrations()->where('status', 'confirmed')->count(),
            'pending'           => $event->registrations()->where('status', 'pending')->count(),
            'awaiting_payment'  => $event->registrations()->where('status', 'awaiting_payment')->count(),
            'attended'          => $event->registrations()->where('status', 'attended')->count(),
            'cancelled'         => $event->registrations()->where('status', 'cancelled')->count(),
            'waitlisted'        => $event->registrations()->where('status', 'waitlisted')->count(),
            'revenue'           => $event->registrations()->whereNotIn('status', ['cancelled'])->sum('total_amount'),
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
        $registration->load(['ticket', 'products.product.media', 'event', 'attendees', 'invoice']);

        return Inertia::render('Admin/Events/Registrations/Show', [
            'event'        => $event->load('media'),
            'registration' => $registration,
        ]);
    }

    public function updateStatus(Request $request, Event $event, EventRegistration $registration): RedirectResponse
    {
        $request->validate([
            'status' => 'required|in:pending,awaiting_payment,confirmed,cancelled,waitlisted,attended',
        ]);

        $update = ['status' => $request->status];

        // Auto-set check-in time when marking as attended
        if ($request->status === 'attended' && !$registration->checked_in_at) {
            $update['checked_in_at'] = now();
        }

        $registration->update($update);

        if ($request->status === 'attended') {
            CheckInLog::create([
                'event_id'        => $event->id,
                'registration_id' => $registration->id,
                'user_id'         => Auth::id(),
                'action'          => 'checked_in',
                'performed_at'    => now(),
                'meta_json'       => [
                    'attendee_name' => $registration->name,
                    'method'        => 'status_update',
                ],
            ]);
        }

        // Bug 4 fix: restore product stock when admin manually cancels a registration
        if ($request->status === 'cancelled') {
            $registration->loadMissing('products');
            foreach ($registration->products as $item) {
                EventProduct::where('id', $item->product_id)
                    ->whereNotNull('stock')
                    ->increment('stock', $item->quantity);
            }
        }

        return redirect()->back()->with('success', 'Registration status updated.');
    }

    public function updatePaymentStatus(Request $request, Event $event, EventRegistration $registration): RedirectResponse
    {
        $request->validate([
            'payment_status' => 'required|in:pending,paid,na,refunded',
        ]);

        $registration->update(['payment_status' => $request->payment_status]);

        return redirect()->back()->with('success', 'Payment status updated.');
    }

    public function checkIn(Event $event, EventRegistration $registration): RedirectResponse
    {
        $registration->markAsCheckedIn();

        CheckInLog::create([
            'event_id'        => $event->id,
            'registration_id' => $registration->id,
            'user_id'         => Auth::id(),
            'action'          => 'checked_in',
            'performed_at'    => now(),
            'meta_json'       => [
                'attendee_name' => $registration->name,
                'method'        => 'admin_panel',
            ],
        ]);

        return redirect()->back()->with('success', "{$registration->name} checked in successfully.");
    }

    public function bulkUpdateStatus(Request $request, Event $event): RedirectResponse
    {
        $request->validate([
            'ids'    => 'required|array|min:1',
            'ids.*'  => 'exists:event_registrations,id',
            'status' => 'required|in:pending,awaiting_payment,confirmed,cancelled,waitlisted,attended',
        ]);

        $update = ['status' => $request->status];

        // Bug 3 fix: set checked_in_at when bulk-marking as attended
        if ($request->status === 'attended') {
            $update['checked_in_at'] = now();

            $registrations = EventRegistration::whereIn('id', $request->ids)
                ->where('event_id', $event->id)
                ->get();

            $logs = $registrations->map(fn ($r) => [
                'event_id'        => $event->id,
                'registration_id' => $r->id,
                'user_id'         => Auth::id(),
                'action'          => 'checked_in',
                'performed_at'    => now(),
                'meta_json'       => json_encode([
                    'attendee_name' => $r->name,
                    'method'        => 'bulk_status_update',
                ]),
                'created_at'      => now(),
                'updated_at'      => now(),
            ])->toArray();

            CheckInLog::insert($logs);
        }

        EventRegistration::whereIn('id', $request->ids)
            ->where('event_id', $event->id)
            ->update($update);

        // Bug 4 fix: restore product stock for all bulk-cancelled registrations
        if ($request->status === 'cancelled') {
            $registrations = EventRegistration::with('products')
                ->whereIn('id', $request->ids)
                ->where('event_id', $event->id)
                ->get();

            foreach ($registrations as $reg) {
                foreach ($reg->products as $item) {
                    EventProduct::where('id', $item->product_id)
                        ->whereNotNull('stock')
                        ->increment('stock', $item->quantity);
                }
            }
        }

        return redirect()->back()->with('success', count($request->ids) . ' registration(s) updated.');
    }

    public function bulkDestroy(Request $request, Event $event): RedirectResponse
    {
        $request->validate([
            'ids'   => 'required|array|min:1',
            'ids.*' => 'exists:event_registrations,id',
        ]);

        EventRegistration::whereIn('id', $request->ids)
            ->where('event_id', $event->id)
            ->delete();

        return redirect()->back()->with('success', count($request->ids) . ' registration(s) deleted.');
    }

    public function destroy(Event $event, EventRegistration $registration): RedirectResponse
    {
        $registration->delete();

        return redirect()->route('admin.events.registrations.index', $event)
            ->with('success', 'Registration deleted.');
    }

    public function resendConfirmation(Event $event, EventRegistration $registration): RedirectResponse
    {
        try {
            Mail::to($registration->email)
                ->queue(new RegistrationConfirmationMail($registration));

            $registration->updateQuietly(['confirmation_email_sent_at' => now()]);

            return back()->with('success', "Confirmation email queued for {$registration->email}.");
        } catch (\Throwable $e) {
            return back()->with('error', 'Failed to queue email: ' . $e->getMessage());
        }
    }
}
