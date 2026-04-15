import UserDashboardLayout from '@/Layouts/UserDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Link } from '@inertiajs/react';
import { Ticket, Calendar, MapPin, Search, Download, QrCode } from 'lucide-react';
import { type EventRegistration, type PaginatedData } from '@/types';
import { useState } from 'react';
import { router } from '@inertiajs/react';
import TicketPreviewModal from '@/Components/TicketPreviewModal';

interface Props {
    registrations: PaginatedData<EventRegistration>;
    filters: {
        search: string;
        status: string;
    };
}

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    confirmed: 'default',
    pending:   'secondary',
    attended:  'default',
    cancelled: 'destructive',
    waitlisted: 'outline',
};

const STATUS_OPTIONS = [
    { value: '', label: 'All Statuses' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'pending', label: 'Pending' },
    { value: 'attended', label: 'Attended' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'waitlisted', label: 'Waitlisted' },
];

export default function Tickets({ registrations, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [ticketModalOpen, setTicketModalOpen] = useState(false);
    const [selectedRegistration, setSelectedRegistration] = useState<EventRegistration | null>(null);

    const openTicketModal = (reg: EventRegistration) => {
        setSelectedRegistration(reg);
        setTicketModalOpen(true);
    };

    const applyFilters = () => {
        router.get('/dashboard/tickets', { search, status }, { preserveState: true, preserveScroll: true });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') applyFilters();
    };

    return (
        <UserDashboardLayout title="My Tickets">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Tickets</h1>
                    <p className="text-sm text-gray-500 mt-1">View and manage your event registrations and tickets.</p>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="py-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Search by event name or reference..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="pl-9"
                                />
                            </div>
                            <select
                                value={status}
                                onChange={(e) => {
                                    setStatus(e.target.value);
                                    router.get('/dashboard/tickets', { search, status: e.target.value }, { preserveState: true, preserveScroll: true });
                                }}
                                className="rounded-md border border-gray-300 px-3 py-2 text-sm bg-white"
                            >
                                {STATUS_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            <Button onClick={applyFilters} variant="outline" size="sm" className="self-end">
                                <Search className="w-4 h-4 mr-1" /> Search
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Tickets list */}
                {registrations.data.length === 0 ? (
                    <Card>
                        <CardContent className="py-16 text-center">
                            <Ticket className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                            <p className="text-gray-500 font-medium">No tickets found</p>
                            <p className="text-sm text-gray-400 mt-1">Register for events to see your tickets here.</p>
                            <Link href="/events">
                                <Button className="mt-4" variant="outline">Browse Events</Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {registrations.data.map((reg) => (
                            <Card key={reg.id} className="overflow-hidden">
                                <div className="flex flex-col md:flex-row">
                                    {/* Left accent bar */}
                                    <div className={`w-full md:w-1.5 h-1.5 md:h-auto ${
                                        reg.status === 'confirmed' || reg.status === 'attended' ? 'bg-green-500' :
                                        reg.status === 'pending' ? 'bg-amber-500' :
                                        reg.status === 'cancelled' ? 'bg-red-500' : 'bg-gray-400'
                                    }`} />

                                    <div className="flex-1 p-5">
                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-semibold text-gray-900 truncate">
                                                    {reg.event?.title ?? 'Event'}
                                                </h3>

                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        {reg.event?.start_at
                                                            ? new Date(reg.event.start_at).toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
                                                            : '—'}
                                                    </span>
                                                    {reg.event?.venue && (
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="w-3.5 h-3.5" />
                                                            {reg.event.venue}{reg.event.city ? `, ${reg.event.city}` : ''}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex flex-wrap items-center gap-2 mt-3">
                                                    <Badge variant={STATUS_VARIANT[reg.status] ?? 'secondary'}>
                                                        {reg.status}
                                                    </Badge>
                                                    {reg.ticket && (
                                                        <Badge variant="outline" className="text-xs">
                                                            {reg.ticket.name}
                                                        </Badge>
                                                    )}
                                                    <span className="text-xs font-mono text-gray-400">{reg.reference_no}</span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end gap-2">
                                                <p className="text-lg font-bold text-gray-900">
                                                    {Number(reg.total_amount) > 0
                                                        ? `RM ${Number(reg.total_amount).toFixed(2)}`
                                                        : 'Free'
                                                    }
                                                </p>
                                                <span className="text-xs text-gray-400">
                                                    {reg.quantity > 1 ? `${reg.quantity} tickets` : '1 ticket'}
                                                </span>
                                                {(reg.status === 'confirmed' || reg.status === 'attended') && (
                                                    <div className="flex gap-2 mt-1">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-xs"
                                                            onClick={() => openTicketModal(reg)}
                                                        >
                                                            <QrCode className="w-3.5 h-3.5 mr-1" />
                                                            View {reg.quantity > 1 ? `${reg.quantity} Tickets` : 'Ticket'}
                                                        </Button>
                                                    </div>
                                                )}
                                                {reg.status !== 'confirmed' && reg.status !== 'attended' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-xs mt-1"
                                                        onClick={() => openTicketModal(reg)}
                                                    >
                                                        View Details
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Products if any */}
                                        {reg.products && reg.products.length > 0 && (
                                            <div className="mt-3 pt-3 border-t">
                                                <p className="text-xs font-medium text-gray-400 uppercase mb-1">Add-ons</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {reg.products.map((p) => (
                                                        <span key={p.id} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                            {p.product?.name ?? 'Product'} {p.variant ? `(${p.variant})` : ''} × {p.quantity}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))}

                        {/* Pagination */}
                        {registrations.last_page > 1 && (
                            <div className="flex items-center justify-center gap-2 pt-4">
                                {registrations.links.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url ?? '#'}
                                        preserveState
                                        preserveScroll
                                        className={`px-3 py-1.5 rounded text-sm ${
                                            link.active
                                                ? 'bg-brand text-white font-medium'
                                                : link.url
                                                    ? 'text-gray-600 hover:bg-gray-100'
                                                    : 'text-gray-300 cursor-not-allowed'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <TicketPreviewModal
                registration={selectedRegistration}
                open={ticketModalOpen}
                onOpenChange={setTicketModalOpen}
            />
        </UserDashboardLayout>
    );
}
