import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/Components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Link, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Search, Download, FileText, Users, Columns3, CheckCircle2, XCircle, ScanLine } from 'lucide-react';
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
    stats: { total: number; checked_in: number };
    currentSearch: string;
    currentTicket: string;
    currentCheckin: string;
}

const FIXED_COLS = [
    { key: '__ref',     label: 'Ref No' },
    { key: '__ticket',  label: 'Ticket' },
    { key: '__checkin', label: 'Check-in' },
];

export default function ParticipantsIndex({
    event, attendees, fields, tickets, stats,
    currentSearch, currentTicket, currentCheckin,
}: Props) {

    const [search,  setSearch]  = useState(currentSearch);
    const [ticket,  setTicket]  = useState(currentTicket);
    const [checkin, setCheckin] = useState(currentCheckin);

    // ── Column visibility ─────────────────────────────────────────────────────
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

    // ── Navigation helper ─────────────────────────────────────────────────────
    function navigate(overrides: { search?: string; ticket?: string; checkin?: string } = {}) {
        const s = overrides.search  !== undefined ? overrides.search  : search;
        const t = overrides.ticket  !== undefined ? overrides.ticket  : ticket;
        const c = overrides.checkin !== undefined ? overrides.checkin : checkin;
        const params: Record<string, string> = {};
        if (s) params.search  = s;
        if (t) params.ticket  = t;
        if (c) params.checkin = c;
        router.get(`/admin/events/${event.slug}/participants`, params, { preserveScroll: true, replace: true });
    }

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== currentSearch) navigate({ search });
        }, 350);
        return () => clearTimeout(timer);
    }, [search]);

    // ── Pagination links ──────────────────────────────────────────────────────
    const prevPage = attendees.links.find(l => l.label.includes('Previous') || l.label === '&laquo; Previous');
    const nextPage = attendees.links.find(l => l.label.includes('Next')     || l.label === 'Next &raquo;');

    // ── Export URLs ───────────────────────────────────────────────────────────
    const buildExportUrl = (base: string) => {
        const params = new URLSearchParams();
        params.set('cols', [...visibleCols].join(','));
        if (search)  params.set('search',  search);
        if (ticket)  params.set('ticket',  ticket);
        if (checkin) params.set('checkin', checkin);
        return `${base}?${params.toString()}`;
    };
    const csvUrl = buildExportUrl(`/admin/events/${event.slug}/participants/export/csv`);
    const pdfUrl = buildExportUrl(`/admin/events/${event.slug}/participants/export/pdf`);

    // ── Derived stats ─────────────────────────────────────────────────────────
    const notCheckedIn = stats.total - stats.checked_in;
    const checkinPct   = stats.total > 0 ? Math.round((stats.checked_in / stats.total) * 100) : 0;

    return (
        <AdminLayout>
            <div className="space-y-4">

                {/* ── Page header ── */}
                <div className="flex items-center gap-3">
                    <Link href={`/admin/events/${event.slug}/registrations`} className="text-muted-foreground hover:text-foreground transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-2xl font-bold text-foreground">Participants</h1>
                        <p className="text-sm text-muted-foreground truncate">{event.title}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">

                        {/* Column toggle */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-1.5">
                                    <Columns3 className="w-4 h-4" />
                                    Columns
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

                        <a href={csvUrl} download>
                            <Button variant="outline" size="sm" className="gap-1.5">
                                <Download className="w-4 h-4" />
                                CSV
                            </Button>
                        </a>
                        <a href={pdfUrl} download>
                            <Button variant="outline" size="sm" className="gap-1.5">
                                <FileText className="w-4 h-4" />
                                PDF
                            </Button>
                        </a>
                    </div>
                </div>

                {/* ── Stats cards ── */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Total Participants</p>
                            <p className="text-2xl font-bold leading-none">{stats.total}</p>
                        </div>
                    </div>
                    <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Checked In</p>
                            <p className="text-2xl font-bold leading-none text-emerald-600">{stats.checked_in}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{checkinPct}% of total</p>
                        </div>
                    </div>
                    <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                            <ScanLine className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Not Yet</p>
                            <p className="text-2xl font-bold leading-none text-orange-500">{notCheckedIn}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{100 - checkinPct}% of total</p>
                        </div>
                    </div>
                </div>

                {/* ── Filters row ── */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px] max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <Input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search name, email, phone…"
                            className="pl-9"
                        />
                    </div>

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
                            <SelectTrigger className="w-48 h-9 text-sm">
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
                                    'px-3 py-1.5 transition-colors font-medium whitespace-nowrap',
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

                    {/* Result count */}
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground ml-auto">
                        <Users className="w-4 h-4" />
                        <span>{attendees.total} result{attendees.total !== 1 ? 's' : ''}</span>
                    </div>
                </div>

                {/* ── Table ── */}
                <div className="rounded-xl border border-border overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/40">
                                <TableHead className="w-10 text-center text-xs">#</TableHead>
                                {showRef     && <TableHead className="text-xs whitespace-nowrap">Ref No</TableHead>}
                                {showTicket  && <TableHead className="text-xs whitespace-nowrap">Ticket</TableHead>}
                                {showCheckin && <TableHead className="text-xs whitespace-nowrap text-center">Check-in</TableHead>}
                                {visibleFields.map(field => (
                                    <TableHead key={field.key} className="text-xs whitespace-nowrap">
                                        {field.label_en}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {attendees.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={1 + visibleCount} className="h-24 text-center text-muted-foreground">
                                        No participants found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                attendees.data.map((attendee, i) => {
                                    const customFields =
                                        (attendee.meta_json as Record<string, Record<string, unknown>> | null)
                                            ?.custom_fields ?? {};
                                    const rowNum = (attendees.current_page - 1) * attendees.per_page + i + 1;

                                    return (
                                        <TableRow key={attendee.id} className="hover:bg-muted/30">
                                            <TableCell className="text-center text-xs text-muted-foreground">{rowNum}</TableCell>
                                            {showRef && (
                                                <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                                                    {attendee.registration?.reference_no ?? '-'}
                                                </TableCell>
                                            )}
                                            {showTicket && (
                                                <TableCell className="text-xs whitespace-nowrap">
                                                    {attendee.registration?.ticket?.name ?? '-'}
                                                </TableCell>
                                            )}
                                            {showCheckin && (
                                                <TableCell className="text-center">
                                                    {attendee.checked_in_at ? (
                                                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                                                            <CheckCircle2 className="w-3 h-3" /> In
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                                            <XCircle className="w-3 h-3" /> —
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
                                                    <TableCell key={key} className="text-xs max-w-[200px] truncate" title={String(value)}>
                                                        {value !== '' && value !== null ? String(value) : (
                                                            <span className="text-muted-foreground/50">—</span>
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

                {/* ── Pagination ── */}
                {(prevPage || nextPage) && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                            Showing {(attendees.current_page - 1) * attendees.per_page + 1}–{Math.min(attendees.current_page * attendees.per_page, attendees.total)} of {attendees.total}
                        </span>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!prevPage?.url}
                                onClick={() => prevPage?.url && router.get(prevPage.url, {}, { preserveScroll: true })}
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!nextPage?.url}
                                onClick={() => nextPage?.url && router.get(nextPage.url, {}, { preserveScroll: true })}
                            >
                                Next
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}

            </div>
        </AdminLayout>
    );
}

