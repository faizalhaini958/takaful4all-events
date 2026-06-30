import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/Components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Separator } from '@/Components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Users, Users2, Eye, Trash2, CheckCircle, CheckCircle2, XCircle, Clock, UserCheck, AlertCircle, DollarSign, Mail, Phone, Building2, Utensils, FileText, CalendarDays, CreditCard, Hash, ExternalLink, Download, Receipt, Send } from 'lucide-react';
import { type Event, type EventRegistration, type RegistrationStats, type PaginatedData, type RegistrationStatus } from '@/types';
import { getRegistrationStatusLabel } from '@/lib/status-colors';

interface Props {
    event: Event;
    registrations: PaginatedData<EventRegistration>;
    stats: RegistrationStats;
    currentStatus: string;
}

const STATUS_PILL: Record<string, { class: string; label: string }> = {
    pending:           { class: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',   label: 'Pending' },
    awaiting_payment:  { class: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30',   label: 'Awaiting Payment' },
    confirmed:         { class: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30', label: 'Confirmed' },
    attended:          { class: 'bg-primary/15 text-primary border-primary/30',                              label: 'Attended' },
    cancelled:         { class: 'bg-destructive/15 text-destructive border-destructive/30',                  label: 'Cancelled' },
    waitlisted:        { class: 'bg-muted text-muted-foreground border-muted-foreground/20',                 label: 'Waitlisted' },
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
    { key: 'awaiting_payment', label: 'Awaiting Payment', icon: Clock, accent: 'text-orange-600 dark:text-orange-400', iconBg: 'bg-orange-500/10', border: 'hover:border-orange-500/50' },
    { key: 'attended',   label: 'Attended',   icon: UserCheck,   accent: 'text-sky-600 dark:text-sky-400',              iconBg: 'bg-sky-500/10',          border: 'hover:border-sky-500/50' },
    { key: 'cancelled',  label: 'Cancelled',  icon: XCircle,     accent: 'text-destructive',                            iconBg: 'bg-destructive/10',      border: 'hover:border-destructive/50' },
    { key: 'waitlisted', label: 'Waitlisted', icon: AlertCircle, accent: 'text-muted-foreground',                       iconBg: 'bg-muted',               border: 'hover:border-muted-foreground/50' },
] as const;

const FILTERS = [
    { value: 'all',        label: 'All' },
    { value: 'pending',    label: 'Pending' },
    { value: 'awaiting_payment', label: 'Awaiting Payment' },
    { value: 'confirmed',  label: 'Confirmed' },
    { value: 'attended',   label: 'Attended' },
    { value: 'cancelled',  label: 'Cancelled' },
    { value: 'waitlisted', label: 'Waitlisted' },
];

export default function RegistrationIndex({ event, registrations, stats, currentStatus }: Props) {
    const [deleteTarget, setDeleteTarget] = useState<EventRegistration | null>(null);
    const [checkInTarget, setCheckInTarget] = useState<EventRegistration | null>(null);
    const [resendTarget, setResendTarget] = useState<EventRegistration | null>(null);
    const [cancelTarget, setCancelTarget] = useState<EventRegistration | null>(null);
    const [reinstateTarget, setReinstateTarget] = useState<EventRegistration | null>(null);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [viewReg, setViewReg] = useState<EventRegistration | null>(null);
    const [bulkAction, setBulkAction] = useState<string>('');

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
            onSuccess: () => { setSelectedIds([]); setBulkAction(''); },
        });
    }

    function bulkDelete() {
        if (selectedIds.length === 0) return;
        router.delete(`/admin/events/${event.slug}/registrations/bulk`, {
            data: { ids: selectedIds },
            onSuccess: () => { setSelectedIds([]); setBulkAction(''); },
        });
    }

    function applyBulkAction() {
        if (!bulkAction || selectedIds.length === 0) return;
        if (bulkAction === 'delete') {
            bulkDelete();
        } else {
            bulkUpdate(bulkAction as RegistrationStatus);
        }
    }

    function quickStatusUpdate(registration: EventRegistration, status: RegistrationStatus) {
        router.patch(`/admin/events/${event.slug}/registrations/${registration.id}/status`, { status });
    }

    function checkIn(registration: EventRegistration) {
        setCheckInTarget(registration);
    }

    function confirmCheckIn() {
        if (!checkInTarget) return;
        router.post(`/admin/events/${event.slug}/registrations/${checkInTarget.id}/check-in`, {}, {
            onFinish: () => setCheckInTarget(null),
        });
    }

    function resendConfirmation(registration: EventRegistration) {
        setResendTarget(registration);
    }

    function confirmResend() {
        if (!resendTarget) return;
        router.post(`/admin/events/${event.slug}/registrations/${resendTarget.id}/resend-confirmation`, {}, {
            onFinish: () => setResendTarget(null),
        });
    }

    function confirmDelete() {
        if (!deleteTarget) return;
        router.delete(`/admin/events/${event.slug}/registrations/${deleteTarget.id}`, {
            onFinish: () => setDeleteTarget(null),
        });
    }

    function confirmCancel() {
        if (!cancelTarget) return;
        router.patch(`/admin/events/${event.slug}/registrations/${cancelTarget.id}/status`, { status: 'cancelled' }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => setViewReg(null),
            onFinish: () => setCancelTarget(null),
        });
    }

    function confirmReinstate() {
        if (!reinstateTarget) return;
        router.patch(`/admin/events/${event.slug}/registrations/${reinstateTarget.id}/status`, { status: 'confirmed' }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => setViewReg(null),
            onFinish: () => setReinstateTarget(null),
        });
    }

    const prevPage = registrations.links.find(l => l.label.includes('Previous'));
    const nextPage = registrations.links.find(l => l.label.includes('Next'));

    return (
        <AdminLayout>
            <div className="space-y-4">
                {/* Header */}
                <div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1.5 flex-wrap">
                        <Link href="/admin" className="hover:text-foreground transition-colors">Dashboard</Link>
                        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                        <Link href="/admin/events" className="hover:text-foreground transition-colors">Events</Link>
                        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-foreground font-medium truncate max-w-[180px]">{event.title}</span>
                        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-foreground font-medium">Registrations</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-foreground">Registrations</h1>
                            <p className="text-sm text-muted-foreground">{event.title}</p>
                        </div>
                        <Link href={`/admin/events/${event.slug}/participants`}>
                            <Button variant="outline" size="sm" className="gap-1.5">
                                <Users2 className="w-4 h-4" />
                                Participants
                            </Button>
                        </Link>
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
                        <div className="ml-auto flex items-center gap-2">
                            <span className="text-sm text-muted-foreground font-medium">
                                {selectedIds.length} selected
                            </span>
                            <Select value={bulkAction} onValueChange={setBulkAction}>
                                <SelectTrigger className="h-8 w-48 text-xs">
                                    <SelectValue placeholder="Select action…" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="confirmed">
                                        <span className="flex items-center gap-2">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                            <span className="text-emerald-700 dark:text-emerald-400 font-medium">Confirm</span>
                                        </span>
                                    </SelectItem>
                                    <SelectItem value="attended">
                                        <span className="flex items-center gap-2">
                                            <UserCheck className="w-3.5 h-3.5 text-sky-500" />
                                            <span className="text-sky-700 dark:text-sky-400 font-medium">Mark as Attended</span>
                                        </span>
                                    </SelectItem>
                                    <SelectItem value="pending">
                                        <span className="flex items-center gap-2">
                                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                                            <span className="text-amber-700 dark:text-amber-400 font-medium">Set to Pending</span>
                                        </span>
                                    </SelectItem>
                                    <SelectItem value="awaiting_payment">
                                        <span className="flex items-center gap-2">
                                            <Clock className="w-3.5 h-3.5 text-orange-500" />
                                            <span className="text-orange-700 dark:text-orange-400 font-medium">Set to Awaiting Payment</span>
                                        </span>
                                    </SelectItem>
                                    <SelectItem value="waitlisted">
                                        <span className="flex items-center gap-2">
                                            <AlertCircle className="w-3.5 h-3.5 text-muted-foreground" />
                                            <span className="text-muted-foreground font-medium">Waitlist</span>
                                        </span>
                                    </SelectItem>
                                    <SelectItem value="cancelled">
                                        <span className="flex items-center gap-2">
                                            <XCircle className="w-3.5 h-3.5 text-destructive" />
                                            <span className="text-destructive font-medium">Cancel</span>
                                        </span>
                                    </SelectItem>
                                    <SelectSeparator />
                                    <SelectItem value="delete">
                                        <span className="flex items-center gap-2">
                                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                            <span className="text-destructive font-medium">Delete</span>
                                        </span>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <Button
                                size="sm"
                                className="h-8"
                                disabled={!bulkAction}
                                onClick={applyBulkAction}
                            >
                                Apply
                            </Button>
                        </div>
                    )}
                </div>

                {/* Table */}
                <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-x-auto">
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
                                const statusLabel = getRegistrationStatusLabel(reg.status, reg.payment_status);
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
                                                {statusLabel}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-end gap-0.5">
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => setViewReg(reg)} title="View details">
                                                    <Eye className="w-3.5 h-3.5" />
                                                </Button>
                                                {['confirmed', 'attended'].includes(reg.status) && (
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-blue-500" onClick={() => resendConfirmation(reg)} title="Resend confirmation email">
                                                        <Send className="w-3.5 h-3.5" />
                                                    </Button>
                                                )}
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
                onCheckIn={(reg) => setCheckInTarget(reg)}
                onResend={(reg) => setResendTarget(reg)}
                onCancel={(reg) => { setViewReg(null); setCancelTarget(reg); }}
                onReinstate={(reg) => { setViewReg(null); setReinstateTarget(reg); }}
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

            {/* Check-in confirmation */}
            <Dialog open={!!checkInTarget} onOpenChange={open => !open && setCheckInTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Check-in</DialogTitle>
                        <DialogDescription>
                            Mark {checkInTarget?.name} ({checkInTarget?.reference_no}) as <strong>attended</strong>?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCheckInTarget(null)}>Cancel</Button>
                        <Button onClick={confirmCheckIn} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                            <UserCheck className="w-3.5 h-3.5 mr-1.5" /> Confirm Check-in
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Resend confirmation */}
            <Dialog open={!!resendTarget} onOpenChange={open => !open && setResendTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Resend Confirmation Email</DialogTitle>
                        <DialogDescription>
                            Resend the confirmation email to {resendTarget?.name} ({resendTarget?.email})?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setResendTarget(null)}>Cancel</Button>
                        <Button onClick={confirmResend} className="text-blue-600 border-blue-300 hover:bg-blue-50">
                            <Send className="w-3.5 h-3.5 mr-1.5" /> Resend Email
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Cancel confirmation */}
            <Dialog open={!!cancelTarget} onOpenChange={open => !open && setCancelTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cancel Registration</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to cancel registration "{cancelTarget?.reference_no}" for {cancelTarget?.name}?
                            {Number(cancelTarget?.total_amount) > 0 && ' This will also restore product stock.'}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCancelTarget(null)}>Keep</Button>
                        <Button variant="destructive" onClick={confirmCancel}>
                            <XCircle className="w-3.5 h-3.5 mr-1.5" /> Cancel Registration
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Reinstate confirmation */}
            <Dialog open={!!reinstateTarget} onOpenChange={open => !open && setReinstateTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reinstate Registration</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to reinstate registration "{reinstateTarget?.reference_no}" for {reinstateTarget?.name}?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setReinstateTarget(null)}>Cancel</Button>
                        <Button onClick={confirmReinstate}>
                            Reinstate
                        </Button>
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
    onCheckIn,
    onResend,
    onCancel,
    onReinstate,
}: {
    event: Event;
    registration: EventRegistration | null;
    onClose: () => void;
    onCheckIn: (reg: EventRegistration) => void;
    onResend: (reg: EventRegistration) => void;
    onCancel: (reg: EventRegistration) => void;
    onReinstate: (reg: EventRegistration) => void;
}) {
    if (!reg) return null;

    const statusPill = STATUS_PILL[reg.status] ?? STATUS_PILL.pending;
    const statusLabel = getRegistrationStatusLabel(reg.status, reg.payment_status);
    const paymentPill = PAYMENT_PILL[reg.payment_status] ?? PAYMENT_PILL.na;

    function updateStatus(status: string) {
        router.patch(`/admin/events/${event.slug}/registrations/${reg!.id}/status`, { status }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => onClose(),
        });
    }

    function checkIn() {
        if (reg) onCheckIn(reg);
    }

    function resendConfirmation() {
        if (reg) onResend(reg);
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
                            {statusLabel}
                        </span>
                    </div>
                </div>

                <Separator />

                <div className="px-6 py-5 space-y-5">
                    {/* Attendee Info */}
                    <div>
                        <h4 className="text-[11px] font-bold uppercase text-primary tracking-widest mb-3">Attendee Information</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        <div className="mt-3 flex gap-2">
                            <Button size="sm" variant="outline" asChild>
                                <a href={route('tickets.download', { registration: reg.id, attendee_no: 1 })}>
                                    <Download className="w-3.5 h-3.5 mr-1" /> Ticket PDF
                                </a>
                            </Button>
                            <Button size="sm" variant="outline" asChild>
                                <a href={route('tickets.download', { registration: reg.id, attendee_no: 1, inline: 1 })} target="_blank">
                                    <Eye className="w-3.5 h-3.5 mr-1" /> Preview
                                </a>
                            </Button>
                        </div>
                    </div>

                    {/* Sub-Attendees (when qty > 1) */}
                    {reg.attendees && reg.attendees.length > 0 && (
                        <>
                            <Separator className="bg-border/50" />
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-[11px] font-bold uppercase text-primary tracking-widest">
                                        Attendees ({reg.attendees.length})
                                    </h4>
                                    <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                        {reg.attendees.filter(a => a.checked_in_at).length} / {reg.attendees.length} checked in
                                    </span>
                                </div>
                                <div className="rounded-lg border border-border/60 overflow-hidden divide-y divide-border/40">
                                    {reg.attendees.map(att => (
                                        <div key={att.id} className="flex items-center justify-between px-4 py-3 gap-3 hover:bg-muted/30 transition-colors">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <span className="shrink-0 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-bold tabular-nums">
                                                    {att.attendee_no}
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-foreground truncate">{att.name}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{att.email}</p>
                                                </div>
                                            </div>
                                            <div className="shrink-0 flex items-center gap-2">
                                                <a href={route('tickets.download', { registration: reg.id, attendee_no: att.attendee_no })} className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-card px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors">
                                                    <Download className="w-3 h-3" /> PDF
                                                </a>
                                                {att.checked_in_at ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                                        <UserCheck className="w-3 h-3" /> Checked In
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                                                        <Clock className="w-3 h-3" /> Pending
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/events/${event.slug}/registrations/${reg.id}`}>
                                <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Full Details
                            </Link>
                        </Button>
                        {reg.invoice && (
                            <Button variant="outline" size="sm" asChild>
                                <a href={route('invoices.download', { invoiceNumber: reg.invoice.invoice_number })}>
                                    <Receipt className="w-3.5 h-3.5 mr-1.5" /> Invoice PDF
                                </a>
                            </Button>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {['confirmed', 'attended'].includes(reg.status) && (
                            <Button size="sm" variant="outline" onClick={resendConfirmation} className="text-blue-600 border-blue-300 hover:bg-blue-50 hover:text-blue-700">
                                <Send className="w-3.5 h-3.5 mr-1.5" /> Resend Confirmation
                            </Button>
                        )}
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
                        {['pending', 'awaiting_payment', 'confirmed', 'waitlisted'].includes(reg.status) && (
                            <Button size="sm" variant="destructive" onClick={() => onCancel(reg)}>
                                <XCircle className="w-3.5 h-3.5 mr-1.5" /> Cancel
                            </Button>
                        )}
                        {reg.status === 'cancelled' && (
                            <Button size="sm" variant="outline" onClick={() => onReinstate(reg)}>
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
