import AdminLayout from '@/Layouts/AdminLayout';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { ChevronLeft, Users, Eye, Trash2, CheckCircle, XCircle, Clock, UserCheck } from 'lucide-react';
import { type Event, type EventRegistration, type RegistrationStats, type PaginatedData, type RegistrationStatus } from '@/types';

interface Props {
    event: Event;
    registrations: PaginatedData<EventRegistration>;
    stats: RegistrationStats;
    currentStatus: string;
}

const STATUS_BADGE: Record<RegistrationStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    pending:    { variant: 'outline',     label: 'Pending' },
    confirmed:  { variant: 'default',     label: 'Confirmed' },
    cancelled:  { variant: 'destructive', label: 'Cancelled' },
    waitlisted: { variant: 'secondary',   label: 'Waitlisted' },
    attended:   { variant: 'default',     label: 'Attended' },
};

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

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <Link href={`/admin/events/${event.slug}/edit`} className="text-muted-foreground hover:text-foreground transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Registrations</h1>
                        <p className="text-sm text-muted-foreground">{event.title}</p>
                    </div>
                </div>

                {/* Stats cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                    <Card>
                        <CardContent className="pt-4 pb-3 px-4">
                            <p className="text-xs text-muted-foreground">Total</p>
                            <p className="text-2xl font-bold">{stats.total}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4 pb-3 px-4">
                            <p className="text-xs text-muted-foreground">Confirmed</p>
                            <p className="text-2xl font-bold text-emerald-600">{stats.confirmed}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4 pb-3 px-4">
                            <p className="text-xs text-muted-foreground">Pending</p>
                            <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4 pb-3 px-4">
                            <p className="text-xs text-muted-foreground">Attended</p>
                            <p className="text-2xl font-bold text-blue-600">{stats.attended}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4 pb-3 px-4">
                            <p className="text-xs text-muted-foreground">Cancelled</p>
                            <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4 pb-3 px-4">
                            <p className="text-xs text-muted-foreground">Waitlisted</p>
                            <p className="text-2xl font-bold text-gray-500">{stats.waitlisted}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4 pb-3 px-4">
                            <p className="text-xs text-muted-foreground">Revenue</p>
                            <p className="text-2xl font-bold">RM {Number(stats.revenue).toFixed(2)}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                    {FILTERS.map(f => (
                        <button
                            key={f.value}
                            onClick={() => handleFilter(f.value)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                                currentStatus === f.value
                                    ? 'bg-brand text-white border-brand'
                                    : 'bg-card text-foreground border-border hover:border-brand'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}

                    {/* Bulk actions */}
                    {selectedIds.length > 0 && (
                        <div className="ml-auto flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">{selectedIds.length} selected</span>
                            <Button size="sm" variant="outline" onClick={() => bulkUpdate('confirmed')}>
                                <CheckCircle className="w-3.5 h-3.5 mr-1" /> Confirm
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => bulkUpdate('cancelled')}>
                                <XCircle className="w-3.5 h-3.5 mr-1" /> Cancel
                            </Button>
                        </div>
                    )}
                </div>

                {/* Table */}
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-10">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.length === registrations.data.length && registrations.data.length > 0}
                                            onChange={toggleSelectAll}
                                            className="rounded border-gray-300"
                                        />
                                    </TableHead>
                                    <TableHead>Ref</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Ticket</TableHead>
                                    <TableHead>Qty</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {registrations.data.map(reg => {
                                    const statusCfg = STATUS_BADGE[reg.status];
                                    return (
                                        <TableRow key={reg.id}>
                                            <TableCell>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(reg.id)}
                                                    onChange={() => toggleSelect(reg.id)}
                                                    className="rounded border-gray-300"
                                                />
                                            </TableCell>
                                            <TableCell className="font-mono text-xs">{reg.reference_no}</TableCell>
                                            <TableCell className="font-medium">{reg.name}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">{reg.email}</TableCell>
                                            <TableCell className="text-sm">{reg.ticket?.name ?? '—'}</TableCell>
                                            <TableCell>{reg.quantity}</TableCell>
                                            <TableCell className="text-sm">
                                                {Number(reg.total_amount) > 0
                                                    ? `RM ${Number(reg.total_amount).toFixed(2)}`
                                                    : 'Free'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={statusCfg.variant}>
                                                    {statusCfg.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right space-x-1">
                                                <Link
                                                    href={`/admin/events/${event.slug}/registrations/${reg.id}`}
                                                    className="inline-flex"
                                                >
                                                    <Eye className="w-4 h-4 text-brand-navy hover:text-brand" />
                                                </Link>
                                                {reg.status === 'confirmed' && (
                                                    <button onClick={() => checkIn(reg)} title="Check in">
                                                        <UserCheck className="w-4 h-4 text-emerald-600 hover:text-emerald-800" />
                                                    </button>
                                                )}
                                                {reg.status === 'pending' && (
                                                    <button onClick={() => quickStatusUpdate(reg, 'confirmed')} title="Approve">
                                                        <CheckCircle className="w-4 h-4 text-emerald-600 hover:text-emerald-800" />
                                                    </button>
                                                )}
                                                <button onClick={() => setDeleteTarget(reg)} title="Delete">
                                                    <Trash2 className="w-4 h-4 text-red-500 hover:text-red-700" />
                                                </button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {registrations.data.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                                            <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                            No registrations found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

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
