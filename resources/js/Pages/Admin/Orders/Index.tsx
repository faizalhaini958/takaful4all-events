import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Separator } from '@/Components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { ShoppingCart, Package, DollarSign, Search, Eye, ChevronLeft, ChevronRight, CalendarDays, User, Hash, Tag, X } from 'lucide-react';
import { type EventRegistrationProduct, type PaginatedData, type Event, type EventProduct } from '@/types';

interface OrderItem extends Omit<EventRegistrationProduct, 'product'> {
    registration: {
        id: number;
        reference_no: string;
        name: string;
        email: string;
        status: string;
        event: Pick<Event, 'id' | 'title' | 'slug'> | null;
        ticket: { id: number; name: string } | null;
    };
    product: EventProduct | null;
}

interface Props {
    orders: PaginatedData<OrderItem>;
    stats: {
        total_orders: number;
        total_items: number;
        total_revenue: number;
    };
    events: Pick<Event, 'id' | 'title' | 'slug'>[];
    products: Pick<EventProduct, 'id' | 'name'>[];
    currentSearch: string;
    currentEvent: string;
    currentProduct: string;
}

const STATUS_PILL: Record<string, string> = {
    pending:    'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    confirmed:  'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    attended:   'bg-brand/15 text-brand border-brand/30',
    cancelled:  'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30',
    waitlisted: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
};

export default function OrdersIndex({ orders, stats, events, products, currentSearch, currentEvent, currentProduct }: Props) {
    const [search, setSearch] = useState(currentSearch);
    const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);

    function applyFilters(overrides: Record<string, string> = {}) {
        const params: Record<string, string> = {
            search,
            event: currentEvent,
            product: currentProduct,
            ...overrides,
        };
        Object.keys(params).forEach(k => {
            if (!params[k] || params[k] === 'all') delete params[k];
        });
        router.get('/admin/orders', params, { preserveState: true, preserveScroll: true });
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        applyFilters();
    }

    const hasActiveFilters = !!(currentSearch || currentEvent || currentProduct);

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Product Orders</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Product purchases from event registrations</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-xl border border-border/60 bg-card p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                                <ShoppingCart className="w-5 h-5 text-primary" />
                            </div>
                        </div>
                        <p className="text-3xl font-bold tabular-nums text-foreground">{stats.total_orders}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">Total Orders</p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-card p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-violet-500/10">
                                <Package className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                            </div>
                        </div>
                        <p className="text-3xl font-bold tabular-nums text-foreground">{stats.total_items}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">Total Items</p>
                    </div>
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/15">
                                <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                        </div>
                        <p className="text-3xl font-bold tabular-nums text-foreground">RM {Number(stats.total_revenue).toLocaleString('en-MY', { minimumFractionDigits: 2 })}</p>
                        <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">Total Revenue</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <form onSubmit={handleSearch} className="flex gap-2 flex-1">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, email or reference..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Button type="submit" variant="secondary" size="sm" className="h-9">Search</Button>
                    </form>

                    <Select
                        value={currentEvent || 'all'}
                        onValueChange={v => applyFilters({ event: v === 'all' ? '' : v, product: '' })}
                    >
                        <SelectTrigger className="w-full sm:w-[220px] h-9">
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
                        value={currentProduct || 'all'}
                        onValueChange={v => applyFilters({ product: v === 'all' ? '' : v })}
                    >
                        <SelectTrigger className="w-full sm:w-[200px] h-9">
                            <SelectValue placeholder="All Products" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Products</SelectItem>
                            {products.map(p => (
                                <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {hasActiveFilters && (
                        <Button variant="ghost" size="sm" className="h-9 text-muted-foreground hover:text-foreground" onClick={() => { setSearch(''); applyFilters({ search: '', event: '', product: '' }); }}>
                            <X className="w-3.5 h-3.5 mr-1" /> Clear
                        </Button>
                    )}
                </div>

                {/* Orders Table */}
                <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b border-border/60 bg-muted/40 hover:bg-muted/40">
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reference</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Buyer</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Event</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Qty</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Amount</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.data.map(order => {
                                const subtotal = order.quantity * Number(order.unit_price);
                                return (
                                    <TableRow key={order.id} className="cursor-pointer" onClick={() => setSelectedOrder(order)}>
                                        <TableCell className="font-mono text-xs text-primary">
                                            {order.registration?.reference_no}
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium text-sm text-foreground">{order.registration?.name}</div>
                                            <div className="text-xs text-muted-foreground">{order.registration?.email}</div>
                                        </TableCell>
                                        <TableCell className="text-sm max-w-[180px]">
                                            {order.registration?.event ? (
                                                <span className="text-foreground truncate block">{order.registration.event.title}</span>
                                            ) : <span className="text-muted-foreground/50">—</span>}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2.5">
                                                {order.product?.media ? (
                                                    <img src={order.product.media.url} alt={order.product.name} className="w-8 h-8 rounded-md object-cover border border-border/40" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-md bg-muted/60 flex items-center justify-center">
                                                        <Package className="w-3.5 h-3.5 text-muted-foreground/50" />
                                                    </div>
                                                )}
                                                <div>
                                                    <span className="text-sm font-medium text-foreground">{order.product?.name ?? '—'}</span>
                                                    {order.variant && <span className="block text-xs text-muted-foreground">{order.variant}</span>}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center tabular-nums font-medium">{order.quantity}</TableCell>
                                        <TableCell className="text-right">
                                            <span className="font-semibold tabular-nums text-foreground">RM {subtotal.toFixed(2)}</span>
                                            {order.quantity > 1 && (
                                                <span className="block text-[11px] text-muted-foreground tabular-nums">@ RM {Number(order.unit_price).toFixed(2)}</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize ${STATUS_PILL[order.registration?.status] ?? STATUS_PILL.pending}`}>
                                                {order.registration?.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                            {new Date(order.created_at).toLocaleDateString('en-MY', {
                                                day: '2-digit', month: 'short', year: 'numeric',
                                            })}
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={e => { e.stopPropagation(); setSelectedOrder(order); }}>
                                                <Eye className="w-3.5 h-3.5" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {orders.data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-16 text-muted-foreground">
                                        <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-15" />
                                        <p className="font-medium">{hasActiveFilters ? 'No orders match the current filters.' : 'No product orders yet.'}</p>
                                        {hasActiveFilters && (
                                            <Button variant="link" size="sm" className="mt-2 text-primary" onClick={() => { setSearch(''); applyFilters({ search: '', event: '', product: '' }); }}>
                                                Clear all filters
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    {/* Pagination Footer */}
                    {orders.last_page > 1 && (
                        <>
                            <Separator />
                            <div className="flex items-center justify-between px-4 py-3">
                                <p className="text-sm text-muted-foreground">
                                    Showing <span className="font-medium text-foreground">{orders.from}</span> to <span className="font-medium text-foreground">{orders.to}</span> of <span className="font-medium text-foreground">{orders.total}</span>
                                </p>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">
                                        Page {orders.current_page} of {orders.last_page}
                                    </span>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={orders.current_page <= 1} asChild={orders.current_page > 1}>
                                            {orders.current_page > 1 ? (
                                                <Link href={orders.links[0]?.url ?? '#'} preserveState preserveScroll><ChevronLeft className="w-4 h-4" /></Link>
                                            ) : (
                                                <span><ChevronLeft className="w-4 h-4" /></span>
                                            )}
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={orders.current_page >= orders.last_page} asChild={orders.current_page < orders.last_page}>
                                            {orders.current_page < orders.last_page ? (
                                                <Link href={orders.links[orders.links.length - 1]?.url ?? '#'} preserveState preserveScroll><ChevronRight className="w-4 h-4" /></Link>
                                            ) : (
                                                <span><ChevronRight className="w-4 h-4" /></span>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Order Detail Modal */}
            <Dialog open={!!selectedOrder} onOpenChange={open => { if (!open) setSelectedOrder(null); }}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5 text-primary" />
                            Order Details
                        </DialogTitle>
                    </DialogHeader>

                    {selectedOrder && (() => {
                        const subtotal = selectedOrder.quantity * Number(selectedOrder.unit_price);
                        return (
                            <div className="space-y-4 -mt-1">
                                {/* Product Section */}
                                <div>
                                    <p className="text-[11px] font-bold uppercase text-primary tracking-widest mb-2">Product</p>
                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border/40">
                                        {selectedOrder.product?.media ? (
                                            <img src={selectedOrder.product.media.url} alt={selectedOrder.product.name} className="w-14 h-14 rounded-lg object-cover border border-border/40" />
                                        ) : (
                                            <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center">
                                                <Package className="w-6 h-6 text-muted-foreground/40" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-foreground">{selectedOrder.product?.name ?? '—'}</p>
                                            {selectedOrder.variant && (
                                                <span className="inline-flex items-center gap-1 mt-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                                                    <Tag className="w-3 h-3" /> {selectedOrder.variant}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Pricing */}
                                <div className="rounded-lg border border-border/40 overflow-hidden">
                                    <div className="grid grid-cols-3 text-center divide-x divide-border/40">
                                        <div className="p-3">
                                            <p className="text-xs text-muted-foreground">Qty</p>
                                            <p className="text-lg font-bold tabular-nums">{selectedOrder.quantity}</p>
                                        </div>
                                        <div className="p-3">
                                            <p className="text-xs text-muted-foreground">Unit Price</p>
                                            <p className="text-lg font-bold tabular-nums">RM {Number(selectedOrder.unit_price).toFixed(2)}</p>
                                        </div>
                                        <div className="p-3 bg-primary/5">
                                            <p className="text-xs text-primary font-medium">Subtotal</p>
                                            <p className="text-lg font-bold tabular-nums text-primary">RM {subtotal.toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Buyer */}
                                <div>
                                    <p className="text-[11px] font-bold uppercase text-primary tracking-widest mb-2">Buyer</p>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div className="flex items-start gap-2">
                                            <User className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                                            <div>
                                                <p className="font-medium text-foreground">{selectedOrder.registration?.name}</p>
                                                <p className="text-xs text-muted-foreground">{selectedOrder.registration?.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <Hash className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                                            <div>
                                                <p className="font-mono text-xs text-foreground">{selectedOrder.registration?.reference_no}</p>
                                                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize mt-1 ${STATUS_PILL[selectedOrder.registration?.status] ?? STATUS_PILL.pending}`}>
                                                    {selectedOrder.registration?.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Event & Date */}
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    {selectedOrder.registration?.event && (
                                        <div className="flex items-start gap-2">
                                            <CalendarDays className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Event</p>
                                                <p className="font-medium text-foreground">{selectedOrder.registration.event.title}</p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex items-start gap-2">
                                        <CalendarDays className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Order Date</p>
                                            <p className="font-medium text-foreground">{new Date(selectedOrder.created_at).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Actions */}
                                <div className="flex justify-end gap-2">
                                    {selectedOrder.registration?.event && (
                                        <Button size="sm" asChild>
                                            <Link href={`/admin/events/${selectedOrder.registration.event.slug}/registrations/${selectedOrder.registration.id}`}>
                                                <Eye className="w-3.5 h-3.5 mr-1.5" /> View Registration
                                            </Link>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })()}
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
