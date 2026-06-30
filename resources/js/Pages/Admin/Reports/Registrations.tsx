import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import {
    Users, CheckCircle2, Clock, UserCheck, XCircle, AlertCircle, DollarSign,
    Download, ChevronLeft, ChevronRight, BarChart2, Filter,
} from 'lucide-react';
import { type EventRegistration, type RegistrationStats, type PaginatedData, type Event } from '@/types';

interface Props {
    registrations: PaginatedData<EventRegistration & { event: Event }>;
    stats: RegistrationStats;
    events: Pick<Event, 'id' | 'title' | 'slug'>[];
    currentStatus: string;
    currentEvent: string;
    currentDateFrom: string;
    currentDateTo: string;
}

const STATUS_PILL: Record<string, { class: string; label: string }> = {
    pending:           { class: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30',       label: 'Pending' },
    awaiting_payment:  { class: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30',   label: 'Awaiting Payment' },
    confirmed:         { class: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30', label: 'Confirmed' },
    attended:          { class: 'bg-primary/15 text-primary border border-primary/30',                                   label: 'Attended' },
    cancelled:         { class: 'bg-destructive/15 text-destructive border border-destructive/30',                       label: 'Cancelled' },
    waitlisted:        { class: 'bg-muted text-muted-foreground border border-muted-foreground/20',                      label: 'Waitlisted' },
};

const PAYMENT_PILL: Record<string, { class: string; label: string }> = {
    na:       { class: 'bg-muted text-muted-foreground border border-border',                                    label: 'N/A' },
    pending:  { class: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30',         label: 'Pending' },
    paid:     { class: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30', label: 'Paid' },
    refunded: { class: 'bg-destructive/15 text-destructive border border-destructive/30',                       label: 'Refunded' },
};

const STAT_CARDS = [
    { key: 'total',      label: 'Total',      icon: Users,        accent: 'text-primary',                          iconBg: 'bg-primary/10',     border: 'hover:border-primary/50' },
    { key: 'confirmed',  label: 'Confirmed',  icon: CheckCircle2, accent: 'text-emerald-600 dark:text-emerald-400', iconBg: 'bg-emerald-500/10', border: 'hover:border-emerald-500/50' },
    { key: 'pending',    label: 'Pending',    icon: Clock,        accent: 'text-amber-600 dark:text-amber-400',    iconBg: 'bg-amber-500/10',   border: 'hover:border-amber-500/50' },
    { key: 'awaiting_payment', label: 'Awaiting Payment', icon: Clock, accent: 'text-orange-600 dark:text-orange-400', iconBg: 'bg-orange-500/10', border: 'hover:border-orange-500/50' },
    { key: 'attended',   label: 'Attended',   icon: UserCheck,    accent: 'text-sky-600 dark:text-sky-400',        iconBg: 'bg-sky-500/10',     border: 'hover:border-sky-500/50' },
    { key: 'cancelled',  label: 'Cancelled',  icon: XCircle,      accent: 'text-destructive',                      iconBg: 'bg-destructive/10', border: 'hover:border-destructive/50' },
    { key: 'waitlisted', label: 'Waitlisted', icon: AlertCircle,  accent: 'text-muted-foreground',                 iconBg: 'bg-muted',          border: 'hover:border-muted-foreground/50' },
] as const;

export default function RegistrationsReport({
    registrations, stats, events, currentStatus, currentEvent, currentDateFrom, currentDateTo,
}: Props) {
    const [dateFrom, setDateFrom] = useState(currentDateFrom);
    const [dateTo, setDateTo]     = useState(currentDateTo);

    function buildParams(overrides: Record<string, string> = {}) {
        const params: Record<string, string> = {
            event:     currentEvent,
            status:    currentStatus,
            date_from: dateFrom,
            date_to:   dateTo,
            ...overrides,
        };
        Object.keys(params).forEach(k => {
            if (!params[k] || params[k] === 'all') delete params[k];
        });
        return params;
    }

    function applyFilters(overrides: Record<string, string> = {}) {
        router.get('/admin/reports/registrations', buildParams(overrides), {
            preserveState: true,
            preserveScroll: true,
        });
    }

    function buildExportUrl(type: 'csv' | 'pdf') {
        const params = buildParams();
        const qs = new URLSearchParams(params).toString();
        const base = type === 'pdf'
            ? '/admin/reports/registrations/export-pdf'
            : '/admin/reports/registrations/export';
        return base + (qs ? '?' + qs : '');
    }

    return (
        <AdminLayout>
            <div className="space-y-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <BarChart2 className="w-5 h-5 text-primary" />
                            <h1 className="text-2xl font-bold text-foreground">Registration Report</h1>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {registrations.total} record{registrations.total !== 1 ? 's' : ''} matched the current filters
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <a href={buildExportUrl('csv')}>
                            <Button variant="outline" size="sm" className="gap-2">
                                <Download className="w-4 h-4" />
                                Export CSV
                            </Button>
                        </a>
                        <a href={buildExportUrl('pdf')}>
                            <Button variant="outline" size="sm" className="gap-2 border-red-500/40 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 dark:text-red-400">
                                <Download className="w-4 h-4" />
                                Export PDF
                            </Button>
                        </a>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {STAT_CARDS.map(card => {
                        const Icon  = card.icon;
                        const value = stats[card.key as keyof RegistrationStats];
                        const isActive = currentStatus === card.key || (card.key === 'total' && currentStatus === 'all');
                        return (
                            <button
                                key={card.key}
                                onClick={() => applyFilters({ status: card.key === 'total' ? 'all' : card.key })}
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
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Revenue (excl. cancelled)</span>
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

                {/* Filters */}
                <div className="rounded-xl border border-border/60 bg-card shadow-sm p-4 space-y-3">
                    {/* Filter header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-semibold text-foreground">Filter Results</span>
                            {(currentEvent || currentStatus !== 'all' || dateFrom || dateTo) && (
                                <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                                    Active
                                </span>
                            )}
                        </div>
                        {(currentEvent || currentStatus !== 'all' || dateFrom || dateTo) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setDateFrom('');
                                    setDateTo('');
                                    router.get('/admin/reports/registrations', {}, { preserveState: false });
                                }}
                                className="text-muted-foreground hover:text-foreground text-xs h-7 px-2"
                            >
                                Clear all
                            </Button>
                        )}
                    </div>

                    {/* Filter controls */}
                    <div className="flex flex-col lg:flex-row flex-wrap gap-3">
                        {/* Event filter */}
                        <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Event</label>
                            <Select
                                value={currentEvent || 'all'}
                                onValueChange={v => applyFilters({ event: v === 'all' ? '' : v })}
                            >
                                <SelectTrigger className="w-full lg:w-[280px] h-10 border-border/60">
                                    <SelectValue placeholder="All Events" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Events</SelectItem>
                                    {events.map(ev => (
                                        <SelectItem key={ev.id} value={ev.slug}>{ev.title}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Status filter */}
                        <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</label>
                            <Select
                                value={currentStatus}
                                onValueChange={v => applyFilters({ status: v })}
                            >
                                <SelectTrigger className="w-full lg:w-[200px] h-10 border-border/60">
                                    <SelectValue placeholder="All Statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="awaiting_payment">Awaiting Payment</SelectItem>
                                    <SelectItem value="confirmed">Confirmed</SelectItem>
                                    <SelectItem value="attended">Attended</SelectItem>
                                    <SelectItem value="waitlisted">Waitlisted</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Date range */}
                        <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Registration Date</label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="date"
                                    value={dateFrom}
                                    onChange={e => setDateFrom(e.target.value)}
                                    onBlur={() => applyFilters({ date_from: dateFrom })}
                                    className="w-full lg:w-[180px] h-10 border-border/60"
                                />
                                <span className="text-muted-foreground text-sm shrink-0">—</span>
                                <Input
                                    type="date"
                                    value={dateTo}
                                    onChange={e => setDateTo(e.target.value)}
                                    onBlur={() => applyFilters({ date_to: dateTo })}
                                    className="w-full lg:w-[180px] h-10 border-border/60"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b border-border/60 bg-muted/40 hover:bg-muted/40">
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Reference</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Participant</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Event</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Ticket</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center hidden md:table-cell">Qty</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Total (RM)</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Payment</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Registered</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {registrations.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                                        No registrations found for the selected filters.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                registrations.data.map(reg => {
                                    const sp = STATUS_PILL[reg.status]  ?? STATUS_PILL.pending;
                                    const pp = PAYMENT_PILL[reg.payment_status] ?? PAYMENT_PILL.na;
                                    return (
                                        <TableRow key={reg.id} className="hover:bg-muted/30">
                                            <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap hidden md:table-cell">
                                                {reg.reference_no}
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium text-foreground text-sm">{reg.name}</div>
                                                <div className="text-xs text-muted-foreground">{reg.email}</div>
                                                {reg.phone && (
                                                    <div className="text-xs text-muted-foreground">{reg.phone}</div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm text-foreground max-w-[180px] truncate hidden md:table-cell">
                                                {reg.event?.title ?? '-'}
                                            </TableCell>
                                            <TableCell className="text-sm text-foreground whitespace-nowrap hidden md:table-cell">
                                                {reg.ticket?.name ?? '-'}
                                            </TableCell>
                                            <TableCell className="text-center text-sm tabular-nums hidden md:table-cell">
                                                {reg.quantity}
                                            </TableCell>
                                            <TableCell className="text-right text-sm tabular-nums font-medium">
                                                {Number(reg.total_amount).toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                                            </TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${sp.class}`}>
                                                    {sp.label}
                                                </span>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${pp.class}`}>
                                                    {pp.label}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap hidden md:table-cell">
                                                {new Date(reg.created_at).toLocaleDateString('en-MY', {
                                                    day: '2-digit', month: 'short', year: 'numeric',
                                                })}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {registrations.last_page > 1 && (
                    <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card px-4 py-3 shadow-sm">
                        <span className="text-sm text-muted-foreground hidden sm:inline">
                            Showing <span className="font-medium text-foreground">{registrations.from ?? 0}</span> to{' '}
                            <span className="font-medium text-foreground">{registrations.to ?? 0}</span> of{' '}
                            <span className="font-medium text-foreground">{registrations.total}</span>
                        </span>
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground">
                                Page <span className="font-medium text-foreground">{registrations.current_page}</span> of{' '}
                                <span className="font-medium text-foreground">{registrations.last_page}</span>
                            </span>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost" size="icon" className="h-8 w-8" asChild
                                    disabled={!registrations.links.find(l => l.label.includes('Previous'))?.url}
                                >
                                    <Link href={registrations.links.find(l => l.label.includes('Previous'))?.url ?? '#'} preserveState preserveScroll>
                                        <ChevronLeft className="h-4 w-4" />
                                    </Link>
                                </Button>
                                <Button
                                    variant="ghost" size="icon" className="h-8 w-8" asChild
                                    disabled={!registrations.links.find(l => l.label.includes('Next'))?.url}
                                >
                                    <Link href={registrations.links.find(l => l.label.includes('Next'))?.url ?? '#'} preserveState preserveScroll>
                                        <ChevronRight className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
