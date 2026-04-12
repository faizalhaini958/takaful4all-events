<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventRegistration;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CheckInController extends Controller
{
    /**
     * Show the QR check-in scanner page (mobile-friendly).
     */
    public function scanner(Event $event): Response
    {
        return Inertia::render('Admin/Events/CheckIn', [
            'event' => $event->load('media'),
        ]);
    }

    /**
     * Look up a registration by reference for QR check-in.
     */
    public function lookup(Request $request, Event $event): JsonResponse
    {
        $request->validate([
            'reference' => ['required', 'string'],
        ]);

        $registration = EventRegistration::where('event_id', $event->id)
            ->where('reference_no', $request->reference)
            ->with(['ticket'])
            ->first();

        if (!$registration) {
            return response()->json([
                'found' => false,
                'message' => 'Registration not found for this event.',
            ]);
        }

        return response()->json([
            'found' => true,
            'registration' => [
                'id'             => $registration->id,
                'reference_no'   => $registration->reference_no,
                'name'           => $registration->name,
                'email'          => $registration->email,
                'phone'          => $registration->phone,
                'company'        => $registration->company,
                'ticket'         => $registration->ticket?->name,
                'quantity'       => $registration->quantity,
                'status'         => $registration->status,
                'payment_status' => $registration->payment_status,
                'checked_in_at'  => $registration->checked_in_at?->toIso8601String(),
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
        ]);

        $registration = EventRegistration::where('event_id', $event->id)
            ->where('reference_no', $request->reference)
            ->first();

        if (!$registration) {
            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'message' => 'Registration not found.'], 404);
            }
            return redirect()->back()->with('error', 'Registration not found.');
        }

        if ($registration->checked_in_at) {
            $checkedInTime = $registration->checked_in_at->format('d M Y, g:i A');
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => "Already checked in at {$checkedInTime}.",
                    'registration' => [
                        'name'          => $registration->name,
                        'checked_in_at' => $registration->checked_in_at->toIso8601String(),
                    ],
                ]);
            }
            return redirect()->back()->with('error', "{$registration->name} was already checked in at {$checkedInTime}.");
        }

        if ($registration->status === 'cancelled') {
            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'message' => 'This registration has been cancelled.']);
            }
            return redirect()->back()->with('error', 'This registration has been cancelled.');
        }

        $registration->markAsCheckedIn();

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => "{$registration->name} checked in successfully!",
                'registration' => [
                    'name'          => $registration->name,
                    'email'         => $registration->email,
                    'ticket'        => $registration->ticket?->name,
                    'quantity'      => $registration->quantity,
                    'checked_in_at' => $registration->checked_in_at->toIso8601String(),
                ],
            ]);
        }

        return redirect()->back()->with('success', "{$registration->name} checked in successfully!");
    }
}
