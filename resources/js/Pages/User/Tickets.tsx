import UserDashboardLayout from '@/Layouts/UserDashboardLayout';
import { Link } from '@inertiajs/react';
import { Ticket, Calendar, MapPin, Search, QrCode, Clock, ArrowRight, Package } from 'lucide-react';
import { type EventRegistration, type PaginatedData } from '@/types';
import { getRegistrationStatusLabel } from '@/lib/status-colors';
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

const STATUS_COLOR: Record<string, string> = {
    confirmed:         'bg-emerald-100 text-emerald-700',
    pending:           'bg-amber-100 text-amber-700',
    awaiting_payment:  'bg-orange-100 text-orange-700',
    attended:          'bg-blue-100 text-blue-700',
    cancelled:         'bg-red-100 text-red-700',
    waitlisted:        'bg-purple-100 text-purple-700',
};

const STATUS_ACCENT: Record<string, string> = {
    confirmed:         'bg-emerald-500',
    pending:           'bg-amber-400',
    awaiting_payment:  'bg-orange-400',
    attended:          'bg-blue-500',
    cancelled:         'bg-red-400',
    waitlisted:        'bg-purple-400',
};

const TAB_FILTERS = [
    { label: 'All',       value: '' },
    { label: 'Upcoming',  value: 'confirmed' },
    { label: 'Attended',  value: 'attended' },
    { label: 'Pending',   value: 'pending' },
    { label: 'Awaiting Payment', value: 'awaiting_payment' },
    { label: 'Cancelled', value: 'cancelled' },
];

function getDaysUntil(dateStr: string): number {
    const d = new Date(dateStr);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    return Math.round((d.getTime() - now.getTime()) / 86400000);
}

function CountdownChip({ dateStr }: { dateStr: string }) {
    const days = getDaysUntil(dateStr);
    if (days < 0) return null;
    if (days === 0) return <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-semibold animate-pulse">Today!</span>;
    if (days <= 7) return <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold"><Clock className="w-3 h-3" />In {days}d</span>;
    return <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-brand/10 text-brand font-semibold"><Clock className="w-3 h-3" />In {days} days</span>;
}

export default function Tickets({ registrations, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [ticketModalOpen, setTicketModalOpen] = useState(false);
    const [selectedRegistration, setSelectedRegistration] = useState<EventRegistration | null>(null);

    const openTicketModal = (reg: EventRegistration) => {
        setSelectedRegistration(reg);
        setTicketModalOpen(true);
    };

    const applyFilters = (overrides?: { search?: string; status?: string }) => {
        router.get('/dashboard/tickets', {
            search: overrides?.search ?? search,
            status: overrides?.status ?? status,
        }, { preserveState: true, preserveScroll: true });
    };

    const handleTabChange = (value: string) => {
        setStatus(value);
        applyFilters({ status: value });
    };

    return (
        <UserDashboardLayout title="My Tickets">
            <div className="space-y-6">

                {/* ── Hero header ── */}
                <div className="rounded-2xl overflow-hidden shadow-md" style={{ background: 'linear-gradient(135deg, #001830 0%, #003366 50%, #006e88 100%)' }}>
                    <div className="relative px-5 py-5 sm:px-7 sm:py-6 flex items-center justify-between">
                        <div className="relative z-10 min-w-0 pr-3">
                            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">My Tickets</h1>
                            <p className="text-sm mt-1" style={{ color: 'rgba(200,244,249,0.6)' }}>Your event registrations and tickets</p>
                        </div>
                        <div className="relative z-10 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg" style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}>
                            <Ticket className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                        </div>
                    </div>
                </div>

                {/* ── Status tabs — Ticket2U style ── */}
                <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
                    {TAB_FILTERS.map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => handleTabChange(tab.value)}
                            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                                status === tab.value
                                    ? 'bg-brand text-white shadow-sm shadow-brand/30'
                                    : 'bg-white dark:bg-card text-gray-600 dark:text-muted-foreground border border-gray-200 dark:border-border hover:border-brand/50 hover:text-brand'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* ── Search bar ── */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search by event name or reference number..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                        className="w-full pl-11 pr-4 py-3 bg-white dark:bg-card border border-gray-200 dark:border-border rounded-2xl text-sm dark:text-foreground focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors"
                    />
                </div>

                {/* ── Ticket cards or empty state ── */}
                {registrations.data.length === 0 ? (
                    <div className="bg-white dark:bg-card rounded-2xl border-2 border-dashed border-gray-200 dark:border-border py-16 flex flex-col items-center text-center">
                        <div className="w-16 h-16 rounded-full bg-brand/10 flex items-center justify-center mb-4">
                            <Ticket className="w-8 h-8 text-brand" />
                        </div>
                        <h3 className="font-semibold text-brand-navy text-lg">No tickets found</h3>
                        <p className="text-sm text-gray-500 dark:text-muted-foreground mt-1 max-w-xs">
                            {status ? 'Try a different filter or search.' : 'Register for an event to get your first ticket.'}
                        </p>
                        <Link
                            href="/events"
                            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white bg-brand hover:bg-brand-dark px-5 py-2.5 rounded-xl transition-colors"
                        >
                            Browse Events <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {registrations.data.map((reg) => (
                            /* ── Ticket card — boarding-pass style ── */
                            <div
                                key={reg.id}
                                className="bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                            >
                                <div className="flex flex-col sm:flex-row">

                                    {/* Left: event image */}
                                    <div className="sm:w-44 h-56 sm:h-auto flex-shrink-0 relative bg-gradient-to-br from-brand-navy to-brand overflow-hidden">
                                        {reg.event?.media?.url ? (
                                            <img
                                                src={reg.event.media.url}
                                                alt={reg.event.title}
                                                className="w-full h-full object-contain"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Calendar className="w-12 h-12 text-white/20" />
                                            </div>
                                        )}
                                        {/* Status accent top bar */}
                                        <div className={`absolute top-0 left-0 right-0 h-1 z-10 ${STATUS_ACCENT[reg.status] ?? 'bg-gray-300'}`} />
                                        {/* Countdown on image */}
                                        {reg.event?.start_at && getDaysUntil(reg.event.start_at) >= 0 && (
                                            <div className="absolute bottom-2 left-2 z-10">
                                                <CountdownChip dateStr={reg.event.start_at} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Middle: event details */}
                                    <div className="flex-1 p-4 sm:p-5 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className="font-bold text-brand-navy text-base leading-snug">
                                                {reg.event?.title ?? 'Event'}
                                            </h3>
                                            <span className={`flex-shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_COLOR[reg.status] ?? 'bg-gray-100 dark:bg-muted text-gray-600 dark:text-muted-foreground'}`}>
                                                {getRegistrationStatusLabel(reg.status, reg.payment_status)}
                                            </span>
                                        </div>

                                        <div className="mt-2.5 space-y-1.5 text-sm text-gray-500 dark:text-muted-foreground">
                                            {reg.event?.start_at && (
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-3.5 h-3.5 text-brand flex-shrink-0" />
                                                    <span>
                                                        {new Date(reg.event.start_at).toLocaleDateString('en-MY', {
                                                            weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
                                                        })}
                                                    </span>
                                                </div>
                                            )}
                                            {reg.event?.venue && (
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-3.5 h-3.5 text-brand flex-shrink-0" />
                                                    <span className="truncate">{reg.event.venue}{reg.event.city ? `, ${reg.event.city}` : ''}</span>
                                                </div>
                                            )}
                                            {reg.ticket && (
                                                <div className="flex items-center gap-2">
                                                    <Ticket className="w-3.5 h-3.5 text-brand flex-shrink-0" />
                                                    <span>{reg.ticket.name} × {reg.quantity}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Add-ons */}
                                        {reg.products && reg.products.length > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-1.5">
                                                {reg.products.map((p) => {
                                                    let variants: string[] = [];
                                                    if (p.variant) {
                                                        try {
                                                            const parsed = JSON.parse(p.variant);
                                                            variants = Array.isArray(parsed) ? parsed : [p.variant];
                                                        } catch { variants = [p.variant]; }
                                                    }
                                                    return (
                                                        <span key={p.id} className="inline-flex items-center gap-1 text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                                            <Package className="w-3 h-3" />
                                                            {p.product?.name ?? 'Add-on'}
                                                            {variants.length > 0 && ` (${variants.join(', ')})`}
                                                            {` ×${p.quantity}`}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Right: price + actions — perforated divider style */}
                                    <div className="border-t sm:border-t-0 sm:border-l border-dashed border-gray-200 dark:border-border flex sm:flex-col items-center justify-between sm:justify-center gap-3 sm:gap-4 px-5 py-4 sm:w-36 sm:flex-shrink-0">
                                        <div className="text-center">
                                            <p className="text-lg font-bold text-brand-navy">
                                                {Number(reg.total_amount) > 0 ? `RM ${Number(reg.total_amount).toFixed(2)}` : 'Free'}
                                            </p>
                                            <p className="text-[11px] text-gray-400 dark:text-muted-foreground font-mono">{reg.reference_no}</p>
                                        </div>

                                        {(reg.status === 'confirmed' || reg.status === 'attended') ? (
                                            <button
                                                onClick={() => openTicketModal(reg)}
                                                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-white bg-brand hover:bg-brand-dark px-4 py-2.5 rounded-xl transition-colors"
                                            >
                                                <QrCode className="w-4 h-4" />
                                                View {reg.quantity > 1 ? `(${reg.quantity})` : ''}
                                            </button>
                                        ) : reg.status === 'pending' ? (
                                            <span className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-xl font-medium text-center">
                                                Awaiting confirmation
                                            </span>
                                        ) : reg.status === 'awaiting_payment' ? (
                                            <span className="text-xs text-orange-600 bg-orange-50 px-3 py-1.5 rounded-xl font-medium text-center">
                                                Awaiting payment
                                            </span>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
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
                                        className={`px-3 py-1.5 rounded-xl text-sm font-medium ${
                                            link.active
                                                ? 'bg-brand text-white'
                                                : link.url
                                                    ? 'bg-white dark:bg-card border border-gray-200 dark:border-border text-gray-600 dark:text-muted-foreground hover:border-brand/50 hover:text-brand'
                                                    : 'text-gray-300 dark:text-muted-foreground/30 cursor-not-allowed'
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
