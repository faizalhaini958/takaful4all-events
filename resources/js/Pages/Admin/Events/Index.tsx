import AdminLayout from '@/Layouts/AdminLayout';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { type Event, type PaginatedData } from '@/types';

interface Props {
    events: PaginatedData<Event & { registrations_count?: number }>;
}

const STATUS_BADGE: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    upcoming: 'default',
    past:     'secondary',
    draft:    'outline',
};

export default function EventsIndex({ events }: Props) {
    const [deleteTarget, setDeleteTarget] = useState<Event | null>(null);
    const [duplicating, setDuplicating] = useState<string | null>(null);

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

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-foreground">Events</h1>
                    <Button asChild className="bg-brand hover:bg-brand-dark">
                        <Link href="/admin/events/create">+ New Event</Link>
                    </Button>
                </div>

                <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Start Date</TableHead>
                                <TableHead>End Date</TableHead>
                                <TableHead>City</TableHead>
                                <TableHead className="text-center">Registrations</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {events.data.map(event => (
                                <TableRow key={event.id}>
                                    <TableCell className="font-medium max-w-xs truncate">{event.title}</TableCell>
                                    <TableCell>
                                        <Badge variant={STATUS_BADGE[event.status] ?? 'secondary'}>
                                            {event.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {new Date(event.start_at).toLocaleDateString('en-MY')}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {event.end_at ? new Date(event.end_at).toLocaleDateString('en-MY') : '—'}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{event.city ?? '—'}</TableCell>
                                    <TableCell className="text-center">
                                        {event.rsvp_enabled ? (
                                            <Link
                                                href={`/admin/events/${event.slug}/registrations`}
                                                className="inline-flex items-center gap-1 text-sm font-medium text-brand-navy hover:underline"
                                            >
                                                {event.registrations_count ?? 0}
                                            </Link>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right space-x-3">
                                        <Link
                                            href={`/admin/events/${event.slug}/edit`}
                                            className="text-sm text-brand-navy hover:underline"
                                        >
                                            Edit
                                        </Link>
                                        <button
                                            onClick={() => duplicateEvent(event)}
                                            disabled={duplicating === event.slug}
                                            className="text-sm text-amber-600 hover:underline disabled:opacity-50"
                                        >
                                            {duplicating === event.slug ? 'Duplicating…' : 'Duplicate'}
                                        </button>
                                        <button
                                            onClick={() => setDeleteTarget(event)}
                                            className="text-sm text-red-600 hover:underline"
                                        >
                                            Delete
                                        </button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {events.data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                        No events found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {events.last_page > 1 && (
                    <div className="flex justify-center gap-1">
                        {events.links.map((link, i) => (
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
