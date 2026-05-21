import UserDashboardLayout from '@/Layouts/UserDashboardLayout';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Separator } from '@/Components/ui/separator';
import { Link, router } from '@inertiajs/react';
import { ShoppingBag, Search, Eye, Calendar, MapPin, Hash, Ticket, Package, User, Mail, Phone, Building2, ArrowRight, CheckCircle2, Clock, XCircle, RefreshCw } from 'lucide-react';
import { type EventRegistration, type PaginatedData } from '@/types';
import { useState } from 'react';

interface Props {
    orders: PaginatedData<EventRegistration>;
    filters: {
        search: string;
        payment_status: string;
    };
}

const PAYMENT_COLOR: Record<string, string> = {
    paid:     'bg-emerald-100 text-emerald-700',
    pending:  'bg-amber-100 text-amber-700',
    refunded: 'bg-red-100 text-red-700',
    na:       'bg-gray-100 text-gray-500',
};

const STATUS_COLOR: Record<string, string> = {
    confirmed:  'bg-emerald-100 text-emerald-700',
    pending:    'bg-amber-100 text-amber-700',
    attended:   'bg-blue-100 text-blue-700',
    cancelled:  'bg-red-100 text-red-700',
    waitlisted: 'bg-purple-100 text-purple-700',
};

const PAYMENT_TABS = [
    { label: 'All',      value: '',         icon: ShoppingBag },
    { label: 'Paid',     value: 'paid',     icon: CheckCircle2 },
    { label: 'Pending',  value: 'pending',  icon: Clock },
    { label: 'Refunded', value: 'refunded', icon: RefreshCw },
    { label: 'Free',     value: 'na',       icon: XCircle },
];

export default function Orders({ orders, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [paymentStatus, setPaymentStatus] = useState(filters.payment_status || '');
    const [selectedOrder, setSelectedOrder] = useState<EventRegistration | null>(null);

    const applyFilters = (overrides?: { search?: string; payment_status?: string }) => {
        router.get('/dashboard/orders', {
            search:         overrides?.search         ?? search,
            payment_status: overrides?.payment_status ?? paymentStatus,
        }, { preserveState: true, preserveScroll: true });
    };

    const handleTabChange = (value: string) => {
        setPaymentStatus(value);
        applyFilters({ payment_status: value });
    };

    return (
        <UserDashboardLayout title="Order History">
            <div className="space-y-6">

                {/* ── Hero header ── */}
                <div className="rounded-2xl overflow-hidden shadow-md" style={{ background: 'linear-gradient(135deg, #001830 0%, #003366 50%, #006e88 100%)' }}>
                    <div className="relative px-5 py-5 sm:px-7 sm:py-6 flex items-center justify-between">
                        <div className="relative z-10 min-w-0 pr-3">
                            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Order History</h1>
                            <p className="text-sm mt-1" style={{ color: 'rgba(200,244,249,0.6)' }}>All your registrations and purchases</p>
                        </div>
                        <div className="relative z-10 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg" style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}>
                            <ShoppingBag className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                        </div>
                    </div>
                </div>

                {/* â”€â”€ Payment status tabs â”€â”€ */}
                <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
                    {PAYMENT_TABS.map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => handleTabChange(tab.value)}
                            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                                paymentStatus === tab.value
                                    ? 'bg-brand text-white shadow-sm shadow-brand/30'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:border-brand/50 hover:text-brand'
                            }`}
                        >
                            <tab.icon className="w-3.5 h-3.5" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* â”€â”€ Search â”€â”€ */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by reference or event name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                        className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors"
                    />
                </div>

                {/* â”€â”€ Order cards â”€â”€ */}
                {orders.data.length === 0 ? (
                    <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 py-16 flex flex-col items-center text-center">
                        <div className="w-16 h-16 rounded-full bg-brand/10 flex items-center justify-center mb-4">
                            <ShoppingBag className="w-8 h-8 text-brand" />
                        </div>
                        <h3 className="font-semibold text-brand-navy text-lg">No orders found</h3>
                        <p className="text-sm text-gray-500 mt-1 max-w-xs">
                            {paymentStatus ? 'Try a different filter.' : 'Register for an event to create your first order.'}
                        </p>
                        <Link
                            href="/events"
                            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white bg-brand hover:bg-brand-dark px-5 py-2.5 rounded-xl transition-colors"
                        >
                            Browse Events <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {orders.data.map((order) => (
                            /* â”€â”€ Receipt-style order card â”€â”€ */
                            <div
                                key={order.id}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200"
                            >
                                {/* Card top â€” reference + date */}
                                <div className="flex items-center justify-between px-5 py-3 border-b border-dashed border-gray-100 bg-gray-50/50">
                                    <span className="text-xs font-mono text-gray-400">{order.reference_no}</span>
                                    <span className="text-xs text-gray-400">
                                        {new Date(order.created_at).toLocaleDateString('en-MY', {
                                            day: 'numeric', month: 'short', year: 'numeric'
                                        })}
                                    </span>
                                </div>

                                {/* Card body */}
                                <div className="flex items-start gap-4 px-5 py-4">
                                    {/* Event image thumbnail */}
                                    <div className="w-14 h-14 rounded-xl flex-shrink-0 overflow-hidden bg-gradient-to-br from-brand-navy to-brand">
                                        {order.event?.media?.url ? (
                                            <img src={order.event.media.url} alt={order.event.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Calendar className="w-6 h-6 text-white/30" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-brand-navy text-sm truncate">{order.event?.title ?? '—'}</p>
                                        <div className="flex flex-wrap gap-2 mt-1.5">
                                            {order.ticket && (
                                                <span className="text-xs text-gray-500">{order.ticket.name} &times; {order.quantity}</span>
                                            )}
                                            {order.products && order.products.length > 0 && (
                                                <span className="text-xs text-gray-400">+{order.products.length} add-on{order.products.length > 1 ? 's' : ''}</span>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 mt-2">
                                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${PAYMENT_COLOR[order.payment_status] ?? 'bg-gray-100 text-gray-500'}`}>
                                                {order.payment_status === 'na' ? 'Free' : order.payment_status}
                                            </span>
                                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[order.status] ?? 'bg-gray-100 text-gray-500'}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex-shrink-0 text-right">
                                        <p className="text-base font-bold text-brand-navy">
                                            {Number(order.total_amount) > 0 ? `RM ${Number(order.total_amount).toFixed(2)}` : 'Free'}
                                        </p>
                                        <button
                                            onClick={() => setSelectedOrder(order)}
                                            className="mt-2 text-xs font-medium text-brand hover:text-brand-dark flex items-center gap-1 ml-auto"
                                        >
                                            <Eye className="w-3.5 h-3.5" /> Details
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Pagination */}
                        {orders.last_page > 1 && (
                            <div className="flex items-center justify-center gap-2 pt-4">
                                {orders.links.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url ?? '#'}
                                        preserveState
                                        preserveScroll
                                        className={`px-3 py-1.5 rounded-xl text-sm font-medium ${
                                            link.active
                                                ? 'bg-brand text-white'
                                                : link.url
                                                    ? 'bg-white border border-gray-200 text-gray-600 hover:border-brand/50 hover:text-brand'
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

            {/* â”€â”€ Order Detail Modal â”€â”€ */}
            <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-brand-navy">
                            <ShoppingBag className="w-5 h-5 text-brand" />
                            Order Details
                        </DialogTitle>
                    </DialogHeader>

                    {selectedOrder && (() => {
                        const o = selectedOrder;
                        const event = o.event;
                        return (
                            <div className="space-y-4 text-sm">
                                {/* Reference pill */}
                                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                                    <span className="flex items-center gap-1.5 text-gray-500 text-xs">
                                        <Hash className="w-3.5 h-3.5" /> Reference
                                    </span>
                                    <span className="font-mono font-bold text-brand-navy">{o.reference_no}</span>
                                </div>

                                {/* Event info */}
                                {event && (
                                    <div className="space-y-1.5">
                                        <p className="font-bold text-base text-brand-navy">{event.title}</p>
                                        <div className="flex flex-wrap gap-3 text-gray-500 text-xs">
                                            {event.start_at && (
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3.5 h-3.5 text-brand" />
                                                    {new Date(event.start_at).toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                                                </span>
                                            )}
                                            {event.venue && (
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="w-3.5 h-3.5 text-brand" />
                                                    {[event.venue, event.city].filter(Boolean).join(', ')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <Separator />

                                {/* Attendee info */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-xs text-gray-400 flex items-center gap-1 mb-0.5"><User className="w-3 h-3" /> Name</p>
                                        <p className="font-medium">{o.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 flex items-center gap-1 mb-0.5"><Mail className="w-3 h-3" /> Email</p>
                                        <p className="font-medium break-all">{o.email}</p>
                                    </div>
                                    {o.phone && (
                                        <div>
                                            <p className="text-xs text-gray-400 flex items-center gap-1 mb-0.5"><Phone className="w-3 h-3" /> Phone</p>
                                            <p className="font-medium">{o.phone}</p>
                                        </div>
                                    )}
                                    {o.company && (
                                        <div>
                                            <p className="text-xs text-gray-400 flex items-center gap-1 mb-0.5"><Building2 className="w-3 h-3" /> Company</p>
                                            <p className="font-medium">{o.company}</p>
                                        </div>
                                    )}
                                </div>

                                <Separator />

                                {/* Ticket line */}
                                <div>
                                    <p className="text-xs text-gray-400 flex items-center gap-1 mb-2"><Ticket className="w-3 h-3" /> Ticket</p>
                                    <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5">
                                        <span>{o.ticket?.name ?? '—'} &times; {o.quantity}</span>
                                        <span className="font-semibold">RM {Number(o.subtotal).toFixed(2)}</span>
                                    </div>
                                    {Number(o.discount_amount) > 0 && (
                                        <div className="flex justify-between text-xs text-emerald-600 px-3 mt-1">
                                            <span>Discount</span>
                                            <span>&minus; RM {Number(o.discount_amount).toFixed(2)}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Add-ons */}
                                {o.products && o.products.length > 0 && (
                                    <div>
                                        <p className="text-xs text-gray-400 flex items-center gap-1 mb-2"><Package className="w-3 h-3" /> Add-ons</p>
                                        <div className="rounded-xl border border-gray-100 divide-y divide-gray-100">
                                            {o.products.map((p) => {
                                                let variants: string[] = [];
                                                if (p.variant) {
                                                    try {
                                                        const parsed = JSON.parse(p.variant);
                                                        variants = Array.isArray(parsed) ? parsed : [p.variant];
                                                    } catch { variants = [p.variant]; }
                                                }
                                                return (
                                                    <div key={p.id} className="flex items-center justify-between px-3 py-2.5">
                                                        <span>
                                                            {p.product?.name ?? 'Item'}
                                                            {variants.length > 0 && <span className="text-gray-400 ml-1">({variants.join(', ')})</span>}
                                                            <span className="text-gray-400 ml-1">&times; {p.quantity}</span>
                                                        </span>
                                                        <span className="font-semibold">RM {(Number(p.unit_price) * p.quantity).toFixed(2)}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                <Separator />

                                {/* Total row */}
                                <div className="space-y-1.5">
                                    <div className="flex justify-between font-bold text-base text-brand-navy">
                                        <span>Total</span>
                                        <span>{Number(o.total_amount) > 0 ? `RM ${Number(o.total_amount).toFixed(2)}` : 'Free'}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-500">
                                        <span>Payment</span>
                                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${PAYMENT_COLOR[o.payment_status] ?? 'bg-gray-100 text-gray-500'}`}>
                                            {o.payment_status === 'na' ? 'Free' : o.payment_status}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-500">
                                        <span>Registration</span>
                                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[o.status] ?? 'bg-gray-100 text-gray-500'}`}>
                                            {o.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </DialogContent>
            </Dialog>
        </UserDashboardLayout>
    );
}
