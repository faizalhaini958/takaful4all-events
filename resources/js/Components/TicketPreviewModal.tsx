import { useRef, useCallback, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Separator } from '@/Components/ui/separator';
import { Calendar, MapPin, Download, Printer, User, Mail, Ticket, Hash, Package, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { type EventRegistration, type SharedProps } from '@/types';
import { useState } from 'react';
import { usePage } from '@inertiajs/react';

interface Attendee {
    id?: number;
    attendee_no?: number;
    name: string;
    email: string;
    phone?: string | null;
    company?: string | null;
    job_title?: string | null;
    dietary_requirements?: string | null;
}

interface Props {
    registration: EventRegistration | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const STATUS_COLOR: Record<string, string> = {
    confirmed:         'bg-emerald-100 text-emerald-700 border-emerald-200',
    attended:          'bg-blue-100 text-blue-700 border-blue-200',
    pending:           'bg-amber-100 text-amber-700 border-amber-200',
    awaiting_payment:  'bg-orange-100 text-orange-700 border-orange-200',
    cancelled:         'bg-red-100 text-red-700 border-red-200',
    waitlisted:        'bg-gray-100 text-gray-700 border-gray-200',
};

export default function TicketPreviewModal({ registration, open, onOpenChange }: Props) {
    const { auth } = usePage().props as { auth: SharedProps['auth'] };
    const ticketRef = useRef<HTMLDivElement>(null);
    const [currentTicket, setCurrentTicket] = useState(0);

    // Build attendee list from attendee rows first, then fallback to legacy meta_json.
    const attendees = useMemo<Attendee[]>(() => {
        if (!registration) return [];

        const relationAttendees = (registration.attendees ?? []).map((attendee) => ({
            id: attendee.id,
            attendee_no: attendee.attendee_no,
            name: attendee.name,
            email: attendee.email,
            phone: attendee.phone,
            company: attendee.company,
            job_title: attendee.job_title,
            dietary_requirements: attendee.dietary_requirements,
        }));

        const allAttendees = relationAttendees.length > 0
            ? relationAttendees
            : (() => {
                const primary: Attendee = {
                    attendee_no: 1,
                    name: registration.name,
                    email: registration.email,
                    phone: registration.phone,
                    company: registration.company,
                    job_title: registration.job_title,
                    dietary_requirements: registration.dietary_requirements,
                };

                const additional: Attendee[] =
                    (registration.meta_json as { attendees?: Attendee[] })?.attendees ?? [];

                return [primary, ...additional.map((attendee, idx) => ({ ...attendee, attendee_no: idx + 2 }))];
            })();

        const currentUserEmail = auth?.user?.email?.toLowerCase?.() ?? '';
        const isPrimaryBuyer = registration.email.toLowerCase() === currentUserEmail;

        // Primary buyer can view all group tickets; invited attendees only see their own ticket.
        if (!isPrimaryBuyer && currentUserEmail) {
            const ownTicket = allAttendees.find((attendee) => attendee.email.toLowerCase() === currentUserEmail);
            if (ownTicket) {
                return [ownTicket];
            }
        }

        return allAttendees;
    }, [registration, auth]);

    const totalTickets = attendees.length;
    const attendee = attendees[currentTicket];

    const handleDownload = useCallback(() => {
        if (!registration || !attendee) return;

        const attendeeNo = attendee.attendee_no ?? (currentTicket + 1);
        const downloadUrl = route('tickets.download', {
            registration: registration.id,
            attendee_no: attendeeNo,
        });

        window.location.href = downloadUrl;
    }, [registration, attendee, currentTicket]);

    const handlePrint = useCallback(() => {
        if (!registration || !attendee) return;

        const attendeeNo = attendee.attendee_no ?? (currentTicket + 1);
        const previewUrl = route('tickets.download', {
            registration: registration.id,
            attendee_no: attendeeNo,
            inline: 1,
        });

        window.open(previewUrl, '_blank');
    }, [registration, attendee, currentTicket]);

    if (!registration || !attendee) return null;

    const event = registration.event;
    const startDate = event?.start_at ? new Date(event.start_at) : null;
    const endDate = event?.end_at ? new Date(event.end_at) : null;
    const location = [event?.venue, event?.city, event?.state].filter(Boolean).join(', ');

    const attendeeNo = attendee.attendee_no ?? (currentTicket + 1);

    // QR payload unique per attendee — includes attendee number for strict per-attendee check-in
    const qrPayload = JSON.stringify({
        ref: registration.reference_no,
        id: registration.id,
        event_id: registration.event_id,
        attendee_no: attendeeNo,
        attendee_name: attendee.name,
        attendee_email: attendee.email,
    });

    return (
        <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setCurrentTicket(0); }}>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-0">
                <DialogHeader className="sr-only">
                    <DialogTitle>Event Tickets</DialogTitle>
                    <DialogDescription>Tickets for {event?.title}</DialogDescription>
                </DialogHeader>

                <style>{`
                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        .ticket-printable, .ticket-printable * {
                            visibility: visible;
                        }
                        .ticket-printable {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                        }
                    }
                `}</style>

                {/* Action buttons (sticky top) */}
                <div className="sticky top-0 z-10 bg-white border-b px-6 py-3 flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-1.5">
                        <Ticket className="w-4 h-4" />
                        {totalTickets > 1
                            ? `Ticket ${currentTicket + 1} of ${totalTickets}`
                            : 'Event Ticket'
                        }
                    </h3>
                    {(registration.status === 'confirmed' || registration.status === 'attended') && (
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handlePrint}>
                            <Printer className="w-4 h-4 mr-1.5" />
                            Print
                        </Button>
                        <Button size="sm" onClick={handleDownload}>
                            <Download className="w-4 h-4 mr-1.5" />
                            Download PDF
                        </Button>
                    </div>
                    )}
                </div>

                {/* Ticket navigation (only for multi-ticket) */}
                {totalTickets > 1 && (
                    <div className="px-6 py-2 bg-gray-50 border-b flex items-center justify-between">
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={currentTicket === 0}
                            onClick={() => setCurrentTicket((p) => p - 1)}
                        >
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            Previous
                        </Button>
                        <div className="flex gap-1.5">
                            {Array.from({ length: totalTickets }, (_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentTicket(i)}
                                    className={`w-7 h-7 rounded-full text-xs font-medium transition-colors ${
                                        i === currentTicket
                                            ? 'bg-[#1a2332] text-white'
                                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                    }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={currentTicket === totalTickets - 1}
                            onClick={() => setCurrentTicket((p) => p + 1)}
                        >
                            Next
                            <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                )}

                {/* Ticket content (captured for PDF) */}
                <div ref={ticketRef} className="bg-white ticket-printable">
                    {/* Header / Event banner */}
                    <div className="bg-[#1a2332] text-white px-6 py-5">
                        <div className="flex items-start gap-4">
                            <img src="/images/logo.png" alt="MTA" className="h-10 w-auto flex-shrink-0 mt-0.5" />
                            <div className="min-w-0">
                                <h2 className="text-lg font-bold leading-tight">{event?.title ?? 'Event'}</h2>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-white/75">
                                    {startDate && (
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {startDate.toLocaleDateString('en-MY', {
                                                weekday: 'short',
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                            })}
                                            {endDate && startDate.toDateString() !== endDate.toDateString() && (
                                                <> – {endDate.toLocaleDateString('en-MY', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}</>
                                            )}
                                        </span>
                                    )}
                                    {location && (
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-3.5 h-3.5" />
                                            {location}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Ticket body */}
                    <div className="px-6 py-5">
                        {/* Status + Reference + Ticket number */}
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${STATUS_COLOR[registration.status] ?? 'bg-gray-100 text-gray-700'}`}>
                                    {registration.status.charAt(0).toUpperCase() + registration.status.slice(1)}
                                </span>
                                {registration.ticket && (
                                    <Badge variant="outline" className="text-xs">
                                        {registration.ticket.name}
                                    </Badge>
                                )}
                                {totalTickets > 1 && (
                                    <Badge variant="secondary" className="text-xs">
                                        <Users className="w-3 h-3 mr-1" />
                                        {currentTicket + 1} / {totalTickets}
                                    </Badge>
                                )}
                            </div>
                            <span className="font-mono text-xs text-gray-400">{registration.reference_no}</span>
                        </div>

                        {/* Main content: Attendee Info + QR */}
                        <div className="flex flex-col sm:flex-row gap-5">
                            {/* Attendee details */}
                            <div className="flex-1 space-y-3">
                                {totalTickets > 1 && (
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                                        {currentTicket === 0 ? 'Primary Buyer / Attendee 1' : `Attendee ${currentTicket + 1}`}
                                    </p>
                                )}
                                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                                    <div>
                                        <p className="text-xs text-gray-400 flex items-center gap-1 mb-0.5">
                                            <User className="w-3 h-3" /> Name
                                        </p>
                                        <p className="font-medium text-gray-900">{attendee.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 flex items-center gap-1 mb-0.5">
                                            <Mail className="w-3 h-3" /> Email
                                        </p>
                                        <p className="font-medium text-gray-900 truncate">{attendee.email}</p>
                                    </div>
                                    {attendee.company && (
                                        <div>
                                            <p className="text-xs text-gray-400 mb-0.5">Company</p>
                                            <p className="font-medium text-gray-900">{attendee.company}</p>
                                        </div>
                                    )}
                                    {attendee.job_title && (
                                        <div>
                                            <p className="text-xs text-gray-400 mb-0.5">Job Title</p>
                                            <p className="font-medium text-gray-900">{attendee.job_title}</p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-xs text-gray-400 flex items-center gap-1 mb-0.5">
                                            <Ticket className="w-3 h-3" /> Ticket Type
                                        </p>
                                        <p className="font-medium text-gray-900">{registration.ticket?.name ?? '—'}</p>
                                    </div>
                                    {attendee.phone && (
                                        <div>
                                            <p className="text-xs text-gray-400 mb-0.5">Phone</p>
                                            <p className="font-medium text-gray-900">{attendee.phone}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Order summary — only show on the first ticket */}
                                {currentTicket === 0 && Number(registration.total_amount) > 0 && (
                                    <div className="pt-3 mt-2 border-t">
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Order Summary</p>
                                        <div className="text-sm space-y-1">
                                            <div className="flex justify-between text-gray-500">
                                                <span>{registration.ticket?.name} × {registration.quantity}</span>
                                                <span>RM {Number(registration.subtotal).toFixed(2)}</span>
                                            </div>
                                            {Number(registration.products_total) > 0 && (
                                                <div className="flex justify-between text-gray-500">
                                                    <span>Add-ons</span>
                                                    <span>RM {Number(registration.products_total).toFixed(2)}</span>
                                                </div>
                                            )}
                                            <Separator />
                                            <div className="flex justify-between font-bold text-gray-900">
                                                <span>Total</span>
                                                <span>RM {Number(registration.total_amount).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* QR Code — only shown for confirmed/attended registrations */}
                            <div className="flex flex-col items-center justify-center sm:border-l sm:pl-5">
                                {(registration.status === 'confirmed' || registration.status === 'attended') ? (
                                    <>
                                        <div className="bg-white p-3 rounded-lg border">
                                            <QRCodeSVG
                                                value={qrPayload}
                                                size={140}
                                                level="M"
                                                includeMargin={false}
                                            />
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-2 text-center">
                                            Scan for attendance
                                        </p>
                                        <p className="font-mono text-[10px] text-gray-400 text-center mt-0.5">
                                            {registration.reference_no}-{String(attendeeNo).padStart(2, '0')}
                                        </p>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center w-[140px] h-[140px] rounded-lg border-2 border-dashed border-amber-300 bg-amber-50 text-center p-3">
                                        <p className="text-xs font-medium text-amber-700">Pending Approval</p>
                                        <p className="text-[10px] text-amber-600 mt-1">QR code will be available once confirmed</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Add-on products — only on first ticket */}
                        {currentTicket === 0 && registration.products && registration.products.length > 0 && (
                            <div className="mt-5 pt-4 border-t">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                                    <Package className="w-3 h-3" /> Add-ons
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {registration.products.map((p) => (
                                        <span
                                            key={p.id}
                                            className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full"
                                        >
                                            {p.product?.name ?? 'Product'}
                                            {p.variant ? ` (${p.variant})` : ''}
                                            {' '}&times; {p.quantity}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Footer note */}
                        <div className="mt-5 pt-4 border-t text-center">
                            <p className="text-[11px] text-gray-400">
                                Malaysian Takaful Association (MTA) &middot; Please present this ticket (QR code) at the event entrance.
                            </p>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
