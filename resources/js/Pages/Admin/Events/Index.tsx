import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/Components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/Components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Eye, MoreHorizontal, Ticket, Package, ShoppingCart, Users, Pencil, Copy, Trash2, MapPin, CalendarDays, Globe, Shield } from 'lucide-react';
import { type Event, type PaginatedData } from '@/types';

interface Props {
    events: PaginatedData<EventRow>;
}

type EventRow = Event & {
    registrations_count?: number;
    tickets_count?: number;
    products_count?: number;
    zones_count?: number;
};

const STATUS_STYLES: Record<string, string> = {
    upcoming: 'bg-brand/15 text-brand border-brand/30',
    past:     'bg-muted text-muted-foreground border-muted-foreground/20',
    draft:    'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
};

function formatDate(date: string) {
    return new Date(date).toLocaleDateString('en-MY', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function EventsIndex({ events }: Props) {
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Event | null>(null);
    const [duplicating, setDuplicating] = useState<string | null>(null);

    function toggleExpand(id: number) {
        setExpandedId(prev => (prev === id ? null : id));
    }

    function confirmDelete() {
        if (!deleteTarget) return;
        router.delete(`/admin/events/${deleteTarget.slug}`, {
            onFinish: () => setDeleteTarget(null),
        });
    }

    function duplicateEvent(event: Event) {
        setDuplicating(event.slug);
        router.post(`/admin/events/${event.slug}/duplicate`, {}, {
            onFinish: () => setDuplicating(null),
        });
    }

    function handlePerPageChange(value: string) {
        router.get('/admin/events', { per_page: value }, { preserveState: true, preserveScroll: true });
    }

    // Pagination helpers
    const prevPage = events.links.find(l => l.label.includes('Previous'));
    const nextPage = events.links.find(l => l.label.includes('Next'));

    return (
        <AdminLayout>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Events</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">{events.total} total event{events.total !== 1 ? 's' : ''}</p>
                    </div>
                    <Button asChild>
                        <Link href="/admin/events/create">+ New Event</Link>
                    </Button>
                </div>

                <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b border-border/60 bg-muted/40 hover:bg-muted/40">
                                <TableHead className="w-10"></TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Event</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Registrations</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {events.data.map(event => {
                                const isExpanded = expandedId === event.id;
                                return (
                                    <EventRowBlock
                                        key={event.id}
                                        event={event}
                                        isExpanded={isExpanded}
                                        onToggle={() => toggleExpand(event.id)}
                                        onDelete={() => setDeleteTarget(event)}
                                        onDuplicate={() => duplicateEvent(event)}
                                        isDuplicating={duplicating === event.slug}
                                    />
                                );
                            })}
                            {events.data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                        No events found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination footer */}
                <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Rows per page</span>
                        <Select defaultValue={String(events.per_page)} onValueChange={handlePerPageChange}>
                            <SelectTrigger className="h-8 w-[70px] border-border/60">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {[10, 15, 25, 50].map(n => (
                                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">
                            Page <span className="font-medium text-foreground">{events.current_page}</span> of <span className="font-medium text-foreground">{events.last_page}</span>
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

            {/* Delete confirmation dialog */}
            <Dialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Event</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{deleteTarget?.title}"? This action cannot be undone.
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

/* ─── Expandable row ─── */

function EventRowBlock({
    event,
    isExpanded,
    onToggle,
    onDelete,
    onDuplicate,
    isDuplicating,
}: {
    event: EventRow;
    isExpanded: boolean;
    onToggle: () => void;
    onDelete: () => void;
    onDuplicate: () => void;
    isDuplicating: boolean;
}) {
    return (
        <>
            {/* Main row */}
            <TableRow
                className={`cursor-pointer transition-colors ${isExpanded ? 'bg-accent/30' : ''}`}
                onClick={onToggle}
            >
                <TableCell className="w-10 pl-4">
                    <ChevronDown
                        className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'}`}
                    />
                </TableCell>
                <TableCell>
                    <div className="font-medium text-foreground">{event.title}</div>
                    {(event.venue || event.city) && (
                        <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {event.venue ?? ''}{event.venue && event.city ? ', ' : ''}{event.city ?? ''}
                        </div>
                    )}
                </TableCell>
                <TableCell>
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[event.status] ?? 'bg-muted text-muted-foreground border-border'}`}>
                        {event.status}
                    </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 text-muted-foreground/60" />
                        {formatDate(event.start_at)}
                        {event.end_at && <span className="text-muted-foreground/50">–</span>}
                        {event.end_at && formatDate(event.end_at)}
                    </span>
                </TableCell>
                <TableCell className="text-right text-sm font-semibold tabular-nums">
                    {event.rsvp_enabled ? (
                        <span className="text-foreground">{event.registrations_count ?? 0}</span>
                    ) : (
                        <span className="text-muted-foreground/50">—</span>
                    )}
                </TableCell>
                <TableCell className="w-12" onClick={e => e.stopPropagation()}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem asChild>
                                <Link href={`/admin/events/${event.slug}/edit`}>
                                    <Pencil className="mr-2 h-4 w-4" /> Edit
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onDuplicate} disabled={isDuplicating}>
                                <Copy className="mr-2 h-4 w-4" /> {isDuplicating ? 'Duplicating…' : 'Duplicate'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
            </TableRow>

            {/* Expanded detail row */}
            {isExpanded && (
                <TableRow className="bg-accent/10 hover:bg-accent/10 border-b border-border/40">
                    <TableCell colSpan={6} className="p-0">
                        <div className="px-6 py-5 border-l-2 border-primary/40 ml-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {/* Event details */}
                                <div className="space-y-3">
                                    <h4 className="text-[11px] font-bold uppercase text-primary tracking-widest">Details</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-start gap-2">
                                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                            <div>
                                                <p className="font-medium text-foreground">{event.venue ?? '—'}</p>
                                                <p className="text-muted-foreground">{[event.city, event.state].filter(Boolean).join(', ') || '—'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                                            <span className={event.is_published ? 'text-brand font-medium' : 'text-muted-foreground'}>
                                                {event.is_published ? 'Published' : 'Unpublished'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
                                            <span className="text-muted-foreground">
                                                RSVP {event.rsvp_enabled ? 'Enabled' : 'Disabled'}
                                                {event.max_attendees ? ` · Max ${event.max_attendees}` : ''}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="space-y-3">
                                    <h4 className="text-[11px] font-bold uppercase text-primary tracking-widest">Stats</h4>
                                    <div className="grid grid-cols-2 gap-2.5">
                                        <StatCard value={event.registrations_count ?? 0} label="Registrations" accent="primary" />
                                        <StatCard value={event.tickets_count ?? 0} label="Tickets" accent="brand" />
                                        <StatCard value={event.products_count ?? 0} label="Products" accent="secondary" />
                                        <StatCard value={event.zones_count ?? 0} label="Zones" accent="muted" />
                                    </div>
                                </div>

                                {/* Quick actions */}
                                <div className="space-y-3">
                                    <h4 className="text-[11px] font-bold uppercase text-primary tracking-widest">Manage</h4>
                                    <div className="flex flex-col gap-1.5">
                                        <ActionLink href={`/admin/events/${event.slug}/registrations`} icon={Users} label="Registrations" />
                                        <ActionLink href={`/admin/events/${event.slug}/tickets`} icon={Ticket} label="Manage Tickets" />
                                        <ActionLink href={`/admin/events/${event.slug}/products`} icon={Package} label="Manage Products" />
                                        <ActionLink href="/admin/orders" icon={ShoppingCart} label="Manage Orders" />
                                        <ActionLink href={`/events/${event.slug}`} icon={Eye} label="View Public Page" external />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TableCell>
                </TableRow>
            )}
        </>
    );
}

/* ─── Stat card ─── */

function StatCard({ value, label, accent }: { value: number; label: string; accent: string }) {
    const bgMap: Record<string, string> = {
        primary:   'border-primary/20 bg-primary/5',
        brand:     'border-brand/20 bg-brand/5',
        secondary: 'border-secondary-foreground/10 bg-secondary/30',
        muted:     'border-border/50 bg-muted/30',
    };
    return (
        <div className={`rounded-lg border p-3 text-center ${bgMap[accent] ?? bgMap.muted}`}>
            <p className="text-2xl font-bold tabular-nums text-foreground">{value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
        </div>
    );
}

/* ─── Action link button ─── */

function ActionLink({ href, icon: Icon, label, external }: { href: string; icon: React.ComponentType<{ className?: string }>; label: string; external?: boolean }) {
    const Tag = external ? 'a' : Link;
    return (
        <Button
            variant="ghost"
            size="sm"
            className="justify-start h-9 px-3 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
            asChild
        >
            <Tag href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                <Icon className="mr-2.5 h-4 w-4 text-primary/70" /> {label}
            </Tag>
        </Button>
    );
}
