<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CheckInLog;
use App\Models\Event;
use App\Models\EventRegistration;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class CheckInController extends Controller
{
    /**
     * Accept both base reference and attendee-suffixed reference, e.g. EVT-20260423-ABCD-01.
     *
     * @return array{0:string,1:int|null}
     */
    private function parseReferenceAndAttendee(string $rawReference, ?int $attendeeNo): array
    {
        $reference = trim($rawReference);

        if (preg_match('/^(EVT-\d{8}-[A-Z0-9]{4})-(\d{1,3})$/i', $reference, $matches)) {
            $baseReference = strtoupper($matches[1]);
            $suffixNo = (int) $matches[2];
            return [$baseReference, $attendeeNo ?: $suffixNo];
        }

        return [strtoupper($reference), $attendeeNo];
    }

    /**
     * Show the QR check-in scanner page (mobile-friendly).
     */
    public function scanner(Event $event): Response
    {
        $checkedInCount = \App\Models\EventRegistrationAttendee::whereHas(
            'registration',
            fn ($q) => $q->where('event_id', $event->id)
        )->whereNotNull('checked_in_at')->count();

        return Inertia::render('Admin/Events/CheckIn', [
            'event'            => $event->load('media'),
            'checked_in_count' => $checkedInCount,
        ]);
    }

    /**
     * Look up a registration by reference for QR check-in.
     */
    public function lookup(Request $request, Event $event): JsonResponse
    {
        $request->validate([
            'reference' => ['required', 'string'],
            'attendee_no' => ['nullable', 'integer', 'min:1'],
        ]);

        [$reference, $parsedAttendeeNo] = $this->parseReferenceAndAttendee(
            (string) $request->reference,
            $request->input('attendee_no') ? (int) $request->input('attendee_no') : null
        );

        $registration = EventRegistration::where('event_id', $event->id)
            ->where('reference_no', $reference)
            ->with(['ticket', 'attendees'])
            ->first();

        if (!$registration) {
            return response()->json([
                'found' => false,
                'message' => 'Registration not found for this event.',
            ]);
        }

        $registration->ensureAttendeesExist();
        $registration->load(['ticket', 'attendees']);

        $attendeeNo = (int) ($parsedAttendeeNo ?: 0);
        if ($attendeeNo === 0) {
            $attendeeNo = $registration->quantity > 1 ? 0 : 1;
        }

        if ($attendeeNo === 0) {
            return response()->json([
                'found' => false,
                'message' => 'For multi-attendee bookings, scan attendee QR code to identify the exact ticket.',
            ]);
        }

        $attendee = $registration->attendees()
            ->where('attendee_no', $attendeeNo)
            ->first();

        if (!$attendee) {
            return response()->json([
                'found' => false,
                'message' => 'Attendee ticket not found for this registration.',
            ]);
        }

        $checkedInAt = $attendee->checked_in_at;
        if (!$checkedInAt && $registration->quantity === 1 && $registration->checked_in_at) {
            $attendee->update(['checked_in_at' => $registration->checked_in_at]);
            $checkedInAt = $attendee->checked_in_at;
        }

        return response()->json([
            'found' => true,
            'registration' => [
                'id'             => $registration->id,
                'reference_no'   => $registration->reference_no,
                'attendee_no'    => $attendee->attendee_no,
                'name'           => $attendee->name,
                'email'          => $attendee->email,
                'phone'          => $attendee->phone,
                'company'        => $attendee->company,
                'ticket'         => $registration->ticket?->name,
                'quantity'       => $registration->quantity,
                'status'         => $registration->status,
                'payment_status' => $registration->payment_status,
                'checked_in_at'  => $checkedInAt?->toIso8601String(),
                'meta_json'      => $attendee->meta_json ?? [],
            ],
        ]);
    }

    /**
     * Mark a registration as checked in via QR scan.
     */
    public function checkIn(Request $request, Event $event): JsonResponse|RedirectResponse
    {
        $request->validate([
            'reference' => ['required', 'string'],
            'attendee_no' => ['nullable', 'integer', 'min:1'],
        ]);

        [$reference, $parsedAttendeeNo] = $this->parseReferenceAndAttendee(
            (string) $request->reference,
            $request->input('attendee_no') ? (int) $request->input('attendee_no') : null
        );

        $registration = EventRegistration::where('event_id', $event->id)
            ->where('reference_no', $reference)
            ->with('attendees')
            ->first();

        if (!$registration) {
            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'message' => 'Registration not found.'], 404);
            }
            return redirect()->back()->with('error', 'Registration not found.');
        }

        $registration->ensureAttendeesExist();
        $registration->load('attendees');

        $attendeeNo = (int) ($parsedAttendeeNo ?: 0);
        if ($attendeeNo === 0) {
            $attendeeNo = $registration->quantity > 1 ? 0 : 1;
        }

        if ($attendeeNo === 0) {
            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'message' => 'For multi-attendee bookings, scan attendee QR code to check in a specific attendee.']);
            }
            return redirect()->back()->with('error', 'For multi-attendee bookings, scan attendee QR code to check in a specific attendee.');
        }

        $attendee = $registration->attendees()->where('attendee_no', $attendeeNo)->first();
        if (!$attendee) {
            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'message' => 'Attendee ticket not found.'], 404);
            }
            return redirect()->back()->with('error', 'Attendee ticket not found.');
        }

        $checkedInAt = $attendee->checked_in_at;
        if (!$checkedInAt && $registration->quantity === 1 && $registration->checked_in_at) {
            $attendee->update(['checked_in_at' => $registration->checked_in_at]);
            $checkedInAt = $attendee->checked_in_at;
        }

        if ($checkedInAt) {
            $checkedInTime = $checkedInAt->format('d M Y, g:i A');
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => "Already checked in at {$checkedInTime}.",
                    'registration' => [
                        'name'          => $attendee->name,
                        'attendee_no'   => $attendee->attendee_no,
                        'checked_in_at' => $checkedInAt->toIso8601String(),
                    ],
                ]);
            }
            return redirect()->back()->with('error', "{$attendee->name} was already checked in at {$checkedInTime}.");
        }

        if ($registration->status === 'cancelled') {
            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'message' => 'This registration has been cancelled.']);
            }
            return redirect()->back()->with('error', 'This registration has been cancelled.');
        }

        $attendee->markAsCheckedIn();

        CheckInLog::create([
            'event_id'        => $event->id,
            'registration_id' => $registration->id,
            'attendee_id'     => $attendee->id,
            'user_id'         => Auth::id(),
            'action'          => 'checked_in',
            'performed_at'    => now(),
            'meta_json'       => [
                'attendee_name' => $attendee->name,
                'attendee_no'   => $attendee->attendee_no,
                'method'        => $request->wantsJson() ? 'qr_scan' : 'manual',
            ],
        ]);

        // Keep registration-level checked_in_at for backward compatibility once all attendees are checked in.
        $remaining = $registration->attendees()->whereNull('checked_in_at')->count();
        if ($remaining === 0 && !$registration->checked_in_at) {
            $registration->markAsCheckedIn();
        }

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => "{$attendee->name} checked in successfully!",
                'registration' => [
                    'name'          => $attendee->name,
                    'email'         => $attendee->email,
                    'attendee_no'   => $attendee->attendee_no,
                    'ticket'        => $registration->ticket?->name,
                    'quantity'      => $registration->quantity,
                    'checked_in_at' => $attendee->checked_in_at->toIso8601String(),
                ],
            ]);
        }

        return redirect()->back()->with('success', "{$attendee->name} checked in successfully!");
    }

    /**
     * View the check-in audit log for an event.
     */
    public function log(Request $request, Event $event): Response
    {
        $dateFrom = $request->get('date_from', '');
        $dateTo   = $request->get('date_to', '');
        $search   = $request->get('search', '');

        $query = CheckInLog::where('event_id', $event->id)
            ->with(['registration', 'attendee', 'user'])
            ->latest('performed_at');

        if ($dateFrom) {
            $query->whereDate('performed_at', '>=', $dateFrom);
        }

        if ($dateTo) {
            $query->whereDate('performed_at', '<=', $dateTo);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->whereHas('registration', fn ($r) => $r->where('name', 'like', "%{$search}%")
                    ->orWhere('reference_no', 'like', "%{$search}%"))
                  ->orWhereHas('attendee', fn ($a) => $a->where('name', 'like', "%{$search}%"))
                  ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$search}%"));
            });
        }

        $logs = $query->paginate(25)->withQueryString();

        $stats = [
            'total'      => CheckInLog::where('event_id', $event->id)->count(),
            'today'      => CheckInLog::where('event_id', $event->id)->whereDate('performed_at', today())->count(),
        ];

        return Inertia::render('Admin/Events/CheckInLog', [
            'event'          => $event->only(['id', 'title', 'slug']),
            'logs'           => $logs->through(fn ($log) => [
                'id'              => $log->id,
                'action'          => $log->action,
                'performed_at'    => $log->performed_at?->toIso8601String(),
                'meta_json'       => $log->meta_json,
                'registration'    => $log->registration ? [
                    'id'           => $log->registration->id,
                    'reference_no' => $log->registration->reference_no,
                    'name'         => $log->registration->name,
                ] : null,
                'attendee'        => $log->attendee ? [
                    'id'   => $log->attendee->id,
                    'name' => $log->attendee->name,
                ] : null,
                'user'            => $log->user ? [
                    'id'   => $log->user->id,
                    'name' => $log->user->name,
                ] : null,
            ]),
            'stats'          => $stats,
            'currentSearch'  => $search,
            'currentDateFrom'=> $dateFrom,
            'currentDateTo'  => $dateTo,
        ]);
    }
}
