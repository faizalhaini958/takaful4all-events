import AdminLayout from '@/Layouts/AdminLayout';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { ShoppingCart, Package, DollarSign, Search, Eye } from 'lucide-react';
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

const STATUS_STYLES: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    pending: 'outline',
    confirmed: 'default',
    attended: 'default',
    cancelled: 'destructive',
    waitlisted: 'secondary',
};

export default function OrdersIndex({ orders, stats, events, products, currentSearch, currentEvent, currentProduct }: Props) {
    const [search, setSearch] = useState(currentSearch);

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

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Product Orders</h1>
                    <p className="text-sm text-muted-foreground mt-1">View all product purchases made through event registrations</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <ShoppingCart className="w-4 h-4" />
                                <span className="text-xs font-medium uppercase tracking-wide">Total Orders</span>
                            </div>
                            <p className="text-2xl font-bold">{stats.total_orders}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <Package className="w-4 h-4" />
                                <span className="text-xs font-medium uppercase tracking-wide">Total Items</span>
                            </div>
                            <p className="text-2xl font-bold">{stats.total_items}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 text-emerald-600 mb-1">
                                <DollarSign className="w-4 h-4" />
                                <span className="text-xs font-medium uppercase tracking-wide">Total Revenue</span>
                            </div>
                            <p className="text-2xl font-bold">RM {Number(stats.total_revenue).toLocaleString('en-MY', { minimumFractionDigits: 2 })}</p>
                        </CardContent>
                    </Card>
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
                        <Button type="submit" variant="secondary">Search</Button>
                    </form>

                    <Select
                        value={currentEvent || 'all'}
                        onValueChange={v => applyFilters({ event: v === 'all' ? '' : v, product: '' })}
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
                        value={currentProduct || 'all'}
                        onValueChange={v => applyFilters({ product: v === 'all' ? '' : v })}
                    >
                        <SelectTrigger className="w-full sm:w-[200px]">
                            <SelectValue placeholder="All Products" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Products</SelectItem>
                            {products.map(p => (
                                <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Orders Table */}
                <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Reference</TableHead>
                                <TableHead>Buyer</TableHead>
                                <TableHead>Event</TableHead>
                                <TableHead>Product</TableHead>
                                <TableHead>Variant</TableHead>
                                <TableHead className="text-center">Qty</TableHead>
                                <TableHead className="text-right">Unit Price</TableHead>
                                <TableHead className="text-right">Subtotal</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.data.map(order => {
                                const subtotal = order.quantity * Number(order.unit_price);
                                const statusVariant = STATUS_STYLES[order.registration?.status] ?? 'outline';
                                return (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-mono text-xs">
                                            {order.registration?.reference_no}
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium text-sm">{order.registration?.name}</div>
                                            <div className="text-xs text-muted-foreground">{order.registration?.email}</div>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {order.registration?.event ? (
                                                <Link
                                                    href={`/admin/events/${order.registration.event.slug}/edit`}
                                                    className="text-brand-navy hover:underline"
                                                >
                                                    {order.registration.event.title}
                                                </Link>
                                            ) : '—'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {order.product?.media && (
                                                    <img src={order.product.media.url} alt={order.product.name} className="w-8 h-8 rounded object-cover" />
                                                )}
                                                <span className="text-sm font-medium">{order.product?.name ?? '—'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {order.variant || '—'}
                                        </TableCell>
                                        <TableCell className="text-center">{order.quantity}</TableCell>
                                        <TableCell className="text-right text-sm">
                                            RM {Number(order.unit_price).toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            RM {subtotal.toFixed(2)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={statusVariant}>
                                                {order.registration?.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {new Date(order.created_at).toLocaleDateString('en-MY', {
                                                day: 'numeric', month: 'short', year: 'numeric',
                                            })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {order.registration?.event && (
                                                <Link
                                                    href={`/admin/events/${order.registration.event.slug}/registrations/${order.registration.id}`}
                                                    className="inline-flex items-center gap-1 text-sm text-brand-navy hover:underline"
                                                >
                                                    <Eye className="w-3.5 h-3.5" /> View
                                                </Link>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {orders.data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={11} className="text-center py-12 text-muted-foreground">
                                        <ShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                        {currentSearch || currentEvent || currentProduct
                                            ? 'No orders match the current filters.'
                                            : 'No product orders yet.'}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {orders.last_page > 1 && (
                    <div className="flex justify-center gap-1">
                        {orders.links.map((link, i) => (
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
