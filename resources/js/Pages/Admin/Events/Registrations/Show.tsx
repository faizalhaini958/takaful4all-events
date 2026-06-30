import AdminLayout from '@/Layouts/AdminLayout';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, UserCheck, Clock, Mail, Phone, Building2, Utensils, FileText, Users, Download, Ticket, Receipt, Send, XCircle } from 'lucide-react';
import { type Event, type EventRegistration, type RegistrationStatus, type RegistrationField, fieldAppliesToTicket } from '@/types';
import { getRegistrationStatusLabel } from '@/lib/status-colors';

interface Attendee {
    name: string;
    email: string;
    phone?: string | null;
    company?: string | null;
    job_title?: string | null;
    dietary_requirements?: string | null;
    custom_fields?: Record<string, string> | null;
}

interface Props {
    event: Event;
    registration: EventRegistration;
}

const STATUS_BADGE: Record<RegistrationStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string; color: string }> = {
    pending:           { variant: 'outline',     label: 'Pending',           color: 'text-amber-600' },
    awaiting_payment:  { variant: 'outline',     label: 'Awaiting Payment',  color: 'text-orange-600' },
    confirmed:         { variant: 'default',     label: 'Confirmed',         color: 'text-emerald-600' },
    cancelled:         { variant: 'destructive', label: 'Cancelled',         color: 'text-red-600' },
    waitlisted:        { variant: 'secondary',   label: 'Waitlisted',        color: 'text-gray-600' },
    attended:          { variant: 'default',     label: 'Attended',          color: 'text-blue-600' },
};

export default function RegistrationShow({ event, registration }: Props) {
    const statusCfg = STATUS_BADGE[registration.status];
    const statusLabel = getRegistrationStatusLabel(registration.status, registration.payment_status);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [showReinstateConfirm, setShowReinstateConfirm] = useState(false);
    const [showMarkPaidConfirm, setShowMarkPaidConfirm] = useState(false);
    const [showRevertPendingConfirm, setShowRevertPendingConfirm] = useState(false);
    const [showResendConfirm, setShowResendConfirm] = useState(false);
    const [showApproveConfirm, setShowApproveConfirm] = useState(false);
    const [showCheckInConfirm, setShowCheckInConfirm] = useState(false);

    function updateStatus(status: RegistrationStatus) {
        router.patch(`/admin/events/${event.slug}/registrations/${registration.id}/status`, { status });
    }

    function updatePaymentStatus(payment_status: string) {
        router.patch(`/admin/events/${event.slug}/registrations/${registration.id}/payment-status`, { payment_status });
    }

    function checkIn() {
        router.post(`/admin/events/${event.slug}/registrations/${registration.id}/check-in`);
    }

    function resendConfirmation() {
        router.post(`/admin/events/${event.slug}/registrations/${registration.id}/resend-confirmation`);
    }

    return (
        <AdminLayout>
            <div className="space-y-4 sm:space-y-6 max-w-4xl">
                {/* Header */}
                <div>
                    <div className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground mb-1.5 flex-wrap">
                        <Link href="/admin" className="hover:text-foreground transition-colors">Dashboard</Link>
                        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                        <Link href="/admin/events" className="hover:text-foreground transition-colors">Events</Link>
                        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                        <Link href={`/admin/events/${event.slug}/registrations`} className="hover:text-foreground transition-colors truncate max-w-[180px]">{event.title}</Link>
                        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-foreground font-medium">Detail</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Registration Detail</h1>
                            <p className="text-sm text-muted-foreground font-mono break-all">{registration.reference_no}</p>
                        </div>
                        <Badge variant={statusCfg.variant} className="text-sm px-3 py-1 self-start sm:self-auto">
                            {statusLabel}
                        </Badge>
                    </div>
                </div>

                {/* Back button */}
                <Link href={`/admin/events/${event.slug}/registrations`}>
                    <Button variant="ghost" size="sm" className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground">
                        <ChevronLeft className="w-4 h-4" />
                        Back to Registrations
                    </Button>
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 sm:gap-6">
                    {/* Sidebar — on top for mobile */}
                    <div className="space-y-4 sm:space-y-5 order-1 lg:order-2">
                        {/* Status actions */}
                        <Card>
                            <CardHeader className="pb-2 sm:pb-4"><CardTitle>Actions</CardTitle></CardHeader>
                            <CardContent className="space-y-2 pt-0 sm:pt-0">
                                {['confirmed', 'attended'].includes(registration.status) && (
                                    <Button variant="outline" onClick={() => setShowResendConfirm(true)} className="w-full text-blue-600 border-blue-300 hover:bg-blue-50 hover:text-blue-700">
                                        <Send className="w-4 h-4 mr-1" /> Resend Confirmation Email
                                    </Button>
                                )}
                                {registration.status === 'pending' && (
                                    <Button onClick={() => setShowApproveConfirm(true)} className="w-full bg-emerald-600 hover:bg-emerald-700">
                                        Approve Registration
                                    </Button>
                                )}
                                {registration.status === 'confirmed' && (
                                    <Button onClick={() => setShowCheckInConfirm(true)} className="w-full bg-blue-600 hover:bg-blue-700">
                                        <UserCheck className="w-4 h-4 mr-1" /> Check In
                                    </Button>
                                )}
                                {['pending', 'awaiting_payment', 'confirmed', 'waitlisted'].includes(registration.status) && (
                                    <Button variant="destructive" onClick={() => setShowCancelConfirm(true)} className="w-full">
                                        Cancel Registration
                                    </Button>
                                )}
                                {registration.status === 'cancelled' && (
                                    <Button variant="outline" onClick={() => setShowReinstateConfirm(true)} className="w-full">
                                        Reinstate
                                    </Button>
                                )}
                            </CardContent>
                        </Card>

                        {/* Downloads */}
                        {registration.invoice && (
                            <Card>
                                <CardHeader><CardTitle>Downloads</CardTitle></CardHeader>
                                <CardContent className="space-y-2">
                                    <Button size="sm" variant="outline" className="w-full" asChild>
                                        <a href={route('invoices.download', { invoiceNumber: registration.invoice.invoice_number })}>
                                            <Receipt className="w-3.5 h-3.5 mr-1" /> Invoice PDF
                                        </a>
                                    </Button>
                                </CardContent>
                            </Card>
                        )}

                        {/* Meta */}
                        <Card>
                            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div>
                                    <p className="text-xs text-muted-foreground">Payment Status</p>
                                    <Badge
                                        variant="outline"
                                        className={`mt-0.5 ${registration.payment_status === 'paid' ? 'border-emerald-500 text-emerald-600 bg-emerald-50' : registration.payment_status === 'pending' ? 'border-amber-500 text-amber-600 bg-amber-50' : ''}`}
                                    >
                                        {registration.payment_status.toUpperCase()}
                                    </Badge>
                                    {registration.payment_status === 'pending' && (
                                        <Button
                                            size="sm"
                                            onClick={() => setShowMarkPaidConfirm(true)}
                                            className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 h-8 text-xs"
                                        >
                                            Mark as Paid
                                        </Button>
                                    )}
                                    {registration.payment_status === 'paid' && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setShowRevertPendingConfirm(true)}
                                            className="w-full mt-2 h-8 text-xs text-amber-600 border-amber-300 hover:bg-amber-50"
                                        >
                                            Revert to Pending
                                        </Button>
                                    )}
                                </div>
                                {registration.payment_method && (
                                    <div>
                                        <p className="text-xs text-muted-foreground">Payment Method</p>
                                        <p className="font-medium">{registration.payment_method}</p>
                                    </div>
                                )}
                                {registration.payment_reference && (
                                    <div>
                                        <p className="text-xs text-muted-foreground">Payment Reference</p>
                                        <p className="font-mono text-xs">{registration.payment_reference}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-xs text-muted-foreground">Registered At</p>
                                    <p className="font-medium flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {new Date(registration.created_at).toLocaleString('en-MY')}
                                    </p>
                                </div>
                                {registration.checked_in_at && (
                                    <div>
                                        <p className="text-xs text-muted-foreground">Checked In At</p>
                                        <p className="font-medium flex items-center gap-1 text-emerald-600">
                                            <UserCheck className="w-3 h-3" />
                                            {new Date(registration.checked_in_at).toLocaleString('en-MY')}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Info — below sidebar on mobile */}
                    <div className="space-y-4 sm:space-y-6 order-2 lg:order-1">
                        {/* Attendee Info */}
                        <Card>
                            <CardHeader className="pb-2 sm:pb-4">
                                <CardTitle>
                                    {registration.quantity > 1 ? 'Attendee 1 (Primary Buyer)' : 'Attendee Information'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 pt-0 sm:pt-0">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-0.5">Full Name</p>
                                        <p className="font-medium text-sm sm:text-base">{registration.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1"><Mail className="w-3 h-3" /> Email</p>
                                        <p className="font-medium text-sm sm:text-base break-all">{registration.email}</p>
                                    </div>
                                    {registration.phone && (
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</p>
                                            <p className="font-medium text-sm sm:text-base">{registration.phone}</p>
                                        </div>
                                    )}
                                    {registration.company && (
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1"><Building2 className="w-3 h-3" /> Company</p>
                                            <p className="font-medium text-sm sm:text-base">{registration.company}</p>
                                        </div>
                                    )}
                                    {registration.job_title && (
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-0.5">Job Title</p>
                                            <p className="font-medium text-sm sm:text-base">{registration.job_title}</p>
                                        </div>
                                    )}
                                    {registration.dietary_requirements && (
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1"><Utensils className="w-3 h-3" /> Dietary</p>
                                            <p className="font-medium text-sm sm:text-base">{registration.dietary_requirements}</p>
                                        </div>
                                    )}
                                    {event.registration_fields && (() => {
                                        const cf = (registration.meta_json as { custom_fields?: Record<string, string> })?.custom_fields;
                                        if (!cf) return null;
                                        const ticketName = (registration as any).ticket?.name ?? null;
                                        return event.registration_fields!
                                            .filter(f => !['name', 'email', 'phone'].includes(f.key))
                                            .filter(f => fieldAppliesToTicket(f, ticketName))
                                            .sort((a, b) => a.sort_order - b.sort_order)
                                            .filter(f => cf[f.key] !== undefined && cf[f.key] !== '' && cf[f.key] !== 'false')
                                            .map(f => (
                                                <div key={f.key}>
                                                    <p className="text-xs text-muted-foreground mb-0.5">{f.label_en}</p>
                                                    <p className="font-medium text-sm sm:text-base">
                                                        {f.type === 'checkbox' ? '✓ Yes' : cf[f.key]}
                                                    </p>
                                                </div>
                                            ));
                                    })()}
                                </div>
                                {registration.notes && (
                                    <div className="pt-2 border-t">
                                        <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1"><FileText className="w-3 h-3" /> Notes</p>
                                        <p className="text-sm">{registration.notes}</p>
                                    </div>
                                )}
                                <div className="pt-2 border-t flex gap-2">
                                    <Button size="sm" variant="outline" asChild>
                                        <a href={route('tickets.download', { registration: registration.id, attendee_no: 1 })}>
                                            <Download className="w-3.5 h-3.5 mr-1" /> Ticket PDF
                                        </a>
                                    </Button>
                                    <Button size="sm" variant="outline" asChild>
                                        <a href={route('tickets.download', { registration: registration.id, attendee_no: 1, inline: 1 })} target="_blank">
                                            <Ticket className="w-3.5 h-3.5 mr-1" /> Preview
                                        </a>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Additional Attendees */}
                        {registration.quantity > 1 && (registration.meta_json as { attendees?: Attendee[] })?.attendees?.map((attendee, index) => (
                            <Card key={index}>
                                <CardHeader className="pb-2 sm:pb-4">
                                    <CardTitle className="flex items-center gap-2">
                                        <Users className="w-5 h-5 text-brand" />
                                        Attendee {index + 2}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0 sm:pt-0">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-0.5">Full Name</p>
                                            <p className="font-medium text-sm sm:text-base">{attendee.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1"><Mail className="w-3 h-3" /> Email</p>
                                            <p className="font-medium text-sm sm:text-base break-all">{attendee.email}</p>
                                        </div>
                                        {attendee.phone && (
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</p>
                                                <p className="font-medium text-sm sm:text-base">{attendee.phone}</p>
                                            </div>
                                        )}
                                        {attendee.company && (
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1"><Building2 className="w-3 h-3" /> Company</p>
                                                <p className="font-medium text-sm sm:text-base">{attendee.company}</p>
                                            </div>
                                        )}
                                        {attendee.job_title && (
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-0.5">Job Title</p>
                                                <p className="font-medium text-sm sm:text-base">{attendee.job_title}</p>
                                            </div>
                                        )}
                                        {attendee.dietary_requirements && (
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1"><Utensils className="w-3 h-3" /> Dietary</p>
                                                <p className="font-medium text-sm sm:text-base">{attendee.dietary_requirements}</p>
                                            </div>
                                        )}
                                        {event.registration_fields && attendee.custom_fields && (() => {
                                            const ticketName = (registration as any).ticket?.name ?? null;
                                            return event.registration_fields
                                                .filter(f => !['name', 'email', 'phone'].includes(f.key))
                                                .filter(f => fieldAppliesToTicket(f, ticketName))
                                                .sort((a, b) => a.sort_order - b.sort_order)
                                                .filter(f => attendee.custom_fields![f.key] !== undefined && attendee.custom_fields![f.key] !== '' && attendee.custom_fields![f.key] !== 'false')
                                                .map(f => (
                                                    <div key={f.key}>
                                                        <p className="text-xs text-muted-foreground mb-0.5">{f.label_en}</p>
                                                        <p className="font-medium text-sm sm:text-base">
                                                            {f.type === 'checkbox' ? '✓ Yes' : attendee.custom_fields![f.key]}
                                                        </p>
                                                    </div>
                                                ));
                                        })()}
                                    </div>
                                    <div className="pt-2 border-t flex gap-2">
                                        <Button size="sm" variant="outline" asChild>
                                            <a href={route('tickets.download', { registration: registration.id, attendee_no: index + 2 })}>
                                                <Download className="w-3.5 h-3.5 mr-1" /> Ticket PDF
                                            </a>
                                        </Button>
                                        <Button size="sm" variant="outline" asChild>
                                            <a href={route('tickets.download', { registration: registration.id, attendee_no: index + 2, inline: 1 })} target="_blank">
                                                <Ticket className="w-3.5 h-3.5 mr-1" /> Preview
                                            </a>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {/* Order Summary */}
                        <Card>
                            <CardHeader className="pb-2 sm:pb-4"><CardTitle>Order Summary</CardTitle></CardHeader>
                            <CardContent className="pt-0 sm:pt-0">
                                <div className="border rounded-lg overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted">
                                            <tr>
                                                <th className="px-3 sm:px-4 py-2 text-left font-medium">Item</th>
                                                <th className="px-3 sm:px-4 py-2 text-center font-medium">Qty</th>
                                                <th className="px-3 sm:px-4 py-2 text-right font-medium">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="border-t">
                                                <td className="px-3 sm:px-4 py-2">
                                                    <span className="font-medium">{registration.ticket?.name}</span>
                                                    <span className="text-muted-foreground ml-1 text-xs">
                                                        ({registration.ticket?.type === 'paid'
                                                            ? `RM ${Number(registration.ticket.price).toFixed(2)} each`
                                                            : 'Free'})
                                                    </span>
                                                </td>
                                                <td className="px-3 sm:px-4 py-2 text-center">{registration.quantity}</td>
                                                <td className="px-3 sm:px-4 py-2 text-right">RM {Number(registration.subtotal).toFixed(2)}</td>
                                            </tr>
                                            {registration.products?.map(p => (
                                                <tr key={p.id} className="border-t">
                                                    <td className="px-3 sm:px-4 py-2">
                                                        <span className="font-medium">{p.product?.name}</span>
                                                        {p.variant && <span className="text-muted-foreground ml-1 text-xs">({p.variant})</span>}
                                                    </td>
                                                    <td className="px-3 sm:px-4 py-2 text-center">{p.quantity}</td>
                                                    <td className="px-3 sm:px-4 py-2 text-right">RM {(Number(p.unit_price) * p.quantity).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="border-t bg-muted/50">
                                            <tr>
                                                <td colSpan={2} className="px-3 sm:px-4 py-2 font-bold">Total</td>
                                                <td className="px-3 sm:px-4 py-2 text-right font-bold">RM {Number(registration.total_amount).toFixed(2)}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
            {/* Cancel confirmation */}
            <Dialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cancel Registration</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to cancel registration "{registration.reference_no}" for {registration.name}?
                            {registration.total_amount > 0 && ' This will also restore product stock.'}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCancelConfirm(false)}>Keep</Button>
                        <Button variant="destructive" onClick={() => { updateStatus('cancelled'); setShowCancelConfirm(false); }}>
                            <XCircle className="w-3.5 h-3.5 mr-1.5" /> Cancel Registration
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Reinstate confirmation */}
            <Dialog open={showReinstateConfirm} onOpenChange={setShowReinstateConfirm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reinstate Registration</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to reinstate registration "{registration.reference_no}" for {registration.name}?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowReinstateConfirm(false)}>Cancel</Button>
                        <Button onClick={() => { updateStatus('confirmed'); setShowReinstateConfirm(false); }}>
                            Reinstate
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Mark as Paid confirmation */}
            <Dialog open={showMarkPaidConfirm} onOpenChange={setShowMarkPaidConfirm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Mark as Paid</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to mark registration "{registration.reference_no}" as paid?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowMarkPaidConfirm(false)}>Cancel</Button>
                        <Button onClick={() => { updatePaymentStatus('paid'); setShowMarkPaidConfirm(false); }}>
                            Mark as Paid
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Revert to Pending confirmation */}
            <Dialog open={showRevertPendingConfirm} onOpenChange={setShowRevertPendingConfirm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Revert to Pending</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to revert payment status for registration "{registration.reference_no}" back to pending?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRevertPendingConfirm(false)}>Cancel</Button>
                        <Button onClick={() => { updatePaymentStatus('pending'); setShowRevertPendingConfirm(false); }}>
                            Revert to Pending
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Resend confirmation */}
            <Dialog open={showResendConfirm} onOpenChange={setShowResendConfirm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Resend Confirmation Email</DialogTitle>
                        <DialogDescription>
                            Resend the confirmation email to {registration.name} ({registration.email})?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowResendConfirm(false)}>Cancel</Button>
                        <Button onClick={() => { resendConfirmation(); setShowResendConfirm(false); }}>
                            <Send className="w-3.5 h-3.5 mr-1.5" /> Resend Email
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Approve confirmation */}
            <Dialog open={showApproveConfirm} onOpenChange={setShowApproveConfirm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Approve Registration</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to approve registration "{registration.reference_no}" for {registration.name}?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowApproveConfirm(false)}>Cancel</Button>
                        <Button onClick={() => { updateStatus('confirmed'); setShowApproveConfirm(false); }}>
                            Approve
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Check-in confirmation */}
            <Dialog open={showCheckInConfirm} onOpenChange={setShowCheckInConfirm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Check In Attendee</DialogTitle>
                        <DialogDescription>
                            Mark {registration.name} ({registration.reference_no}) as <strong>attended</strong>?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCheckInConfirm(false)}>Cancel</Button>
                        <Button onClick={() => { checkIn(); setShowCheckInConfirm(false); }}>
                            <UserCheck className="w-3.5 h-3.5 mr-1.5" /> Confirm Check-in
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
