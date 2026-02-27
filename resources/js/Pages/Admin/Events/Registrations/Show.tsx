import AdminLayout from '@/Layouts/AdminLayout';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Link, router } from '@inertiajs/react';
import { ChevronLeft, UserCheck, Clock, Mail, Phone, Building2, Utensils, FileText, Users } from 'lucide-react';
import { type Event, type EventRegistration, type RegistrationStatus } from '@/types';

interface Attendee {
    name: string;
    email: string;
    phone?: string | null;
    company?: string | null;
    job_title?: string | null;
    dietary_requirements?: string | null;
}

interface Props {
    event: Event;
    registration: EventRegistration;
}

const STATUS_BADGE: Record<RegistrationStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string; color: string }> = {
    pending:    { variant: 'outline',     label: 'Pending',    color: 'text-amber-600' },
    confirmed:  { variant: 'default',     label: 'Confirmed',  color: 'text-emerald-600' },
    cancelled:  { variant: 'destructive', label: 'Cancelled',  color: 'text-red-600' },
    waitlisted: { variant: 'secondary',   label: 'Waitlisted', color: 'text-gray-600' },
    attended:   { variant: 'default',     label: 'Attended',   color: 'text-blue-600' },
};

export default function RegistrationShow({ event, registration }: Props) {
    const statusCfg = STATUS_BADGE[registration.status];

    function updateStatus(status: RegistrationStatus) {
        router.patch(`/admin/events/${event.slug}/registrations/${registration.id}/status`, { status });
    }

    function checkIn() {
        router.post(`/admin/events/${event.slug}/registrations/${registration.id}/check-in`);
    }

    return (
        <AdminLayout>
            <div className="space-y-6 max-w-4xl">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href={`/admin/events/${event.slug}/registrations`} className="text-muted-foreground hover:text-foreground transition-colors">
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">Registration Detail</h1>
                            <p className="text-sm text-muted-foreground font-mono">{registration.reference_no}</p>
                        </div>
                    </div>
                    <Badge variant={statusCfg.variant} className="text-sm px-3 py-1">
                        {statusCfg.label}
                    </Badge>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
                    {/* Main Info */}
                    <div className="space-y-6">
                        {/* Attendee Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    {registration.quantity > 1 ? 'Attendee 1 (Primary Buyer)' : 'Attendee Information'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-0.5">Full Name</p>
                                        <p className="font-medium">{registration.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1"><Mail className="w-3 h-3" /> Email</p>
                                        <p className="font-medium">{registration.email}</p>
                                    </div>
                                    {registration.phone && (
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</p>
                                            <p className="font-medium">{registration.phone}</p>
                                        </div>
                                    )}
                                    {registration.company && (
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1"><Building2 className="w-3 h-3" /> Company</p>
                                            <p className="font-medium">{registration.company}</p>
                                        </div>
                                    )}
                                    {registration.job_title && (
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-0.5">Job Title</p>
                                            <p className="font-medium">{registration.job_title}</p>
                                        </div>
                                    )}
                                    {registration.dietary_requirements && (
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1"><Utensils className="w-3 h-3" /> Dietary</p>
                                            <p className="font-medium">{registration.dietary_requirements}</p>
                                        </div>
                                    )}
                                </div>
                                {registration.notes && (
                                    <div className="pt-2 border-t">
                                        <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1"><FileText className="w-3 h-3" /> Notes</p>
                                        <p className="text-sm">{registration.notes}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Additional Attendees from meta_json */}
                        {registration.quantity > 1 && (registration.meta_json as { attendees?: Attendee[] })?.attendees?.map((attendee, index) => (
                            <Card key={index}>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Users className="w-5 h-5 text-brand" />
                                        Attendee {index + 2}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-0.5">Full Name</p>
                                            <p className="font-medium">{attendee.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1"><Mail className="w-3 h-3" /> Email</p>
                                            <p className="font-medium">{attendee.email}</p>
                                        </div>
                                        {attendee.phone && (
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</p>
                                                <p className="font-medium">{attendee.phone}</p>
                                            </div>
                                        )}
                                        {attendee.company && (
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1"><Building2 className="w-3 h-3" /> Company</p>
                                                <p className="font-medium">{attendee.company}</p>
                                            </div>
                                        )}
                                        {attendee.job_title && (
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-0.5">Job Title</p>
                                                <p className="font-medium">{attendee.job_title}</p>
                                            </div>
                                        )}
                                        {attendee.dietary_requirements && (
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1"><Utensils className="w-3 h-3" /> Dietary</p>
                                                <p className="font-medium">{attendee.dietary_requirements}</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {/* Ticket & Order */}
                        <Card>
                            <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
                            <CardContent>
                                <div className="border rounded-lg overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted">
                                            <tr>
                                                <th className="px-4 py-2 text-left font-medium">Item</th>
                                                <th className="px-4 py-2 text-center font-medium">Qty</th>
                                                <th className="px-4 py-2 text-right font-medium">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="border-t">
                                                <td className="px-4 py-2">
                                                    <span className="font-medium">{registration.ticket?.name}</span>
                                                    <span className="text-muted-foreground ml-1">
                                                        ({registration.ticket?.type === 'paid'
                                                            ? `RM ${Number(registration.ticket.price).toFixed(2)} each`
                                                            : 'Free'})
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 text-center">{registration.quantity}</td>
                                                <td className="px-4 py-2 text-right">RM {Number(registration.subtotal).toFixed(2)}</td>
                                            </tr>
                                            {registration.products?.map(p => (
                                                <tr key={p.id} className="border-t">
                                                    <td className="px-4 py-2">
                                                        <span className="font-medium">{p.product?.name}</span>
                                                        {p.variant && <span className="text-muted-foreground ml-1">({p.variant})</span>}
                                                    </td>
                                                    <td className="px-4 py-2 text-center">{p.quantity}</td>
                                                    <td className="px-4 py-2 text-right">RM {(Number(p.unit_price) * p.quantity).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="border-t bg-muted/50">
                                            <tr>
                                                <td colSpan={2} className="px-4 py-2 font-bold">Total</td>
                                                <td className="px-4 py-2 text-right font-bold">RM {Number(registration.total_amount).toFixed(2)}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-5">
                        {/* Status actions */}
                        <Card>
                            <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
                            <CardContent className="space-y-2">
                                {registration.status === 'pending' && (
                                    <Button onClick={() => updateStatus('confirmed')} className="w-full bg-emerald-600 hover:bg-emerald-700">
                                        Approve Registration
                                    </Button>
                                )}
                                {registration.status === 'confirmed' && (
                                    <Button onClick={checkIn} className="w-full bg-blue-600 hover:bg-blue-700">
                                        <UserCheck className="w-4 h-4 mr-1" /> Check In
                                    </Button>
                                )}
                                {['pending', 'confirmed', 'waitlisted'].includes(registration.status) && (
                                    <Button variant="destructive" onClick={() => updateStatus('cancelled')} className="w-full">
                                        Cancel Registration
                                    </Button>
                                )}
                                {registration.status === 'cancelled' && (
                                    <Button variant="outline" onClick={() => updateStatus('confirmed')} className="w-full">
                                        Reinstate
                                    </Button>
                                )}
                            </CardContent>
                        </Card>

                        {/* Meta */}
                        <Card>
                            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div>
                                    <p className="text-xs text-muted-foreground">Payment Status</p>
                                    <Badge variant="outline" className="mt-0.5">{registration.payment_status.toUpperCase()}</Badge>
                                </div>
                                {registration.payment_method && (
                                    <div>
                                        <p className="text-xs text-muted-foreground">Payment Method</p>
                                        <p className="font-medium">{registration.payment_method}</p>
                                    </div>
                                )}
                                {registration.payment_reference && (
                                    <div>
                                        <p className="text-xs text-muted-foreground">Payment Reference</p>
                                        <p className="font-mono text-xs">{registration.payment_reference}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-xs text-muted-foreground">Registered At</p>
                                    <p className="font-medium flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {new Date(registration.created_at).toLocaleString('en-MY')}
                                    </p>
                                </div>
                                {registration.checked_in_at && (
                                    <div>
                                        <p className="text-xs text-muted-foreground">Checked In At</p>
                                        <p className="font-medium flex items-center gap-1 text-emerald-600">
                                            <UserCheck className="w-3 h-3" />
                                            {new Date(registration.checked_in_at).toLocaleString('en-MY')}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
