<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\EventRegistration;
use App\Services\TicketService;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TicketController extends Controller
{
    /**
     * Public ticket download — accessible via reference number (no auth required).
     */
    public function downloadByReference(string $reference, int $attendee_no = 1): Response
    {
        $registration = EventRegistration::where('reference_no', $reference)
            ->with(['event', 'ticket', 'attendees'])
            ->firstOrFail();

        // Only allow download for confirmed/attended registrations
        if (!in_array($registration->status, ['confirmed', 'attended'])) {
            abort(404, 'Tickets are only available for confirmed registrations.');
        }

        $ticketService = app(TicketService::class);

        return $ticketService->download($registration, $attendee_no, false);
    }

    /**
     * Download or preview a ticket PDF for a specific attendee.
     * Uses cached PDF or generates on-demand (synchronous fallback).
     */
    public function download(Request $request, EventRegistration $registration, int $attendee_no = 1): Response
    {
        // Authorization
        $user = $request->user();
        $isAdmin = in_array($user?->role, ['admin', 'checkin_staff']);
        $isOwner = $registration->email === $user?->email || $registration->user_id === $user?->id;

        if (!$isAdmin && !$isOwner) {
            abort(403, 'You are not authorised to download this ticket.');
        }

        $registration->loadMissing(['event', 'ticket', 'attendees']);
        $ticketService = app(TicketService::class);

        return $ticketService->download($registration, $attendee_no, $request->boolean('inline'));
    }
}
