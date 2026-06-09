import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Search, ArrowLeft, Download, UserCheck, Clock, CalendarDays, Hash, Users, ScanLine } from 'lucide-react';
import { type PaginatedData } from '@/types';

interface CheckInLogEntry {
    id: number;
    action: string;
    performed_at: string | null;
    meta_json: { attendee_name?: string; attendee_no?: number; method?: string } | null;
    registration: { id: number; reference_no: string; name: string } | null;
    attendee: { id: number; name: string } | null;
    user: { id: number; name: string } | null;
}

interface Props {
    event: { id: number; title: string; slug: string };
    logs: PaginatedData<CheckInLogEntry>;
    stats: { total: number; today: number };
    currentSearch: string;
    currentDateFrom: string;
    currentDateTo: string;
}

const METHOD_LABELS: Record<string, string> = {
    qr_scan: 'QR Scan',
    manual: 'Manual',
    admin_panel: 'Admin Panel',
    status_update: 'Status Update',
    bulk_status_update: 'Bulk Update',
};

export default function CheckInLog({ event, logs, stats, currentSearch, currentDateFrom, currentDateTo }: Props) {
    const [search, setSearch] = useState(currentSearch);
    const [dateFrom, setDateFrom] = useState(currentDateFrom);
    const [dateTo, setDateTo] = useState(currentDateTo);

    function applyFilters(overrides: Record<string, string> = {}) {
        const params: Record<string, string> = {
            ...(overrides.search !== undefined ? { search: overrides.search } : { search }),
            ...(overrides.date_from !== undefined ? { date_from: overrides.date_from } : { date_from: dateFrom }),
            ...(overrides.date_to !== undefined ? { date_to: overrides.date_to } : { date_to: dateTo }),
        };
        Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });
        router.get(`/admin/events/${event.slug}/check-in/log`, params, { preserveScroll: true, replace: true });
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        applyFilters();
    }

    const prevPage = logs.links.find(l => l.label.includes('Previous') || l.label === '&laquo; Previous');
    const nextPage = logs.links.find(l => l.label.includes('Next') || l.label === 'Next &raquo;');

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
                        <Link href={`/admin/events/${event.slug}/registrations`} className="hover:text-foreground transition-colors truncate max-w-[160px]">{event.title}</Link>
                        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-foreground font-medium">Check-in Log</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl font-bold text-foreground">Check-in Log</h1>
                            <p className="text-sm text-muted-foreground truncate">{event.title}</p>
                        </div>
                        <Button variant="outline" size="sm" className="gap-1.5" asChild>
                            <Link href={`/admin/events/${event.slug}/check-in`}>
                                <ScanLine className="w-4 h-4" />
                                Scanner
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Check-ins</span>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                                <UserCheck className="w-4 h-4 text-primary" />
                            </div>
                        </div>
                        <p className="text-3xl font-bold tabular-nums text-foreground">{stats.total}</p>
                    </div>
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Today</span>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                                <CalendarDays className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                        </div>
                        <p className="text-3xl font-bold tabular-nums text-foreground">{stats.today}</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2.5">
                    <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="relative flex-1 min-w-[200px] max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                            <Input
                                placeholder="Search attendee, staff or reference..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Button type="submit" variant="secondary" size="sm">Search</Button>
                    </form>

                    <div className="flex items-center gap-2">
                        <Input
                            type="date"
                            value={dateFrom}
                            onChange={e => { setDateFrom(e.target.value); applyFilters({ date_from: e.target.value }); }}
                            className="w-36 h-9 text-xs"
                        />
                        <span className="text-xs text-muted-foreground">to</span>
                        <Input
                            type="date"
                            value={dateTo}
                            onChange={e => { setDateTo(e.target.value); applyFilters({ date_to: e.target.value }); }}
                            className="w-36 h-9 text-xs"
                        />
                    </div>

                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground ml-auto">
                        <Users className="w-4 h-4" />
                        <span>{logs.total} log{logs.total !== 1 ? 's' : ''}</span>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b border-border/60 bg-muted/40 hover:bg-muted/40">
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Time</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Attendee</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap hidden md:table-cell">Reference</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Staff</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Method</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center whitespace-nowrap">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        <Clock className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                        <p className="text-sm">No check-in logs found.</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logs.data.map(log => {
                                    const attendeeName = log.meta_json?.attendee_name ?? log.attendee?.name ?? log.registration?.name ?? '—';
                                    const method = log.meta_json?.method ?? 'manual';
                                    const time = log.performed_at ? new Date(log.performed_at) : null;
                                    return (
                                        <TableRow key={log.id}>
                                            <TableCell className="whitespace-nowrap">
                                                {time && (
                                                    <>
                                                        <p className="text-sm font-medium text-foreground">
                                                            {time.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {time.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <p className="text-sm font-medium text-foreground">{attendeeName}</p>
                                                {log.meta_json?.attendee_no && (
                                                    <p className="text-xs text-muted-foreground">Attendee #{log.meta_json.attendee_no}</p>
                                                )}
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                {log.registration?.reference_no ? (
                                                    <Link
                                                        href={`/admin/events/${event.slug}/registrations/${log.registration.id}`}
                                                        className="font-mono text-xs text-primary hover:underline"
                                                    >
                                                        {log.registration.reference_no}
                                                    </Link>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                                                {log.user?.name ?? '—'}
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                <span className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                                    {METHOD_LABELS[method] ?? method}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                                                    <UserCheck className="w-3 h-3" />
                                                    In
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {logs.total > 0 && (
                    <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card px-4 py-3 shadow-sm">
                        <span className="text-sm text-muted-foreground">
                            Showing <span className="font-medium text-foreground">{logs.from ?? 0}</span> to <span className="font-medium text-foreground">{logs.to ?? 0}</span> of <span className="font-medium text-foreground">{logs.total}</span>
                        </span>
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground">
                                Page <span className="font-medium text-foreground">{logs.current_page}</span> of <span className="font-medium text-foreground">{logs.last_page}</span>
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
                )}
            </div>
        </AdminLayout>
    );
}
