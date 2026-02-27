import AdminLayout from '@/Layouts/AdminLayout';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Users, CheckCircle2, Clock, UserCheck, XCircle, AlertCircle, DollarSign, Search, Eye } from 'lucide-react';
import { type EventRegistration, type RegistrationStats, type PaginatedData, type Event } from '@/types';

interface Props {
    registrations: PaginatedData<EventRegistration & { event: Event }>;
    stats: RegistrationStats;
    events: Pick<Event, 'id' | 'title' | 'slug'>[];
    currentStatus: string;
    currentSearch: string;
    currentEvent: string;
}

const STATUS_STYLES: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    pending:    { variant: 'outline',     label: 'Pending' },
    confirmed:  { variant: 'default',     label: 'Confirmed' },
    attended:   { variant: 'default',     label: 'Attended' },
    cancelled:  { variant: 'destructive', label: 'Cancelled' },
    waitlisted: { variant: 'secondary',   label: 'Waitlisted' },
};

const PAYMENT_STYLES: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    na:       { variant: 'outline',     label: 'N/A' },
    pending:  { variant: 'secondary',   label: 'Pending' },
    paid:     { variant: 'default',     label: 'Paid' },
    refunded: { variant: 'destructive', label: 'Refunded' },
};

export default function RegistrationsIndex({ registrations, stats, events, currentStatus, currentSearch, currentEvent }: Props) {
    const [search, setSearch] = useState(currentSearch);

    function applyFilters(overrides: Record<string, string> = {}) {
        const params: Record<string, string> = {
            search,
            status: currentStatus,
            event: currentEvent,
            ...overrides,
        };
        // Remove empty params
        Object.keys(params).forEach(k => {
            if (!params[k] || params[k] === 'all') delete params[k];
        });
        router.get('/admin/registrations', params, { preserveState: true, preserveScroll: true });
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        applyFilters();
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-foreground">All Registrations</h1>
                    <p className="text-sm text-muted-foreground mt-1">View and manage registrations across all events</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => applyFilters({ status: 'all' })}>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <Users className="w-4 h-4" />
                                <span className="text-xs font-medium uppercase tracking-wide">Total</span>
                            </div>
                            <p className="text-2xl font-bold">{stats.total}</p>
                        </CardContent>
                    </Card>
                    <Card className="cursor-pointer hover:border-green-500/50 transition-colors" onClick={() => applyFilters({ status: 'confirmed' })}>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 text-green-600 mb-1">
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="text-xs font-medium uppercase tracking-wide">Confirmed</span>
                            </div>
                            <p className="text-2xl font-bold">{stats.confirmed}</p>
                        </CardContent>
                    </Card>
                    <Card className="cursor-pointer hover:border-yellow-500/50 transition-colors" onClick={() => applyFilters({ status: 'pending' })}>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 text-yellow-600 mb-1">
                                <Clock className="w-4 h-4" />
                                <span className="text-xs font-medium uppercase tracking-wide">Pending</span>
                            </div>
                            <p className="text-2xl font-bold">{stats.pending}</p>
                        </CardContent>
                    </Card>
                    <Card className="cursor-pointer hover:border-blue-500/50 transition-colors" onClick={() => applyFilters({ status: 'attended' })}>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 text-blue-600 mb-1">
                                <UserCheck className="w-4 h-4" />
                                <span className="text-xs font-medium uppercase tracking-wide">Attended</span>
                            </div>
                            <p className="text-2xl font-bold">{stats.attended}</p>
                        </CardContent>
                    </Card>
                    <Card className="cursor-pointer hover:border-red-500/50 transition-colors" onClick={() => applyFilters({ status: 'cancelled' })}>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 text-red-600 mb-1">
                                <XCircle className="w-4 h-4" />
                                <span className="text-xs font-medium uppercase tracking-wide">Cancelled</span>
                            </div>
                            <p className="text-2xl font-bold">{stats.cancelled}</p>
                        </CardContent>
                    </Card>
                    <Card className="cursor-pointer hover:border-orange-500/50 transition-colors" onClick={() => applyFilters({ status: 'waitlisted' })}>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 text-orange-600 mb-1">
                                <AlertCircle className="w-4 h-4" />
                                <span className="text-xs font-medium uppercase tracking-wide">Waitlisted</span>
                            </div>
                            <p className="text-2xl font-bold">{stats.waitlisted}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 text-emerald-600 mb-1">
                                <DollarSign className="w-4 h-4" />
                                <span className="text-xs font-medium uppercase tracking-wide">Revenue</span>
                            </div>
                            <p className="text-2xl font-bold">RM {Number(stats.revenue).toLocaleString('en-MY', { minimumFractionDigits: 2 })}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <form onSubmit={handleSearch} className="flex gap-2 flex-1">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, email, phone or reference..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Button type="submit" variant="secondary">Search</Button>
                    </form>

                    <Select
                        value={currentEvent || 'all'}
                        onValueChange={v => applyFilters({ event: v === 'all' ? '' : v })}
                    >
                        <SelectTrigger className="w-full sm:w-[220px]">
                            <SelectValue placeholder="All Events" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Events</SelectItem>
                            {events.map(ev => (
                                <SelectItem key={ev.id} value={ev.slug}>{ev.title}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={currentStatus}
                        onValueChange={v => applyFilters({ status: v })}
                    >
                        <SelectTrigger className="w-full sm:w-[160px]">
                            <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="attended">Attended</SelectItem>
                            <SelectItem value="waitlisted">Waitlisted</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Table */}
                <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Reference</TableHead>
                                <TableHead>Participant</TableHead>
                                <TableHead>Event</TableHead>
                                <TableHead>Ticket</TableHead>
                                <TableHead className="text-center">Qty</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Payment</TableHead>
                                <TableHead>Registered</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {registrations.data.map(reg => {
                                const statusStyle = STATUS_STYLES[reg.status] ?? STATUS_STYLES.pending;
                                const paymentStyle = PAYMENT_STYLES[reg.payment_status] ?? PAYMENT_STYLES.na;
                                return (
                                    <TableRow key={reg.id}>
                                        <TableCell className="font-mono text-xs">{reg.reference_no}</TableCell>
                                        <TableCell>
                                            <div className="font-medium">{reg.name}</div>
                                            <div className="text-xs text-muted-foreground">{reg.email}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Link
                                                href={`/admin/events/${reg.event?.slug}/edit`}
                                                className="text-sm text-brand-navy hover:underline"
                                            >
                                                {reg.event?.title ?? '—'}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-sm">{reg.ticket?.name ?? '—'}</TableCell>
                                        <TableCell className="text-center">{reg.quantity}</TableCell>
                                        <TableCell className="text-right font-medium">
                                            {Number(reg.total_amount) > 0
                                                ? `RM ${Number(reg.total_amount).toFixed(2)}`
                                                : 'Free'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={statusStyle.variant}>{statusStyle.label}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={paymentStyle.variant}>{paymentStyle.label}</Badge>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {new Date(reg.created_at).toLocaleDateString('en-MY', {
                                                day: 'numeric', month: 'short', year: 'numeric',
                                            })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Link
                                                href={`/admin/events/${reg.event?.slug}/registrations/${reg.id}`}
                                                className="inline-flex items-center gap-1 text-sm text-brand-navy hover:underline"
                                            >
                                                <Eye className="w-3.5 h-3.5" /> View
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {registrations.data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                                        {currentSearch || currentEvent || currentStatus !== 'all'
                                            ? 'No registrations match the current filters.'
                                            : 'No registrations yet.'}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {registrations.last_page > 1 && (
                    <div className="flex justify-center gap-1">
                        {registrations.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url ?? '#'}
                                className={`px-3 py-1 rounded text-sm border ${
                                    link.active
                                        ? 'bg-brand text-white border-brand'
                                        : 'bg-card text-foreground border-border hover:bg-accent'
                                } ${!link.url ? 'opacity-50 pointer-events-none' : ''}`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
