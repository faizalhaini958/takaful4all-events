import UserDashboardLayout from '@/Layouts/UserDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Link } from '@inertiajs/react';
import { Eye, Calendar, MapPin, Receipt, Package, ArrowLeft, Download } from 'lucide-react';
import { type EventRegistration } from '@/types';

interface Props {
    order: EventRegistration;
}

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    confirmed: 'default',
    pending:   'secondary',
    attended:  'default',
    cancelled: 'destructive',
    waitlisted: 'outline',
};

const PAYMENT_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    paid:     'default',
    pending:  'secondary',
    refunded: 'destructive',
    na:       'outline',
};

export default function OrderDetail({ order }: Props) {
    return (
        <UserDashboardLayout title={`Order ${order.reference_no}`}>
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/orders">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-1" /> Back
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
                        <p className="text-sm font-mono text-gray-400">{order.reference_no}</p>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Main details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Event info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Event</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <h3 className="font-semibold text-gray-900 text-lg">{order.event?.title ?? 'Event'}</h3>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                    <span className="flex items-center gap-1.5">
                                        <Calendar className="w-4 h-4" />
                                        {order.event?.start_at
                                            ? new Date(order.event.start_at).toLocaleDateString('en-MY', {
                                                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                                            })
                                            : '—'}
                                    </span>
                                    {order.event?.venue && (
                                        <span className="flex items-center gap-1.5">
                                            <MapPin className="w-4 h-4" />
                                            {order.event.venue}{order.event.city ? `, ${order.event.city}` : ''}
                                        </span>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Registration details */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Registration Details</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <dl className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <dt className="text-gray-500">Name</dt>
                                        <dd className="font-medium text-gray-900 mt-0.5">{order.name}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500">Email</dt>
                                        <dd className="font-medium text-gray-900 mt-0.5">{order.email}</dd>
                                    </div>
                                    {order.phone && (
                                        <div>
                                            <dt className="text-gray-500">Phone</dt>
                                            <dd className="font-medium text-gray-900 mt-0.5">{order.phone}</dd>
                                        </div>
                                    )}
                                    {order.company && (
                                        <div>
                                            <dt className="text-gray-500">Company</dt>
                                            <dd className="font-medium text-gray-900 mt-0.5">{order.company}</dd>
                                        </div>
                                    )}
                                    {order.job_title && (
                                        <div>
                                            <dt className="text-gray-500">Job Title</dt>
                                            <dd className="font-medium text-gray-900 mt-0.5">{order.job_title}</dd>
                                        </div>
                                    )}
                                    {order.dietary_requirements && (
                                        <div>
                                            <dt className="text-gray-500">Dietary Requirements</dt>
                                            <dd className="font-medium text-gray-900 mt-0.5">{order.dietary_requirements}</dd>
                                        </div>
                                    )}
                                </dl>
                            </CardContent>
                        </Card>

                        {/* Products */}
                        {order.products && order.products.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Package className="w-5 h-5" /> Add-on Products
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {order.products.map((p) => (
                                            <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div>
                                                    <p className="font-medium text-gray-900">{p.product?.name ?? 'Product'}</p>
                                                    {p.variant && <p className="text-xs text-gray-500">Variant: {p.variant}</p>}
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-medium">RM {Number(p.unit_price).toFixed(2)} × {p.quantity}</p>
                                                    <p className="text-sm text-gray-500">RM {(Number(p.unit_price) * p.quantity).toFixed(2)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar - Summary */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Receipt className="w-5 h-5" /> Order Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-500">Status</span>
                                    <Badge variant={STATUS_VARIANT[order.status] ?? 'secondary'}>
                                        {order.status}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-500">Payment</span>
                                    <Badge variant={PAYMENT_VARIANT[order.payment_status] ?? 'outline'}>
                                        {order.payment_status}
                                    </Badge>
                                </div>

                                <div className="border-t pt-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Ticket ({order.ticket?.name})</span>
                                        <span>RM {Number(order.subtotal).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Qty</span>
                                        <span>× {order.quantity}</span>
                                    </div>
                                    {Number(order.products_total) > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Products</span>
                                            <span>RM {Number(order.products_total).toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="border-t pt-2 flex justify-between font-semibold text-gray-900">
                                        <span>Total</span>
                                        <span>RM {Number(order.total_amount).toFixed(2)}</span>
                                    </div>
                                </div>

                                {order.payment_method && (
                                    <div className="text-sm">
                                        <span className="text-gray-500">Payment Method: </span>
                                        <span className="font-medium">{order.payment_method}</span>
                                    </div>
                                )}
                                {order.payment_reference && (
                                    <div className="text-sm">
                                        <span className="text-gray-500">Payment Ref: </span>
                                        <span className="font-mono text-xs">{order.payment_reference}</span>
                                    </div>
                                )}

                                <div className="text-sm text-gray-400">
                                    Ordered on {new Date(order.created_at).toLocaleDateString('en-MY', {
                                        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                    })}
                                </div>

                                {order.invoice && (
                                    <a
                                        href={`/invoices/${order.invoice.invoice_number}/download`}
                                        className="flex items-center justify-center gap-2 w-full mt-3 p-3 rounded-lg border border-brand text-brand hover:bg-brand/5 transition-colors font-medium text-sm"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download Invoice
                                    </a>
                                )}
                            </CardContent>
                        </Card>

                        {order.notes && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm">Notes</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-600">{order.notes}</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </UserDashboardLayout>
    );
}
