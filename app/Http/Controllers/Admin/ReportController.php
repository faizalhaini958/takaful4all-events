<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventRegistration;
use App\Models\Setting;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class ReportController extends Controller
{
    /**
     * Event Registration Report page.
     */
    public function registrations(Request $request): InertiaResponse
    {
        $eventSlug  = $request->get('event', '');
        $status     = $request->get('status', 'all');
        $dateFrom   = $request->get('date_from', '');
        $dateTo     = $request->get('date_to', '');

        $query = EventRegistration::with(['event', 'ticket'])
            ->latest();

        if ($eventSlug) {
            $query->whereHas('event', fn ($q) => $q->where('slug', $eventSlug));
        }

        if (in_array($status, ['pending', 'awaiting_payment', 'confirmed', 'cancelled', 'waitlisted', 'attended'])) {
            $query->where('status', $status);
        }

        if ($dateFrom) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }

        if ($dateTo) {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        // Stat counters use the same filters (without status filter for breakdown)
        $statsBase = EventRegistration::query();

        if ($eventSlug) {
            $statsBase->whereHas('event', fn ($q) => $q->where('slug', $eventSlug));
        }

        if ($dateFrom) {
            $statsBase->whereDate('created_at', '>=', $dateFrom);
        }

        if ($dateTo) {
            $statsBase->whereDate('created_at', '<=', $dateTo);
        }

        $stats = [
            'total'      => (clone $statsBase)->count(),
            'confirmed'  => (clone $statsBase)->where('status', 'confirmed')->count(),
            'pending'    => (clone $statsBase)->where('status', 'pending')->count(),
            'awaiting_payment' => (clone $statsBase)->where('status', 'awaiting_payment')->count(),
            'attended'   => (clone $statsBase)->where('status', 'attended')->count(),
            'cancelled'  => (clone $statsBase)->where('status', 'cancelled')->count(),
            'waitlisted' => (clone $statsBase)->where('status', 'waitlisted')->count(),
            'revenue'    => (clone $statsBase)->where('payment_status', 'paid')->sum('total_amount'),
        ];

        $registrations = $query->paginate(25)->withQueryString();

        $events = Event::where('rsvp_enabled', true)
            ->orderBy('title')
            ->get(['id', 'title', 'slug']);

        return Inertia::render('Admin/Reports/Registrations', [
            'registrations'   => $registrations,
            'stats'           => $stats,
            'events'          => $events,
            'currentStatus'   => $status,
            'currentEvent'    => $eventSlug,
            'currentDateFrom' => $dateFrom,
            'currentDateTo'   => $dateTo,
        ]);
    }

    /**
     * Export Registration Report as CSV.
     */
    public function exportRegistrations(Request $request): StreamedResponse
    {
        $eventSlug = $request->get('event', '');
        $status    = $request->get('status', 'all');
        $dateFrom  = $request->get('date_from', '');
        $dateTo    = $request->get('date_to', '');

        $query = EventRegistration::with(['event', 'ticket'])->latest();

        if ($eventSlug) {
            $query->whereHas('event', fn ($q) => $q->where('slug', $eventSlug));
        }

        if (in_array($status, ['pending', 'awaiting_payment', 'confirmed', 'cancelled', 'waitlisted', 'attended'])) {
            $query->where('status', $status);
        }

        if ($dateFrom) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }

        if ($dateTo) {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        $registrations = $query->get();

        $filename = 'registration-report-' . now()->format('Ymd-His') . '.csv';

        $headers = [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];

        $columns = [
            'Reference No',
            'Event',
            'Ticket',
            'Name',
            'Email',
            'Phone',
            'Company',
            'Job Title',
            'Qty',
            'Subtotal (RM)',
            'Discount (RM)',
            'Total (RM)',
            'Status',
            'Payment Status',
            'Payment Method',
            'Payment Reference',
            'Registered At',
        ];

        $callback = function () use ($registrations, $columns) {
            $handle = fopen('php://output', 'w');

            // BOM for Excel UTF-8 compatibility
            fwrite($handle, "\xEF\xBB\xBF");

            fputcsv($handle, $columns);

            foreach ($registrations as $reg) {
                fputcsv($handle, [
                    $reg->reference_no,
                    $reg->event?->title ?? '-',
                    $reg->ticket?->name ?? '-',
                    $reg->name,
                    $reg->email,
                    $reg->phone ?? '-',
                    $reg->company ?? '-',
                    $reg->job_title ?? '-',
                    $reg->quantity,
                    number_format((float) $reg->subtotal, 2),
                    number_format((float) $reg->discount_amount, 2),
                    number_format((float) $reg->total_amount, 2),
                    $reg->status,
                    $reg->payment_status,
                    $reg->payment_method ?? '-',
                    $reg->payment_reference ?? '-',
                    $reg->created_at?->format('Y-m-d H:i:s') ?? '-',
                ]);
            }

            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Export Registration Report as PDF.
     */
    public function exportPdf(Request $request): \Illuminate\Http\Response
    {
        $eventSlug = $request->get('event', '');
        $status    = $request->get('status', 'all');
        $dateFrom  = $request->get('date_from', '');
        $dateTo    = $request->get('date_to', '');

        $query = EventRegistration::with(['event', 'ticket'])->latest();

        if ($eventSlug) {
            $query->whereHas('event', fn ($q) => $q->where('slug', $eventSlug));
        }

        if (in_array($status, ['pending', 'awaiting_payment', 'confirmed', 'cancelled', 'waitlisted', 'attended'])) {
            $query->where('status', $status);
        }

        if ($dateFrom) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }

        if ($dateTo) {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        $registrations = $query->get();

        // Build stats for summary section
        $statsBase = EventRegistration::query();
        if ($eventSlug) {
            $statsBase->whereHas('event', fn ($q) => $q->where('slug', $eventSlug));
        }
        if ($dateFrom) {
            $statsBase->whereDate('created_at', '>=', $dateFrom);
        }
        if ($dateTo) {
            $statsBase->whereDate('created_at', '<=', $dateTo);
        }

        $stats = [
            'total'             => (clone $statsBase)->count(),
            'confirmed'         => (clone $statsBase)->where('status', 'confirmed')->count(),
            'pending'           => (clone $statsBase)->where('status', 'pending')->count(),
            'awaiting_payment'  => (clone $statsBase)->where('status', 'awaiting_payment')->count(),
            'attended'          => (clone $statsBase)->where('status', 'attended')->count(),
            'cancelled'         => (clone $statsBase)->where('status', 'cancelled')->count(),
            'waitlisted'        => (clone $statsBase)->where('status', 'waitlisted')->count(),
            'revenue'           => (clone $statsBase)->where('payment_status', 'paid')->sum('total_amount'),
        ];

        // Resolve event title for filter display
        $filterEventTitle = null;
        if ($eventSlug) {
            $filterEventTitle = Event::where('slug', $eventSlug)->value('title') ?? $eventSlug;
        }

        // Resolve dompdf public path (same pattern as InvoiceService)
        $dompdfPublicPath = $this->resolveDompdfPublicPath();
        Config::set('dompdf.public_path', $dompdfPublicPath);

        $pdf = Pdf::setOption('chroot', $dompdfPublicPath)
            ->setPaper('a4', 'landscape')
            ->loadView('reports.registrations', [
                'registrations' => $registrations,
                'stats'         => $stats,
                'settings'      => Setting::getGroup('invoicing'),
                'hasFilters'    => $eventSlug || ($status !== 'all') || $dateFrom || $dateTo,
                'filterEvent'   => $filterEventTitle,
                'filterStatus'  => $status,
                'filterDateFrom' => $dateFrom,
                'filterDateTo'   => $dateTo,
            ]);

        $filename = 'registration-report-' . now()->format('Ymd-His') . '.pdf';

        return $pdf->download($filename);
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
