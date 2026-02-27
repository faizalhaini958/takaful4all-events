import UserDashboardLayout from '@/Layouts/UserDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Link } from '@inertiajs/react';
import { Ticket, ShoppingBag, Calendar, CreditCard } from 'lucide-react';
import { type EventRegistration } from '@/types';

interface DashboardStats {
    totalTickets: number;
    upcomingEvents: number;
    totalOrders: number;
    totalSpent: number;
}

interface Props {
    stats: DashboardStats;
    upcomingRegistrations: EventRegistration[];
    recentOrders: EventRegistration[];
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

export default function Dashboard({ stats, upcomingRegistrations, recentOrders }: Props) {
    return (
        <UserDashboardLayout title="My Dashboard">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-1">Welcome back! Here's an overview of your activity.</p>
                </div>

                {/* Stats cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wide">My Tickets</CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center">
                                <Ticket className="w-5 h-5 text-brand" />
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalTickets}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wide">Upcoming Events</CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-blue-600" />
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{stats.upcomingEvents}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Orders</CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                                <ShoppingBag className="w-5 h-5 text-purple-600" />
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Spent</CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                                <CreditCard className="w-5 h-5 text-green-600" />
                            </div>
                            <p className="text-2xl font-bold text-gray-900">RM {stats.totalSpent.toFixed(2)}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Upcoming events */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Upcoming Events</CardTitle>
                            <Link href="/dashboard/tickets" className="text-sm text-brand hover:underline">View all →</Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {upcomingRegistrations.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                                <Calendar className="w-10 h-10 mx-auto mb-2" />
                                <p>No upcoming events</p>
                                <Link href="/events" className="text-sm text-brand hover:underline mt-1 inline-block">Browse events →</Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {upcomingRegistrations.map((reg) => (
                                    <div key={reg.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div className="min-w-0 flex-1">
                                            <p className="font-medium text-gray-900 truncate">{reg.event?.title}</p>
                                            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                                                <span>{reg.event?.start_at ? new Date(reg.event.start_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span>
                                                {reg.event?.venue && <span>• {reg.event.venue}</span>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 ml-4">
                                            <Badge variant={STATUS_VARIANT[reg.status] ?? 'secondary'}>
                                                {reg.status}
                                            </Badge>
                                            <span className="text-xs font-mono text-gray-400">{reg.reference_no}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent orders */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Recent Orders</CardTitle>
                            <Link href="/dashboard/orders" className="text-sm text-brand hover:underline">View all →</Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {recentOrders.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                                <ShoppingBag className="w-10 h-10 mx-auto mb-2" />
                                <p>No orders yet</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-gray-500">
                                            <th className="pb-2 font-medium">Reference</th>
                                            <th className="pb-2 font-medium">Event</th>
                                            <th className="pb-2 font-medium">Amount</th>
                                            <th className="pb-2 font-medium">Payment</th>
                                            <th className="pb-2 font-medium">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentOrders.map((order) => (
                                            <tr key={order.id} className="border-b last:border-0">
                                                <td className="py-3 font-mono text-xs">{order.reference_no}</td>
                                                <td className="py-3 truncate max-w-[200px]">{order.event?.title}</td>
                                                <td className="py-3 font-medium">RM {Number(order.total_amount).toFixed(2)}</td>
                                                <td className="py-3">
                                                    <Badge variant={PAYMENT_VARIANT[order.payment_status] ?? 'outline'} className="text-xs">
                                                        {order.payment_status}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 text-gray-500">
                                                    {new Date(order.created_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </UserDashboardLayout>
    );
}
