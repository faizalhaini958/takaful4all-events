<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventRegistrationAttendee;
use App\Models\Setting;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ParticipantsController extends Controller
{
    /**
     * Display all attendees for an event with their custom field data.
     */
    public function index(Event $event): Response
    {
        $search   = request('search', '');
        $ticketId = request('ticket', '');
        $checkin  = request('checkin', ''); // '' | 'yes' | 'no'

        $fields  = $event->registration_fields ?? [];
        $tickets = $event->tickets()->orderBy('sort_order')->get(['id', 'name']);

        // ── Stats (unfiltered total for the event) ───────────────────────────
        $statsBase = EventRegistrationAttendee::whereHas('registration', fn($q) => $q->where('event_id', $event->id));
        $stats = [
            'total'      => $statsBase->count(),
            'checked_in' => $statsBase->clone()->whereNotNull('checked_in_at')->count(),
        ];

        // ── Filtered query ───────────────────────────────────────────────────
        $query = EventRegistrationAttendee::whereHas('registration', function ($q) use ($event) {
                $q->where('event_id', $event->id);
            })
            ->with(['registration:id,reference_no,ticket_id', 'registration.ticket:id,name'])
            ->orderBy('created_at');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($ticketId) {
            $query->whereHas('registration', fn($q) => $q->where('ticket_id', $ticketId));
        }

        if ($checkin === 'yes') {
            $query->whereNotNull('checked_in_at');
        } elseif ($checkin === 'no') {
            $query->whereNull('checked_in_at');
        }

        $attendees = $query->paginate(50)->withQueryString();

        return Inertia::render('Admin/Events/Participants/Index', [
            'event'          => $event->only(['id', 'title', 'slug']),
            'attendees'      => $attendees,
            'fields'         => $fields,
            'tickets'        => $tickets,
            'stats'          => $stats,
            'currentSearch'  => $search,
            'currentTicket'  => $ticketId,
            'currentCheckin' => $checkin,
        ]);
    }

    /**
     * Export participants as CSV.
     */
    public function exportCsv(Event $event): StreamedResponse
    {
        $allFields = $event->registration_fields ?? [];

        // Column visibility
        $colsParam    = request('cols', '');
        $selectedCols = $colsParam !== '' ? explode(',', $colsParam) : null;
        $showRef      = !$selectedCols || in_array('__ref',     $selectedCols);
        $showTicket   = !$selectedCols || in_array('__ticket',  $selectedCols);
        $showCheckin  = !$selectedCols || in_array('__checkin', $selectedCols);
        $fields = $selectedCols
            ? array_values(array_filter($allFields, fn($f) => in_array($f['key'] ?? '', $selectedCols)))
            : $allFields;

        $attendees = $this->buildExportQuery($event)->get();

        $filename = 'participants-' . Str::slug($event->title) . '-' . now()->format('Ymd-His') . '.csv';

        $headers = [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];

        $allHeaders = ['#'];
        if ($showRef)    $allHeaders[] = 'Ref No';
        if ($showTicket) $allHeaders[] = 'Ticket';
        if ($showCheckin) $allHeaders[] = 'Check-in';
        foreach ($fields as $field) {
            $allHeaders[] = $field['label_en'] ?? $field['key'] ?? '';
        }

        $callback = function () use ($attendees, $fields, $allHeaders, $showRef, $showTicket, $showCheckin) {
            $handle = fopen('php://output', 'w');
            fwrite($handle, "\xEF\xBB\xBF");
            fputcsv($handle, $allHeaders);

            foreach ($attendees as $i => $attendee) {
                $customFields = $attendee->meta_json['custom_fields'] ?? [];

                $row = [$i + 1];
                if ($showRef)    $row[] = $attendee->registration?->reference_no ?? '-';
                if ($showTicket) $row[] = $attendee->registration?->ticket?->name ?? '-';
                if ($showCheckin) $row[] = $attendee->checked_in_at ? 'Yes' : 'No';

                foreach ($fields as $field) {
                    $key       = $field['key'] ?? '';
                    $directMap = ['name' => $attendee->name, 'email' => $attendee->email, 'phone' => $attendee->phone];
                    $value     = array_key_exists($key, $directMap) ? ($directMap[$key] ?? '') : ($customFields[$key] ?? '');
                    if (is_array($value)) $value = implode(', ', $value);
                    $row[] = $value;
                }

                fputcsv($handle, $row);
            }

            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Export participants as PDF (landscape A4).
     */
    public function exportPdf(Event $event): \Illuminate\Http\Response
    {
        $allFields = $event->registration_fields ?? [];

        // Column visibility
        $colsParam    = request('cols', '');
        $selectedCols = $colsParam !== '' ? explode(',', $colsParam) : null;
        $showRef      = !$selectedCols || in_array('__ref',     $selectedCols);
        $showTicket   = !$selectedCols || in_array('__ticket',  $selectedCols);
        $showCheckin  = !$selectedCols || in_array('__checkin', $selectedCols);
        $fields = $selectedCols
            ? array_values(array_filter($allFields, fn($f) => in_array($f['key'] ?? '', $selectedCols)))
            : $allFields;

        $attendees = $this->buildExportQuery($event)->get();

        $dompdfPublicPath = $this->resolveDompdfPublicPath();
        Config::set('dompdf.public_path', $dompdfPublicPath);

        $pdf = Pdf::setOption('chroot', $dompdfPublicPath)
            ->setPaper('a4', 'landscape')
            ->loadView('reports.participants', [
                'event'      => $event,
                'attendees'  => $attendees,
                'fields'     => $fields,
                'showRef'    => $showRef,
                'showTicket' => $showTicket,
                'showCheckin'=> $showCheckin,
                'settings'   => Setting::getGroup('invoicing'),
            ]);

        $filename = 'participants-' . Str::slug($event->title) . '-' . now()->format('Ymd-His') . '.pdf';

        return $pdf->download($filename);
    }

    /**
     * Build the base export query applying search, ticket, and check-in filters.
     */
    private function buildExportQuery(Event $event)
    {
        $search   = request('search', '');
        $ticketId = request('ticket', '');
        $checkin  = request('checkin', '');

        $query = EventRegistrationAttendee::whereHas('registration', function ($q) use ($event) {
                $q->where('event_id', $event->id);
            })
            ->with(['registration:id,reference_no,ticket_id', 'registration.ticket:id,name'])
            ->orderBy('created_at');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($ticketId) {
            $query->whereHas('registration', fn($q) => $q->where('ticket_id', $ticketId));
        }

        if ($checkin === 'yes') {
            $query->whereNotNull('checked_in_at');
        } elseif ($checkin === 'no') {
            $query->whereNull('checked_in_at');
        }

        return $query;
    }

    /**
     * Resolve a real public path for DomPDF (shared hosting safe).
     */
    private function resolveDompdfPublicPath(): string
    {
        $candidates = [
            env('APP_PUBLIC_PATH'),
            public_path(),
            dirname(base_path()) . '/public_html',
            base_path('../public_html'),
            storage_path('app/public'),
            base_path('public'),
        ];

        foreach ($candidates as $candidate) {
            if (!empty($candidate) && is_dir($candidate)) {
                return $candidate;
            }
        }

        return base_path();
    }
}
