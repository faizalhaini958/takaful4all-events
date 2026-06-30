import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Search, ClipboardList, Clock, User, CalendarDays, Download, ExternalLink } from 'lucide-react';
import { type PaginatedData } from '@/types';

interface ActivityLogEntry {
    id: number;
    description: string;
    subject_type: string | null;
    subject_id: number | null;
    subject_url: string | null;
    properties: { old?: Record<string, unknown>; attributes?: Record<string, unknown> } | null;
    created_at: string | null;
    causer: { id: number; name: string } | null;
}

interface Props {
    logs: PaginatedData<ActivityLogEntry>;
    stats: { today: number; week: number; most_active_name: string | null; most_active_count: number };
    modelTypes: Record<string, { label: string }>;
    currentSearch: string;
    currentDateFrom: string;
    currentDateTo: string;
    currentType: string;
}

export default function ActivityLog({ logs, stats, modelTypes, currentSearch, currentDateFrom, currentDateTo, currentType }: Props) {
    const [search, setSearch] = useState(currentSearch);
    const [dateFrom, setDateFrom] = useState(currentDateFrom);
    const [dateTo, setDateTo] = useState(currentDateTo);
    const [type, setType] = useState(currentType);

    const hasFilters = search || dateFrom || dateTo || type;

    function navigate(overrides: Record<string, string> = {}) {
        const params: Record<string, string> = {
            search: overrides.search !== undefined ? overrides.search : search,
            date_from: overrides.date_from !== undefined ? overrides.date_from : dateFrom,
            date_to: overrides.date_to !== undefined ? overrides.date_to : dateTo,
            type: overrides.type !== undefined ? overrides.type : type,
        };
        Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });
        router.get('/admin/activity-log', params, { preserveScroll: true, replace: true });
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        navigate();
    }

    function clearFilters() {
        setSearch('');
        setDateFrom('');
        setDateTo('');
        setType('');
        router.get('/admin/activity-log', {}, { preserveScroll: true });
    }

    const prevPage = logs.links.find(l => l.label.includes('Previous') || l.label === '&laquo; Previous');
    const nextPage = logs.links.find(l => l.label.includes('Next') || l.label === 'Next &raquo;');

    function buildExportUrl() {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (dateFrom) params.set('date_from', dateFrom);
        if (dateTo) params.set('date_to', dateTo);
        if (type) params.set('type', type);
        return `/admin/activity-log/export?${params.toString()}`;
    }

    function formatValue(val: string): string {
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
            const d = new Date(val);
            if (!isNaN(d.getTime())) {
                return d.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' }) +
                    ' ' + d.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' });
            }
        }
        return val;
    }

    function formatChanges(log: ActivityLogEntry) {
        if (log.description === 'deleted') {
            const subject = modelTypes[log.subject_type ?? '']?.label ?? log.subject_type ?? 'record';
            return [{ field: subject, from: 'Exists', to: 'Deleted' }];
        }

        const attrs = log.properties?.attributes;
        const old = log.properties?.old;
        if (!attrs) return null;

        const changes: { field: string; from: string; to: string }[] = [];
        for (const key of Object.keys(attrs)) {
            const fromVal = old?.[key] !== undefined ? formatValue(String(old[key])) : '—';
            const toVal = formatValue(String(attrs[key]));
            if (fromVal !== toVal) {
                changes.push({ field: key, from: fromVal, to: toVal });
            }
        }
        return changes.length > 0 ? changes : null;
    }

    return (
        <AdminLayout>
            <div className="space-y-4">
                {/* Header */}
                <div>
                    <div className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground mb-1.5 flex-wrap">
                        <Link href="/admin" className="hover:text-foreground transition-colors">Dashboard</Link>
                        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-foreground font-medium">Activity Log</span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground">Activity Log</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Track all admin actions across the system</p>
                </div>

                {/* Stats cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                    <div className="rounded-xl border border-border/60 bg-card p-3 sm:p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Today</span>
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10">
                                <CalendarDays className="w-3.5 h-3.5 text-emerald-600" />
                            </div>
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold tabular-nums text-foreground">{stats.today}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">actions today</p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-card p-3 sm:p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">This Week</span>
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                                <Clock className="w-3.5 h-3.5 text-primary" />
                            </div>
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold tabular-nums text-foreground">{stats.week}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">last 7 days</p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-card p-3 sm:p-4 shadow-sm col-span-2 sm:col-span-1">
                        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Most Active</span>
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10">
                                <User className="w-3.5 h-3.5 text-amber-600" />
                            </div>
                        </div>
                        <p className="text-lg font-bold text-foreground truncate">{stats.most_active_name ?? '—'}</p>
                        {stats.most_active_count > 0 && (
                            <p className="text-xs text-muted-foreground mt-0.5">{stats.most_active_count} actions this month</p>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 sm:gap-2.5">
                    <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="relative flex-1 min-w-0">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                            <Input
                                placeholder="Search description or staff..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Button type="submit" variant="secondary" size="sm" className="shrink-0">Search</Button>
                    </form>

                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <Select
                            value={type || 'all'}
                            onValueChange={v => { const next = v === 'all' ? '' : v; setType(next); navigate({ type: next }); }}
                        >
                            <SelectTrigger className="flex-1 sm:w-36 h-9 text-xs">
                                <SelectValue placeholder="All types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All types</SelectItem>
                                {Object.entries(modelTypes).map(([key, val]) => (
                                    <SelectItem key={key} value={key}>{val.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Input
                            type="date"
                            value={dateFrom}
                            onChange={e => { setDateFrom(e.target.value); navigate({ date_from: e.target.value }); }}
                            className="flex-1 sm:w-32 h-9 text-xs"
                        />
                        <span className="text-xs text-muted-foreground shrink-0">to</span>
                        <Input
                            type="date"
                            value={dateTo}
                            onChange={e => { setDateTo(e.target.value); navigate({ date_to: e.target.value }); }}
                            className="flex-1 sm:w-32 h-9 text-xs"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        {hasFilters && (
                            <Button variant="ghost" size="sm" className="h-9 text-muted-foreground" onClick={clearFilters}>
                                Clear
                            </Button>
                        )}
                        <a href={buildExportUrl()} className="sm:ml-auto">
                            <Button variant="outline" size="sm" className="gap-1.5">
                                <Download className="w-4 h-4" />
                                <span className="hidden sm:inline">Export CSV</span>
                            </Button>
                        </a>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b border-border/60 bg-muted/40 hover:bg-muted/40">
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Time</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Admin</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Action</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Subject</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Changes</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                        <p className="text-sm">No activity recorded yet.</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logs.data.map(log => {
                                    const time = log.created_at ? new Date(log.created_at) : null;
                                    const changes = formatChanges(log);
                                    return (
                                        <TableRow key={log.id}>
                                            <TableCell className="whitespace-nowrap">
                                                {time && (
                                                    <>
                                                        <p className="text-xs font-medium text-foreground">
                                                            {time.toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}
                                                        </p>
                                                        <p className="text-[11px] text-muted-foreground">
                                                            {time.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1.5">
                                                    <User className="w-3 h-3 text-muted-foreground" />
                                                    <span className="text-sm font-medium text-foreground">{log.causer?.name ?? 'System'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-foreground">{log.description}</TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                {log.subject_type ? (
                                                    <span className="inline-flex items-center gap-1.5 text-xs">
                                                        <span className="rounded-full bg-muted px-2 py-0.5 font-semibold text-muted-foreground">
                                                            {modelTypes[log.subject_type]?.label ?? log.subject_type}
                                                        </span>
                                                        {log.subject_id && log.subject_url ? (
                                                            <Link href={log.subject_url} className="text-primary hover:underline font-mono text-[11px] flex items-center gap-0.5">
                                                                #{log.subject_id} <ExternalLink className="w-2.5 h-2.5" />
                                                            </Link>
                                                        ) : (
                                                            <span className="text-muted-foreground font-mono text-[11px]">#{log.subject_id}</span>
                                                        )}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="hidden lg:table-cell">
                                                {changes ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {changes.map((c, i) => (
                                                            <span key={i} className="inline-flex items-center gap-1 text-[11px] bg-muted/30 px-1.5 py-0.5 rounded">
                                                                <span className="text-muted-foreground font-semibold">{c.field}:</span>
                                                                <span className="text-red-500 line-through">{c.from}</span>
                                                                <span className="text-muted-foreground">→</span>
                                                                <span className="text-emerald-600 font-semibold">{c.to}</span>
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">—</span>
                                                )}
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
                    <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card px-3 sm:px-4 py-2.5 sm:py-3 shadow-sm gap-2">
                        <span className="text-xs sm:text-sm text-muted-foreground">
                            <span className="hidden sm:inline">Showing </span>
                            <span className="font-medium text-foreground">{logs.from ?? 0}</span>–<span className="font-medium text-foreground">{logs.to ?? 0}</span>
                            <span className="hidden sm:inline"> of <span className="font-medium text-foreground">{logs.total}</span></span>
                        </span>
                        <div className="flex items-center gap-2 sm:gap-3">
                            <span className="hidden sm:inline text-sm text-muted-foreground">
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
