import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/Components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Separator } from '@/Components/ui/separator';
import { Link, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Search, Download, FileText, Users, CheckCircle2, XCircle, Clock, UserCheck, AlertCircle, ArrowLeft, X, ScanLine, Columns3 } from 'lucide-react';
import { type PaginatedData, type RegistrationField, type EventRegistrationAttendee } from '@/types';

interface AttendeeWithRelations extends EventRegistrationAttendee {
    registration?: {
        id: number;
        reference_no: string;
        ticket?: { id: number; name: string } | null;
    } | null;
}

interface Props {
    event: { id: number; title: string; slug: string };
    attendees: PaginatedData<AttendeeWithRelations>;
    fields: RegistrationField[];
    tickets: { id: number; name: string }[];
    stats: { total: number; checked_in: number; confirmed: number; pending: number; awaiting_payment: number; attended: number; cancelled: number; waitlisted: number };
    currentSearch: string;
    currentTicket: string;
    currentCheckin: string;
    currentStatus: string;
}

const FIXED_COLS = [
    { key: '__ref',     label: 'Ref No' },
    { key: '__ticket',  label: 'Ticket' },
    { key: '__checkin', label: 'Check-in' },
];

const STATUS_FILTERS = [
    { value: '',               label: 'All',           icon: Users,       accent: 'text-primary',                       iconBg: 'bg-primary/10',          border: 'hover:border-primary/50' },
    { value: 'confirmed',      label: 'Confirmed',     icon: CheckCircle2, accent: 'text-emerald-600 dark:text-emerald-400', iconBg: 'bg-emerald-500/10',      border: 'hover:border-emerald-500/50' },
    { value: 'pending',        label: 'Pending',       icon: Clock,       accent: 'text-amber-600 dark:text-amber-400',    iconBg: 'bg-amber-500/10',        border: 'hover:border-amber-500/50' },
    { value: 'awaiting_payment', label: 'Awaiting Payment', icon: Clock, accent: 'text-orange-600 dark:text-orange-400', iconBg: 'bg-orange-500/10', border: 'hover:border-orange-500/50' },
    { value: 'attended',       label: 'Attended',      icon: UserCheck,   accent: 'text-sky-600 dark:text-sky-400',       iconBg: 'bg-sky-500/10',          border: 'hover:border-sky-500/50' },
    { value: 'cancelled',      label: 'Cancelled',     icon: XCircle,     accent: 'text-destructive',                     iconBg: 'bg-destructive/10',      border: 'hover:border-destructive/50' },
    { value: 'waitlisted',     label: 'Waitlisted',    icon: AlertCircle, accent: 'text-muted-foreground',                iconBg: 'bg-muted',               border: 'hover:border-muted-foreground/50' },
];

export default function ParticipantsIndex({
    event, attendees, fields, tickets, stats,
    currentSearch, currentTicket, currentCheckin, currentStatus,
}: Props) {

    const [search,  setSearch]  = useState(currentSearch);
    const [ticket,  setTicket]  = useState(currentTicket);
    const [checkin, setCheckin] = useState(currentCheckin);
    const [status,  setStatus]  = useState(currentStatus);

    const hasFilters = search || ticket || checkin || status;

    // -- Column visibility -----------------------------------------------------
    const storageKey = `participants_cols_${event.slug}`;
    const allKeys    = [...FIXED_COLS.map(c => c.key), ...fields.map(f => f.key)];

    const [visibleCols, setVisibleCols] = useState<Set<string>>(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                const parsed: string[] = JSON.parse(saved);
                return new Set(parsed.filter(k => allKeys.includes(k)));
            }
        } catch {}
        return new Set(allKeys);
    });

    const toggleCol = (key: string) => {
        setVisibleCols(prev => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            try { localStorage.setItem(storageKey, JSON.stringify([...next])); } catch {}
            return next;
        });
    };

    const showAll = () => {
        const next = new Set(allKeys);
        setVisibleCols(next);
        try { localStorage.setItem(storageKey, JSON.stringify([...next])); } catch {}
    };

    const visibleFields = fields.filter(f => visibleCols.has(f.key));
    const showRef       = visibleCols.has('__ref');
    const showTicket    = visibleCols.has('__ticket');
    const showCheckin   = visibleCols.has('__checkin');
    const visibleCount  = (showRef ? 1 : 0) + (showTicket ? 1 : 0) + (showCheckin ? 1 : 0) + visibleFields.length;
    const hiddenCount   = allKeys.length - visibleCols.size;

    // -- Navigation helper -----------------------------------------------------
    function navigate(overrides: { search?: string; ticket?: string; checkin?: string; status?: string } = {}) {
        const s = overrides.search  !== undefined ? overrides.search  : search;
        const t = overrides.ticket  !== undefined ? overrides.ticket  : ticket;
        const c = overrides.checkin !== undefined ? overrides.checkin : checkin;
        const st = overrides.status !== undefined ? overrides.status : status;
        const params: Record<string, string> = {};
        if (s)  params.search  = s;
        if (t)  params.ticket  = t;
        if (c)  params.checkin = c;
        if (st) params.status  = st;
        router.get(`/admin/events/${event.slug}/participants`, params, { preserveScroll: true, replace: true });
    }

    function clearFilters() {
        setSearch('');
        setTicket('');
        setCheckin('');
        setStatus('');
        router.get(`/admin/events/${event.slug}/participants`, {}, { preserveScroll: true });
    }

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== currentSearch) navigate({ search });
        }, 350);
        return () => clearTimeout(timer);
    }, [search]);

    // -- Pagination links ------------------------------------------------------
    const prevPage = attendees.links.find(l => l.label.includes('Previous') || l.label === '&laquo; Previous');
    const nextPage = attendees.links.find(l => l.label.includes('Next')     || l.label === 'Next &raquo;');

    // -- Export URLs -----------------------------------------------------------
    const buildExportUrl = (base: string) => {
        const params = new URLSearchParams();
        params.set('cols', [...visibleCols].join(','));
        if (search)  params.set('search',  search);
        if (ticket)  params.set('ticket',  ticket);
        if (checkin) params.set('checkin', checkin);
        if (status)  params.set('status',  status);
        return `${base}?${params.toString()}`;
    };
    const csvUrl = buildExportUrl(`/admin/events/${event.slug}/participants/export/csv`);
    const pdfUrl = buildExportUrl(`/admin/events/${event.slug}/participants/export/pdf`);

    // -- Stats card lookup -----------------------------------------------------
    const statCards = STATUS_FILTERS.map(f => {
        const key = f.value === '' ? 'total' : f.value;
        return { ...f, count: (stats as Record<string, number>)[key] ?? 0 };
    });

    return (
        <AdminLayout>
            <div className="space-y-4">

                {/* -- Page header -- */}
                <div>
                    <div className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground mb-1.5 flex-wrap">
                        <Link href="/admin" className="hover:text-foreground transition-colors">Dashboard</Link>
                        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                        <Link href="/admin/events" className="hover:text-foreground transition-colors">Events</Link>
                        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                        <Link href={`/admin/events/${event.slug}/registrations`} className="hover:text-foreground transition-colors truncate max-w-[160px]">{event.title}</Link>
                        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-foreground font-medium">Participants</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                        <div className="flex-1 min-w-0">
                            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Participants</h1>
                            <p className="text-sm text-muted-foreground truncate">{event.title}</p>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                            <Button variant="outline" size="sm" className="gap-1.5" asChild>
                                <Link href={`/admin/events/${event.slug}/registrations`}>
                                    <ArrowLeft className="w-4 h-4" />
                                    <span className="hidden sm:inline">Registrations</span>
                                </Link>
                            </Button>
                            <Button variant="outline" size="sm" className="gap-1.5" asChild>
                                <Link href={`/admin/events/${event.slug}/check-in`}>
                                    <ScanLine className="w-4 h-4" />
                                    <span className="hidden sm:inline">Check-in</span>
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* -- Stats cards -- */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                    {statCards.map(card => {
                        const Icon = card.icon;
                        const isActive = (card.value === '' ? !currentStatus : currentStatus === card.value);
                        return (
                            <button
                                key={card.value}
                                onClick={() => {
                                    const next = card.value;
                                    setStatus(next);
                                    navigate({ status: next });
                                }}
                                className={`group rounded-xl border p-3 sm:p-4 text-left transition-all ${card.border} ${
                                    isActive ? 'ring-2 ring-primary/30 border-primary/40' : 'border-border/60'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-2 sm:mb-3">
                                    <span className={`text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider ${card.accent}`}>{card.label}</span>
                                    <div className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg ${card.iconBg}`}>
                                        <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${card.accent}`} />
                                    </div>
                                </div>
                                <p className="text-2xl sm:text-3xl font-bold tabular-nums text-foreground">{card.count}</p>
                            </button>
                        );
                    })}
                    {/* Checked-in summary card */}
                    <div className="col-span-2 sm:col-span-1 rounded-xl border border-sky-500/30 bg-sky-500/5 p-3 sm:p-4">
                        <div className="flex items-center justify-between mb-2 sm:mb-3">
                            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">Check-in Rate</span>
                            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-sky-500/10">
                                <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-600 dark:text-sky-400" />
                            </div>
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold tabular-nums text-foreground">
                            {stats.total > 0 ? Math.round((stats.checked_in / stats.total) * 100) : 0}
                            <span className="text-lg font-semibold text-muted-foreground ml-1">%</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {stats.checked_in} of {stats.total} checked in
                        </p>
                    </div>
                </div>

                {/* -- Filters row -- */}
                <div className="flex flex-col gap-2 sm:gap-2.5">
                    <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 sm:gap-2.5">
                        {/* Search */}
                        <div className="relative flex-1 min-w-0">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                            <Input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search name, email, phone..."
                                className="pl-9 pr-8"
                            />
                            {search && (
                                <button
                                    onClick={() => { setSearch(''); navigate({ search: '' }); }}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            {/* Ticket filter */}
                            {tickets.length > 0 && (
                                <Select
                                    value={ticket || 'all'}
                                    onValueChange={v => {
                                        const next = v === 'all' ? '' : v;
                                        setTicket(next);
                                        navigate({ ticket: next });
                                    }}
                                >
                                    <SelectTrigger className="sm:w-40 h-9 text-xs">
                                        <SelectValue placeholder="All tickets" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All tickets</SelectItem>
                                        {tickets.map(t => (
                                            <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}

                            {/* Check-in filter */}
                            <div className="flex rounded-lg border overflow-hidden text-xs h-9">
                                {([ { value: '',    label: 'All' },
                                     { value: 'yes', label: 'Checked In' },
                                     { value: 'no',  label: 'Not Yet' },
                                ] as { value: string; label: string }[]).map((opt, idx) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => { setCheckin(opt.value); navigate({ checkin: opt.value }); }}
                                        className={[
                                            'px-2.5 sm:px-3 py-1.5 transition-colors font-medium whitespace-nowrap',
                                            idx > 0 ? 'border-l' : '',
                                            checkin === opt.value
                                                ? opt.value === 'yes'
                                                    ? 'bg-emerald-600 text-white'
                                                    : opt.value === 'no'
                                                        ? 'bg-orange-500 text-white'
                                                        : 'bg-primary text-primary-foreground'
                                                : 'bg-background hover:bg-muted text-muted-foreground',
                                        ].join(' ')}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>

                            {/* Clear filters */}
                            {hasFilters && (
                                <Button variant="ghost" size="sm" className="h-9 text-muted-foreground hover:text-foreground gap-1" onClick={clearFilters}>
                                    <X className="w-3.5 h-3.5" />
                                    Clear
                                </Button>
                            )}
                        </div>

                        <div className="flex items-center gap-2 sm:ml-auto">
                            {/* Column toggle */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="gap-1.5">
                                        <Columns3 className="w-4 h-4" />
                                        <span className="hidden sm:inline">Columns</span>
                                        {hiddenCount > 0 && (
                                            <span className="ml-1 rounded-full bg-primary/15 text-primary text-[10px] font-bold px-1.5 py-0.5 leading-none">
                                                -{hiddenCount}
                                            </span>
                                        )}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 max-h-96 overflow-y-auto">
                                    <DropdownMenuLabel className="flex items-center justify-between">
                                        <span>Toggle Columns</span>
                                        {hiddenCount > 0 && (
                                            <button onClick={showAll} className="text-xs text-primary hover:underline font-normal">
                                                Show all
                                            </button>
                                        )}
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {FIXED_COLS.map(col => (
                                        <DropdownMenuCheckboxItem
                                            key={col.key}
                                            checked={visibleCols.has(col.key)}
                                            onCheckedChange={() => toggleCol(col.key)}
                                        >
                                            {col.label}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                    <DropdownMenuSeparator />
                                    {fields.map(field => (
                                        <DropdownMenuCheckboxItem
                                            key={field.key}
                                            checked={visibleCols.has(field.key)}
                                            onCheckedChange={() => toggleCol(field.key)}
                                        >
                                            {field.label_en}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <Separator orientation="vertical" className="h-8 hidden sm:block" />

                            <a href={csvUrl} download>
                                <Button variant="outline" size="sm" className="gap-1.5">
                                    <Download className="w-4 h-4" />
                                    <span className="hidden sm:inline">CSV</span>
                                </Button>
                            </a>
                            <a href={pdfUrl} download>
                                <Button variant="outline" size="sm" className="gap-1.5">
                                    <FileText className="w-4 h-4" />
                                    <span className="hidden sm:inline">PDF</span>
                                </Button>
                            </a>
                        </div>
                    </div>

                    {/* Active filter badge */}
                    {hasFilters && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className="font-medium">Filtered:</span>
                            {status && <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">{STATUS_FILTERS.find(f => f.value === status)?.label}</span>}
                            {checkin === 'yes' && <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">Checked In</span>}
                            {checkin === 'no' && <span className="inline-flex items-center rounded-full border border-orange-500/30 bg-orange-500/10 px-2 py-0.5 text-[11px] font-semibold text-orange-600">Not Checked In</span>}
                            {ticket && <span className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-semibold">{tickets.find(t => String(t.id) === ticket)?.name}</span>}
                            {search && <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-semibold">"{search}"</span>}
                        </div>
                    )}
                </div>

                {/* -- Table -- */}
                <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-x-auto w-full min-w-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b border-border/60 bg-muted/40 hover:bg-muted/40">
                                <TableHead className="w-8 sm:w-10 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">#</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Name</TableHead>
                                <TableHead className="hidden sm:table-cell text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Email</TableHead>
                                {showRef     && <TableHead className="hidden md:table-cell text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Ref No</TableHead>}
                                {showTicket  && <TableHead className="hidden md:table-cell text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Ticket</TableHead>}
                                {showCheckin && <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center whitespace-nowrap">Check-in</TableHead>}
                                {visibleFields.map(field => (
                                    <TableHead key={field.key} className="hidden md:table-cell text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap max-w-[150px] truncate">
                                        {field.label_en}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {attendees.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3 + visibleCount} className="h-32 text-center">
                                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                                            <Users className="w-10 h-10 mb-3 opacity-20" />
                                            <p className="text-sm font-medium">No participants found</p>
                                            <p className="text-xs mt-1 opacity-70">
                                                {hasFilters ? 'Try adjusting your filters.' : 'No attendees registered for this event yet.'}
                                            </p>
                                            {hasFilters && (
                                                <Button variant="link" size="sm" className="mt-2 h-auto p-0 text-xs" onClick={clearFilters}>
                                                    Clear all filters
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                attendees.data.map((attendee, i) => {
                                    const customFields =
                                        (attendee.meta_json as Record<string, Record<string, unknown>> | null)
                                            ?.custom_fields ?? {};
                                    const rowNum = (attendees.current_page - 1) * attendees.per_page + i + 1;

                                    return (
                                        <TableRow key={attendee.id}>
                                            <TableCell className="text-center text-xs text-muted-foreground tabular-nums px-1.5 sm:px-4">{rowNum}</TableCell>
                                            <TableCell className="px-2 sm:px-4">
                                                <span className="font-medium text-foreground text-sm">{attendee.name}</span>
                                                <span className="sm:hidden block text-xs text-muted-foreground">{attendee.email}</span>
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{attendee.email}</TableCell>
                                            {showRef && (
                                                <TableCell className="hidden md:table-cell font-mono text-xs text-muted-foreground whitespace-nowrap">
                                                    {attendee.registration?.reference_no ?? '-'}
                                                </TableCell>
                                            )}
                                            {showTicket && (
                                                <TableCell className="hidden md:table-cell text-xs whitespace-nowrap text-muted-foreground">
                                                    {attendee.registration?.ticket?.name ?? '-'}
                                                </TableCell>
                                            )}
                                            {showCheckin && (
                                                <TableCell className="text-center px-1.5 sm:px-4">
                                                    {attendee.checked_in_at ? (
                                                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                                                            <CheckCircle2 className="w-3 h-3" /> In
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full whitespace-nowrap">
                                                            <Clock className="w-3 h-3" /> —
                                                        </span>
                                                    )}
                                                </TableCell>
                                            )}
                                            {visibleFields.map(field => {
                                                const key = field.key;
                                                const directValue: Record<string, string | null | undefined> = {
                                                    name:  attendee.name,
                                                    email: attendee.email,
                                                    phone: attendee.phone,
                                                };
                                                let value: unknown = key in directValue
                                                    ? (directValue[key] ?? '')
                                                    : (customFields[key] ?? '');
                                                if (Array.isArray(value)) value = value.join(', ');
                                                return (
                                                    <TableCell key={key} className="hidden md:table-cell text-xs max-w-[200px] truncate text-muted-foreground" title={String(value)}>
                                                        {value !== '' && value !== null ? String(value) : (
                                                            <span className="text-muted-foreground/40">—</span>
                                                        )}
                                                    </TableCell>
                                                );
                                            })}
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* -- Pagination -- */}
                <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card px-3 sm:px-4 py-2.5 sm:py-3 shadow-sm gap-2">
                        <span className="text-xs sm:text-sm text-muted-foreground">
                            <span className="hidden sm:inline">Showing </span>
                            <span className="font-medium text-foreground">{attendees.from ?? 0}</span>–<span className="font-medium text-foreground">{attendees.to ?? 0}</span>
                            <span className="hidden sm:inline"> of <span className="font-medium text-foreground">{attendees.total}</span></span>
                        </span>
                        <div className="flex items-center gap-2 sm:gap-3">
                            <span className="hidden sm:inline text-sm text-muted-foreground">
                                Page <span className="font-medium text-foreground">{attendees.current_page}</span> of <span className="font-medium text-foreground">{attendees.last_page}</span>
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
        </AdminLayout>
    );
}
