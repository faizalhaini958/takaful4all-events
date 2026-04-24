<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\EventRegistration;
use App\Services\TicketService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TicketController extends Controller
{
    /**
     * Download a ticket PDF for a specific attendee.
     * Accessible by admin, checkin_staff, or the registration owner.
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

        $attendee = $registration->attendees()->where('attendee_no', $attendee_no)->firstOrFail();

        $ticketService = app(TicketService::class);
        $year     = now()->format('Y');
        $safeName = preg_replace('/[^A-Z0-9\-]/', '', strtoupper($registration->reference_no));
        $pad      = str_pad($attendee_no, 2, '0', STR_PAD_LEFT);
        $path     = "tickets/{$year}/{$safeName}-{$pad}.pdf";

        if (!Storage::disk('local')->exists($path)) {
            $ticketService->generateForAttendee($registration, $attendee);
        }

        $filename = "{$registration->reference_no}-ticket-{$pad}.pdf";

        return Storage::disk('local')->download($path, $filename, ['Content-Type' => 'application/pdf']);
    }
}
