<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SendNotificationBroadcastRequest;
use App\Models\Event;
use App\Models\EventRegistration;
use App\Models\NotificationBroadcast;
use App\Models\User;
use App\Notifications\AdminBroadcastNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class NotificationBroadcastController extends Controller
{
    public function create(): Response
    {
        $roles = [
            ['value' => 'admin', 'label' => 'Admin'],
            ['value' => 'checkin_staff', 'label' => 'Check-in Staff'],
            ['value' => 'public', 'label' => 'Public'],
        ];

        $events = Event::where('rsvp_enabled', true)
            ->orderBy('title')
            ->get(['id', 'title', 'slug'])
            ->map(function (Event $event) {
                $event->registrants_count = EventRegistration::where('event_id', $event->id)
                    ->whereIn('status', ['confirmed', 'attended'])
                    ->distinct()
                    ->count('email');

                return $event;
            });

        $stats = [
            'total_users'            => User::count(),
            'total_admin'            => User::where('role', 'admin')->count(),
            'total_checkin_staff'    => User::where('role', 'checkin_staff')->count(),
            'total_public'           => User::where('role', 'public')->count(),
            'total_event_registrants' => EventRegistration::whereIn('status', ['confirmed', 'attended'])
                ->distinct()
                ->count('email'),
        ];

        return Inertia::render('Admin/Notify', [
            'events' => $events,
            'roles'  => $roles,
            'stats'  => $stats,
        ]);
    }

    public function store(SendNotificationBroadcastRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $recipients = $this->resolveRecipients($validated);

        if ($recipients->isEmpty()) {
            return back()->with('error', 'No matching users found to send the notification to.');
        }

        $notification = new AdminBroadcastNotification(
            title: $validated['title'],
            body: $validated['body'],
            actionUrl: $validated['action_url'] ?? '',
        );

        $recipients->each(function ($user) use ($notification) {
            $user->notify($notification);
        });

        NotificationBroadcast::create([
            'user_id'         => Auth::id(),
            'title'           => $validated['title'],
            'body'            => $validated['body'],
            'action_url'      => $validated['action_url'] ?? null,
            'recipient_type'  => $validated['recipient_type'],
            'recipient_label' => $this->recipientLabel($validated),
            'recipient_count' => $recipients->count(),
        ]);

        return redirect()
            ->route('admin.notify.create')
            ->with('success', "Notification sent to {$recipients->count()} user(s).");
    }

    public function index(): JsonResponse
    {
        $broadcasts = NotificationBroadcast::with('user:id,name')
            ->latest()
            ->paginate(20);

        return response()->json($broadcasts);
    }

    public function show(int $id): JsonResponse
    {
        $broadcast = NotificationBroadcast::with('user:id,name')->findOrFail($id);

        return response()->json($broadcast);
    }

    public function search(Request $request): JsonResponse
    {
        $eventId = $request->input('event_id');

        if ($eventId) {
            return $this->searchEventRegistrants($request);
        }

        $query = User::query()
            ->select('id', 'name', 'email', 'role')
            ->orderBy('name');

        if ($request->filled('q')) {
            $term = $request->input('q');
            $query->where(function ($q) use ($term) {
                $q->where('name', 'like', "%{$term}%")
                  ->orWhere('email', 'like', "%{$term}%");
            });
        }

        $users = $query->paginate(20, page: $request->input('page', 1));

        return response()->json($users);
    }

    private function searchEventRegistrants(Request $request): JsonResponse
    {
        $eventId = $request->input('event_id');

        $registrantsQuery = EventRegistration::query()
            ->whereIn('id', function ($q) use ($eventId) {
                $q->selectRaw('MIN(id)')
                  ->from('event_registrations')
                  ->where('event_id', $eventId)
                  ->whereIn('status', ['confirmed', 'attended'])
                  ->groupBy('email');
            });

        if ($request->filled('q')) {
            $term = $request->input('q');
            $registrantsQuery->where(function ($q) use ($term) {
                $q->where('name', 'like', "%{$term}%")
                  ->orWhere('email', 'like', "%{$term}%");
            });
        }

        $registrants = $registrantsQuery->orderBy('name')
            ->paginate(20, ['id', 'name', 'email'], page: $request->input('page', 1));

        $emails = $registrants->getCollection()->pluck('email');
        $usersByEmail = User::whereIn('email', $emails)
            ->select('id', 'email', 'role')
            ->get()
            ->keyBy('email');

        $registrants->setCollection(
            $registrants->getCollection()->map(function (EventRegistration $r) use ($usersByEmail) {
                $matchedUser = $usersByEmail->get($r->email);
                return [
                    'id'    => $matchedUser?->id ?? null,
                    'name'  => $r->name,
                    'email' => $r->email,
                    'role'  => $matchedUser?->role ?? null,
                ];
            })
        );

        return response()->json($registrants);
    }

    private function resolveRecipients(array $validated): Collection
    {
        return match ($validated['recipient_type']) {
            'all' => User::all(),

            'role' => User::where('role', $validated['recipient_role'])->get(),

            'event' => $this->resolveEventRecipients($validated['recipient_event_id']),

            'individual' => $this->resolveIndividualRecipients($validated['recipient_emails']),

            default => collect(),
        };
    }

    private function resolveEventRecipients(int $eventId): Collection
    {
        $emails = EventRegistration::where('event_id', $eventId)
            ->whereIn('status', ['confirmed', 'attended'])
            ->select('email')
            ->distinct()
            ->pluck('email');

        return User::whereIn('email', $emails)->get();
    }

    private function resolveIndividualRecipients(array $emails): Collection
    {
        return User::whereIn('email', $emails)->get();
    }

    private function recipientLabel(array $validated): string
    {
        return match ($validated['recipient_type']) {
            'all'    => 'All Users',
            'role'   => 'Role: ' . ucfirst($validated['recipient_role']),
            'event'  => 'Event: ' . (Event::find($validated['recipient_event_id'])?->title ?? 'Unknown'),
            'individual' => count($validated['recipient_emails']) . ' selected user(s)',
            default  => 'Unknown',
        };
    }
}
