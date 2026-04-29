<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\EventRegistration;
use App\Services\TicketService;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TicketController extends Controller
{
    /**
     * Download a ticket PDF for a specific attendee.
     * Uses cached PDF or generates on-demand (synchronous fallback).
     */
    public function download(Request $request, EventRegistration $registration, int $attendee_no = 1): StreamedResponse
    {
        // Authorization
        $user = $request->user();
        $isAdmin = in_array($user?->role, ['admin', 'editor', 'checkin_staff']);
        $isOwner = $registration->email === $user?->email || $registration->user_id === $user?->id;

        if (!$isAdmin && !$isOwner) {
            abort(403, 'You are not authorised to download this ticket.');
        }

        $registration->loadMissing(['event', 'ticket', 'attendees']);
        $ticketService = app(TicketService::class);

        return $ticketService->download($registration, $attendee_no);
    }
}
