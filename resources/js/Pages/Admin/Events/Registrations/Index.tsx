import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/Components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Separator } from '@/Components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Users, Eye, Trash2, CheckCircle, CheckCircle2, XCircle, Clock, UserCheck, AlertCircle, DollarSign, Mail, Phone, Building2, Utensils, FileText, CalendarDays, CreditCard, Hash, ExternalLink } from 'lucide-react';
import { type Event, type EventRegistration, type RegistrationStats, type PaginatedData, type RegistrationStatus } from '@/types';

interface Props {
    event: Event;
    registrations: PaginatedData<EventRegistration>;
    stats: RegistrationStats;
    currentStatus: string;
}

const STATUS_PILL: Record<string, { class: string; label: string }> = {
    pending:    { class: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',   label: 'Pending' },
    confirmed:  { class: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30', label: 'Confirmed' },
    attended:   { class: 'bg-primary/15 text-primary border-primary/30',                              label: 'Attended' },
    cancelled:  { class: 'bg-destructive/15 text-destructive border-destructive/30',                  label: 'Cancelled' },
    waitlisted: { class: 'bg-muted text-muted-foreground border-muted-foreground/20',                 label: 'Waitlisted' },
};

const PAYMENT_PILL: Record<string, { class: string; label: string }> = {
    na:       { class: 'bg-muted text-muted-foreground border-border',                              label: 'N/A' },
    pending:  { class: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',   label: 'Pending' },
    paid:     { class: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30', label: 'Paid' },
    refunded: { class: 'bg-destructive/15 text-destructive border-destructive/30',                  label: 'Refunded' },
};

const STAT_CARDS = [
    { key: 'total',      label: 'Total',      icon: Users,       accent: 'text-primary',                              iconBg: 'bg-primary/10',          border: 'hover:border-primary/50' },
    { key: 'confirmed',  label: 'Confirmed',  icon: CheckCircle2, accent: 'text-emerald-600 dark:text-emerald-400',    iconBg: 'bg-emerald-500/10',      border: 'hover:border-emerald-500/50' },
    { key: 'pending',    label: 'Pending',    icon: Clock,       accent: 'text-amber-600 dark:text-amber-400',          iconBg: 'bg-amber-500/10',        border: 'hover:border-amber-500/50' },
    { key: 'attended',   label: 'Attended',   icon: UserCheck,   accent: 'text-sky-600 dark:text-sky-400',              iconBg: 'bg-sky-500/10',          border: 'hover:border-sky-500/50' },
    { key: 'cancelled',  label: 'Cancelled',  icon: XCircle,     accent: 'text-destructive',                            iconBg: 'bg-destructive/10',      border: 'hover:border-destructive/50' },
    { key: 'waitlisted', label: 'Waitlisted', icon: AlertCircle, accent: 'text-muted-foreground',                       iconBg: 'bg-muted',               border: 'hover:border-muted-foreground/50' },
] as const;

const FILTERS = [
    { value: 'all',        label: 'All' },
    { value: 'pending',    label: 'Pending' },
    { value: 'confirmed',  label: 'Confirmed' },
    { value: 'attended',   label: 'Attended' },
    { value: 'cancelled',  label: 'Cancelled' },
    { value: 'waitlisted', label: 'Waitlisted' },
];

export default function RegistrationIndex({ event, registrations, stats, currentStatus }: Props) {
    const [deleteTarget, setDeleteTarget] = useState<EventRegistration | null>(null);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [viewReg, setViewReg] = useState<EventRegistration | null>(null);

    function handleFilter(status: string) {
        router.get(`/admin/events/${event.slug}/registrations`, status !== 'all' ? { status } : {}, { preserveScroll: true });
    }

    function toggleSelect(id: number) {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    }

    function toggleSelectAll() {
        if (selectedIds.length === registrations.data.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(registrations.data.map(r => r.id));
        }
    }

    function bulkUpdate(status: RegistrationStatus) {
        if (selectedIds.length === 0) return;
        router.post(`/admin/events/${event.slug}/registrations/bulk-status`, {
            ids: selectedIds,
            status,
        }, {
            onSuccess: () => setSelectedIds([]),
        });
    }

    function quickStatusUpdate(registration: EventRegistration, status: RegistrationStatus) {
        router.patch(`/admin/events/${event.slug}/registrations/${registration.id}/status`, { status });
    }

    function checkIn(registration: EventRegistration) {
        router.post(`/admin/events/${event.slug}/registrations/${registration.id}/check-in`);
    }

    function confirmDelete() {
        if (!deleteTarget) return;
        router.delete(`/admin/events/${event.slug}/registrations/${deleteTarget.id}`, {
            onFinish: () => setDeleteTarget(null),
        });
    }

    const prevPage = registrations.links.find(l => l.label.includes('Previous'));
    const nextPage = registrations.links.find(l => l.label.includes('Next'));

    return (
        <AdminLayout>
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <Link href="/admin/events" className="text-muted-foreground hover:text-foreground transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Registrations</h1>
                        <p className="text-sm text-muted-foreground">{event.title}</p>
                    </div>
                </div>

                {/* Stats cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {STAT_CARDS.map(card => {
                        const Icon = card.icon;
                        const value = stats[card.key as keyof RegistrationStats];
                        const isActive = currentStatus === card.key || (card.key === 'total' && currentStatus === 'all');
                        return (
                            <button
                                key={card.key}
                                onClick={() => handleFilter(card.key === 'total' ? 'all' : card.key)}
                                className={`group rounded-xl border p-4 text-left transition-all ${card.border} ${
                                    isActive ? 'ring-2 ring-primary/30 border-primary/40' : 'border-border/60'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <span className={`text-[11px] font-semibold uppercase tracking-wider ${card.accent}`}>{card.label}</span>
                                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${card.iconBg}`}>
                                        <Icon className={`w-4 h-4 ${card.accent}`} />
                                    </div>
                                </div>
                                <p className="text-3xl font-bold tabular-nums text-foreground">{value}</p>
                            </button>
                        );
                    })}
                    {/* Revenue card */}
                    <div className="col-span-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Revenue</span>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                                <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                        </div>
                        <p className="text-3xl font-bold tabular-nums text-foreground">
                            <span className="text-lg font-semibold text-muted-foreground mr-1">RM</span>
                            {Number(stats.revenue).toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>

                {/* Filters & Bulk */}
                <div className="flex flex-wrap items-center gap-2">
                    {FILTERS.map(f => (
                        <button
                            key={f.value}
                            onClick={() => handleFilter(f.value)}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                                currentStatus === f.value
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : 'bg-card text-foreground border-border/60 hover:border-primary/50'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}

                    {selectedIds.length > 0 && (
                        <div className="ml-auto flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground font-medium">{selectedIds.length} selected</span>
                            <Button size="sm" variant="outline" onClick={() => bulkUpdate('confirmed')} className="h-7">
                                <CheckCircle className="w-3.5 h-3.5 mr-1" /> Confirm
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => bulkUpdate('cancelled')} className="h-7">
                                <XCircle className="w-3.5 h-3.5 mr-1" /> Cancel
                            </Button>
                        </div>
                    )}
                </div>

                {/* Table */}
                <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b border-border/60 bg-muted/40 hover:bg-muted/40">
                                <TableHead className="w-10">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.length === registrations.data.length && registrations.data.length > 0}
                                        onChange={toggleSelectAll}
                                        className="rounded border-border"
                                    />
                                </TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ref</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Participant</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ticket</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Qty</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Total</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground w-28"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {registrations.data.map(reg => {
                                const pill = STATUS_PILL[reg.status] ?? STATUS_PILL.pending;
                                return (
                                    <TableRow key={reg.id}>
                                        <TableCell>
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(reg.id)}
                                                onChange={() => toggleSelect(reg.id)}
                                                className="rounded border-border"
                                            />
                                        </TableCell>
                                        <TableCell className="font-mono text-xs text-muted-foreground">{reg.reference_no}</TableCell>
                                        <TableCell>
                                            <div className="font-medium text-foreground">{reg.name}</div>
                                            <div className="text-xs text-muted-foreground">{reg.email}</div>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{reg.ticket?.name ?? '—'}</TableCell>
                                        <TableCell className="text-center tabular-nums">{reg.quantity}</TableCell>
                                        <TableCell className="text-right font-semibold tabular-nums">
                                            {Number(reg.total_amount) > 0
                                                ? `RM ${Number(reg.total_amount).toFixed(2)}`
                                                : <span className="text-muted-foreground font-normal">Free</span>}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${pill.class}`}>
                                                {pill.label}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-end gap-0.5">
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => setViewReg(reg)} title="View details">
                                                    <Eye className="w-3.5 h-3.5" />
                                                </Button>
                                                {reg.status === 'confirmed' && (
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:text-primary/80" onClick={() => checkIn(reg)} title="Check in">
                                                        <UserCheck className="w-3.5 h-3.5" />
                                                    </Button>
                                                )}
                                                {reg.status === 'pending' && (
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600 hover:text-emerald-500" onClick={() => quickStatusUpdate(reg, 'confirmed')} title="Approve">
                                                        <CheckCircle className="w-3.5 h-3.5" />
                                                    </Button>
                                                )}
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setDeleteTarget(reg)} title="Delete">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {registrations.data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-16 text-muted-foreground">
                                        <Users className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                        <p className="text-sm">No registrations found.</p>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card px-4 py-3 shadow-sm">
                    <span className="text-sm text-muted-foreground">
                        Showing <span className="font-medium text-foreground">{registrations.from ?? 0}</span> to <span className="font-medium text-foreground">{registrations.to ?? 0}</span> of <span className="font-medium text-foreground">{registrations.total}</span>
                    </span>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">
                            Page <span className="font-medium text-foreground">{registrations.current_page}</span> of <span className="font-medium text-foreground">{registrations.last_page}</span>
                        </span>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" asChild disabled={!prevPage?.url}>
                                <Link href={prevPage?.url ?? '#'} preserveState preserveScroll>
                                    <ChevronLeft className="h-4 w-4" />
                                </Link>
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" asChild disabled={!nextPage?.url}>
                                <Link href={nextPage?.url ?? '#'} preserveState preserveScroll>
                                    <ChevronRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Registration Detail Modal */}
            <RegistrationDetailModal
                event={event}
                registration={viewReg}
                onClose={() => setViewReg(null)}
            />

            {/* Delete confirmation */}
            <Dialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Registration</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete registration "{deleteTarget?.reference_no}" for {deleteTarget?.name}?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}

/* ─── Registration Detail Modal ─── */

function RegistrationDetailModal({
    event,
    registration: reg,
    onClose,
}: {
    event: Event;
    registration: EventRegistration | null;
    onClose: () => void;
}) {
    if (!reg) return null;

    const statusPill = STATUS_PILL[reg.status] ?? STATUS_PILL.pending;
    const paymentPill = PAYMENT_PILL[reg.payment_status] ?? PAYMENT_PILL.na;

    function updateStatus(status: string) {
        router.patch(`/admin/events/${event.slug}/registrations/${reg!.id}/status`, { status }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => onClose(),
        });
    }

    function checkIn() {
        router.post(`/admin/events/${event.slug}/registrations/${reg!.id}/check-in`, {}, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => onClose(),
        });
    }

    return (
        <Dialog open={!!reg} onOpenChange={open => !open && onClose()}>
            <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto p-0">
                {/* Header */}
                <div className="px-6 pt-6 pb-4">
                    <div className="flex items-start justify-between gap-4">
                        <DialogHeader className="space-y-1">
                            <DialogTitle className="text-xl font-bold text-foreground">Registration Details</DialogTitle>
                            <p className="font-mono text-sm text-muted-foreground">{reg.reference_no}</p>
                        </DialogHeader>
                        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold shrink-0 ${statusPill.class}`}>
                            {statusPill.label}
                        </span>
                    </div>
                </div>

                <Separator />

                <div className="px-6 py-5 space-y-5">
                    {/* Attendee Info */}
                    <div>
                        <h4 className="text-[11px] font-bold uppercase text-primary tracking-widest mb-3">Attendee Information</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <InfoField icon={<Users className="w-3.5 h-3.5" />} label="Full Name" value={reg.name} />
                            <InfoField icon={<Mail className="w-3.5 h-3.5" />} label="Email" value={reg.email} />
                            {reg.phone && <InfoField icon={<Phone className="w-3.5 h-3.5" />} label="Phone" value={reg.phone} />}
                            {reg.company && <InfoField icon={<Building2 className="w-3.5 h-3.5" />} label="Company" value={reg.company} />}
                            {reg.job_title && <InfoField label="Job Title" value={reg.job_title} />}
                            {reg.dietary_requirements && <InfoField icon={<Utensils className="w-3.5 h-3.5" />} label="Dietary" value={reg.dietary_requirements} />}
                        </div>
                        {reg.notes && (
                            <div className="mt-3 rounded-lg border border-border/60 bg-muted/30 p-3">
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                                    <FileText className="w-3 h-3" /> Notes
                                </div>
                                <p className="text-sm text-foreground">{reg.notes}</p>
                            </div>
                        )}
                    </div>

                    <Separator className="bg-border/50" />

                    {/* Order Summary */}
                    <div>
                        <h4 className="text-[11px] font-bold uppercase text-primary tracking-widest mb-3">Order Summary</h4>
                        <div className="rounded-lg border border-border/60 overflow-hidden">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-muted/50">
                                        <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Item</th>
                                        <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Qty</th>
                                        <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-t border-border/40">
                                        <td className="px-4 py-2.5">
                                            <span className="font-medium text-foreground">{reg.ticket?.name}</span>
                                            <span className="text-muted-foreground ml-1.5 text-xs">
                                                ({reg.ticket?.type === 'paid'
                                                    ? `RM ${Number(reg.ticket.price).toFixed(2)} each`
                                                    : 'Free'})
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5 text-center tabular-nums">{reg.quantity}</td>
                                        <td className="px-4 py-2.5 text-right tabular-nums font-medium">RM {Number(reg.subtotal).toFixed(2)}</td>
                                    </tr>
                                    {reg.products?.map(p => (
                                        <tr key={p.id} className="border-t border-border/40">
                                            <td className="px-4 py-2.5">
                                                <span className="font-medium text-foreground">{p.product?.name}</span>
                                                {p.variant && <span className="text-muted-foreground ml-1.5 text-xs">({p.variant})</span>}
                                            </td>
                                            <td className="px-4 py-2.5 text-center tabular-nums">{p.quantity}</td>
                                            <td className="px-4 py-2.5 text-right tabular-nums font-medium">RM {(Number(p.unit_price) * p.quantity).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t border-border/60 bg-primary/5">
                                        <td colSpan={2} className="px-4 py-2.5 font-bold text-foreground">Total</td>
                                        <td className="px-4 py-2.5 text-right font-bold text-foreground tabular-nums">RM {Number(reg.total_amount).toFixed(2)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    <Separator className="bg-border/50" />

                    {/* Payment & Details */}
                    <div>
                        <h4 className="text-[11px] font-bold uppercase text-primary tracking-widest mb-3">Payment & Details</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Payment Status</p>
                                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${paymentPill.class}`}>
                                    {paymentPill.label}
                                </span>
                            </div>
                            {reg.payment_method && (
                                <InfoField icon={<CreditCard className="w-3.5 h-3.5" />} label="Payment Method" value={reg.payment_method} />
                            )}
                            {reg.payment_reference && (
                                <InfoField icon={<Hash className="w-3.5 h-3.5" />} label="Payment Reference" value={reg.payment_reference} mono />
                            )}
                            <InfoField icon={<CalendarDays className="w-3.5 h-3.5" />} label="Registered At" value={new Date(reg.created_at).toLocaleString('en-MY')} />
                            {reg.checked_in_at && (
                                <div>
                                    <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1"><UserCheck className="w-3 h-3" /> Checked In At</p>
                                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                        {new Date(reg.checked_in_at).toLocaleString('en-MY')}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Footer Actions */}
                <div className="px-6 py-4 flex items-center justify-between gap-3">
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/events/${event.slug}/registrations/${reg.id}`}>
                            <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Full Details
                        </Link>
                    </Button>
                    <div className="flex items-center gap-2">
                        {reg.status === 'pending' && (
                            <Button size="sm" onClick={() => updateStatus('confirmed')} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Approve
                            </Button>
                        )}
                        {reg.status === 'confirmed' && (
                            <Button size="sm" onClick={checkIn} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                                <UserCheck className="w-3.5 h-3.5 mr-1.5" /> Check In
                            </Button>
                        )}
                        {['pending', 'confirmed', 'waitlisted'].includes(reg.status) && (
                            <Button size="sm" variant="destructive" onClick={() => updateStatus('cancelled')}>
                                <XCircle className="w-3.5 h-3.5 mr-1.5" /> Cancel
                            </Button>
                        )}
                        {reg.status === 'cancelled' && (
                            <Button size="sm" variant="outline" onClick={() => updateStatus('confirmed')}>
                                Reinstate
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

/* ─── Info field helper ─── */

function InfoField({ icon, label, value, mono }: { icon?: React.ReactNode; label: string; value: string; mono?: boolean }) {
    return (
        <div>
            <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
                {icon} {label}
            </p>
            <p className={`text-sm font-medium text-foreground ${mono ? 'font-mono text-xs' : ''}`}>{value}</p>
        </div>
    );
}
