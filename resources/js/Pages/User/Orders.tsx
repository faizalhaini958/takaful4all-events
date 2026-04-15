import UserDashboardLayout from '@/Layouts/UserDashboardLayout';
import { Card, CardContent } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Separator } from '@/Components/ui/separator';
import { Link, router } from '@inertiajs/react';
import { ShoppingBag, Search, Eye, Calendar, MapPin, Hash, Ticket, Package, User, Mail, Phone, Building2 } from 'lucide-react';
import { type EventRegistration, type PaginatedData } from '@/types';
import { useState } from 'react';

interface Props {
    orders: PaginatedData<EventRegistration>;
    filters: {
        search: string;
        payment_status: string;
    };
    totals: {
        all: number;
        paid: number;
        pending: number;
        refunded: number;
    };
}

const PAYMENT_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    paid:     'default',
    pending:  'secondary',
    refunded: 'destructive',
    na:       'outline',
};

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    confirmed: 'default',
    pending:   'secondary',
    attended:  'default',
    cancelled: 'destructive',
    waitlisted: 'outline',
};

const PAYMENT_OPTIONS = [
    { value: '', label: 'All Payments' },
    { value: 'paid', label: 'Paid' },
    { value: 'pending', label: 'Pending' },
    { value: 'refunded', label: 'Refunded' },
    { value: 'na', label: 'N/A (Free)' },
];

export default function Orders({ orders, filters, totals }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [paymentStatus, setPaymentStatus] = useState(filters.payment_status || '');
    const [selectedOrder, setSelectedOrder] = useState<EventRegistration | null>(null);

    const applyFilters = () => {
        router.get('/dashboard/orders', { search, payment_status: paymentStatus }, { preserveState: true, preserveScroll: true });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') applyFilters();
    };

    return (
        <UserDashboardLayout title="Order History">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Order History</h1>
                    <p className="text-sm text-gray-500 mt-1">Review all your past and current orders.</p>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-gray-50">
                        <CardContent className="py-4">
                            <p className="text-xs font-medium text-gray-500 uppercase">Total Orders</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{totals.all}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-green-50">
                        <CardContent className="py-4">
                            <p className="text-xs font-medium text-green-600 uppercase">Paid</p>
                            <p className="text-2xl font-bold text-green-700 mt-1">{totals.paid}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-amber-50">
                        <CardContent className="py-4">
                            <p className="text-xs font-medium text-amber-600 uppercase">Pending</p>
                            <p className="text-2xl font-bold text-amber-700 mt-1">{totals.pending}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-red-50">
                        <CardContent className="py-4">
                            <p className="text-xs font-medium text-red-600 uppercase">Refunded</p>
                            <p className="text-2xl font-bold text-red-700 mt-1">{totals.refunded}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="py-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Search by reference or event name..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="pl-9"
                                />
                            </div>
                            <select
                                value={paymentStatus}
                                onChange={(e) => {
                                    setPaymentStatus(e.target.value);
                                    router.get('/dashboard/orders', { search, payment_status: e.target.value }, { preserveState: true, preserveScroll: true });
                                }}
                                className="rounded-md border border-gray-300 px-3 py-2 text-sm bg-white"
                            >
                                {PAYMENT_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            <Button onClick={applyFilters} variant="outline" size="sm" className="self-end">
                                <Search className="w-4 h-4 mr-1" /> Search
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Orders table */}
                {orders.data.length === 0 ? (
                    <Card>
                        <CardContent className="py-16 text-center">
                            <ShoppingBag className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                            <p className="text-gray-500 font-medium">No orders found</p>
                            <p className="text-sm text-gray-400 mt-1">Your order history will appear here.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Reference</TableHead>
                                            <TableHead>Event</TableHead>
                                            <TableHead>Ticket</TableHead>
                                            <TableHead>Qty</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Payment</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {orders.data.map((order) => (
                                            <TableRow key={order.id}>
                                                <TableCell className="font-mono text-xs whitespace-nowrap">
                                                    {order.reference_no}
                                                </TableCell>
                                                <TableCell className="max-w-[200px] truncate">
                                                    {order.event?.title ?? '—'}
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    <div>{order.ticket?.name ?? '—'}</div>
                                                    {order.products && order.products.length > 0 && (
                                                        <div className="text-xs text-gray-400 mt-0.5">
                                                            +{order.products.length} add-on{order.products.length > 1 ? 's' : ''}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>{order.quantity}</TableCell>
                                                <TableCell className="font-medium whitespace-nowrap">
                                                    {Number(order.total_amount) > 0
                                                        ? `RM ${Number(order.total_amount).toFixed(2)}`
                                                        : 'Free'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={PAYMENT_VARIANT[order.payment_status] ?? 'outline'} className="text-xs">
                                                        {order.payment_status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={STATUS_VARIANT[order.status] ?? 'secondary'} className="text-xs">
                                                        {order.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm text-gray-500 whitespace-nowrap">
                                                    {new Date(order.created_at).toLocaleDateString('en-MY', {
                                                        day: 'numeric', month: 'short', year: 'numeric'
                                                    })}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(order)}>
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>

                        {/* Pagination */}
                        {orders.last_page > 1 && (
                            <div className="flex items-center justify-center gap-2 p-4 border-t">
                                {orders.links.map((link, i) => (
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
                    </Card>
                )}
            </div>

            {/* Order Detail Modal */}
            <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ShoppingBag className="w-5 h-5" />
                            Order Details
                        </DialogTitle>
                    </DialogHeader>

                    {selectedOrder && (() => {
                        const o = selectedOrder;
                        const event = o.event;
                        return (
                            <div className="space-y-4 text-sm">
                                {/* Reference */}
                                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border">
                                    <span className="flex items-center gap-1.5 text-gray-500">
                                        <Hash className="w-4 h-4" /> Reference
                                    </span>
                                    <span className="font-mono font-bold">{o.reference_no}</span>
                                </div>

                                {/* Event */}
                                {event && (
                                    <div className="space-y-1">
                                        <p className="font-semibold text-base">{event.title}</p>
                                        <div className="flex flex-wrap gap-3 text-gray-500 text-xs">
                                            {event.start_at && (
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {new Date(event.start_at).toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                                                </span>
                                            )}
                                            {event.venue && (
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="w-3.5 h-3.5" />
                                                    {[event.venue, event.city].filter(Boolean).join(', ')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <Separator />

                                {/* Attendee */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-xs text-gray-400 flex items-center gap-1"><User className="w-3 h-3" /> Name</p>
                                        <p className="font-medium">{o.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 flex items-center gap-1"><Mail className="w-3 h-3" /> Email</p>
                                        <p className="font-medium break-all">{o.email}</p>
                                    </div>
                                    {o.phone && (
                                        <div>
                                            <p className="text-xs text-gray-400 flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</p>
                                            <p className="font-medium">{o.phone}</p>
                                        </div>
                                    )}
                                    {o.company && (
                                        <div>
                                            <p className="text-xs text-gray-400 flex items-center gap-1"><Building2 className="w-3 h-3" /> Company</p>
                                            <p className="font-medium">{o.company}</p>
                                        </div>
                                    )}
                                </div>

                                <Separator />

                                {/* Ticket */}
                                <div>
                                    <p className="text-xs text-gray-400 flex items-center gap-1 mb-2"><Ticket className="w-3 h-3" /> Ticket</p>
                                    <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                                        <span>{o.ticket?.name ?? '—'} × {o.quantity}</span>
                                        <span className="font-medium">RM {Number(o.subtotal).toFixed(2)}</span>
                                    </div>
                                    {Number(o.discount_amount) > 0 && (
                                        <div className="flex justify-between text-xs text-green-600 px-3 mt-1">
                                            <span>Discount</span>
                                            <span>− RM {Number(o.discount_amount).toFixed(2)}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Add-ons */}
                                {o.products && o.products.length > 0 && (
                                    <div>
                                        <p className="text-xs text-gray-400 flex items-center gap-1 mb-2"><Package className="w-3 h-3" /> Add-ons</p>
                                        <div className="rounded-lg border divide-y">
                                            {o.products.map((p) => (
                                                <div key={p.id} className="flex items-center justify-between px-3 py-2">
                                                    <span>
                                                        {p.product?.name ?? 'Item'}
                                                        {p.variant && <span className="text-gray-400 ml-1">({p.variant})</span>}
                                                        <span className="text-gray-400 ml-1">× {p.quantity}</span>
                                                    </span>
                                                    <span className="font-medium">RM {(Number(p.unit_price) * p.quantity).toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <Separator />

                                {/* Totals */}
                                <div className="space-y-1">
                                    <div className="flex justify-between font-bold text-base">
                                        <span>Total</span>
                                        <span>{Number(o.total_amount) > 0 ? `RM ${Number(o.total_amount).toFixed(2)}` : 'Free'}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-500">
                                        <span>Payment Status</span>
                                        <Badge variant={PAYMENT_VARIANT[o.payment_status] ?? 'outline'} className="text-xs">{o.payment_status}</Badge>
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-500">
                                        <span>Registration Status</span>
                                        <Badge variant={STATUS_VARIANT[o.status] ?? 'secondary'} className="text-xs">{o.status}</Badge>
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
