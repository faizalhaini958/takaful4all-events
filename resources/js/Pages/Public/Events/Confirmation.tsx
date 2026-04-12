import PublicLayout from '@/Layouts/PublicLayout';
import { Card, CardContent } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Link } from '@inertiajs/react';
import { CheckCircle2, Calendar, MapPin, Ticket, Mail, Hash, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { type EventRegistration } from '@/types';

interface Props {
    registration: EventRegistration;
}

export default function RegistrationConfirmation({ registration }: Props) {
    const event = registration.event!;
    const startDate = new Date(event.start_at);
    const location = [event.venue, event.city, event.state].filter(Boolean).join(', ');

    return (
        <PublicLayout>
            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
                {/* Success Icon */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 mb-4">
                        <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-brand-navy">Registration Successful!</h1>
                    <p className="text-gray-600 mt-2">
                        {registration.status === 'pending'
                            ? 'Your registration is pending approval. We\'ll notify you once it\'s confirmed.'
                            : 'Your registration has been confirmed. We look forward to seeing you!'}
                    </p>
                </div>

                {/* Confirmation Card */}
                <Card className="overflow-hidden">
                    {/* Event header */}
                    <div className="bg-brand-navy text-white p-6">
                        <h2 className="text-xl font-bold">{event.title}</h2>
                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-white/80">
                            <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {startDate.toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                            {location && (
                                <span className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" /> {location}
                                </span>
                            )}
                        </div>
                    </div>

                    <CardContent className="p-6 space-y-5">
                        {/* Reference */}
                        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border">
                            <div className="flex items-center gap-2">
                                <Hash className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Reference No.</span>
                            </div>
                            <span className="font-mono font-bold text-lg">{registration.reference_no}</span>
                        </div>

                        {/* Details */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-muted-foreground">Name</p>
                                <p className="font-medium">{registration.name}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" /> Email</p>
                                <p className="font-medium">{registration.email}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground flex items-center gap-1"><Ticket className="w-3 h-3" /> Ticket</p>
                                <p className="font-medium">{registration.ticket?.name}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Attendees</p>
                                <p className="font-medium">{registration.quantity}</p>
                            </div>
                        </div>

                        {/* Order breakdown */}
                        {Number(registration.total_amount) > 0 && (
                            <div className="border-t pt-4">
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span>Ticket ({registration.ticket?.name} x {registration.quantity})</span>
                                        <span>RM {Number(registration.subtotal).toFixed(2)}</span>
                                    </div>
                                    {registration.products?.map(p => (
                                        <div key={p.id} className="flex justify-between">
                                            <span>
                                                {p.product?.name}
                                                {p.variant && ` (${p.variant})`}
                                                {' '} x {p.quantity}
                                            </span>
                                            <span>RM {(Number(p.unit_price) * p.quantity).toFixed(2)}</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between font-bold text-base pt-2 border-t mt-2">
                                        <span>Total</span>
                                        <span>RM {Number(registration.total_amount).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Status */}
                        <div className="p-3 rounded-lg text-center text-sm font-medium"
                            style={{
                                backgroundColor: registration.status === 'confirmed' ? '#ecfdf5' : '#fffbeb',
                                color: registration.status === 'confirmed' ? '#065f46' : '#92400e',
                            }}
                        >
                            {registration.status === 'confirmed'
                                ? 'Your spot is confirmed. See you at the event!'
                                : 'Your registration is pending review. You will receive an email once approved.'}
                        </div>

                        {/* QR Code */}
                        <div className="border-t pt-5">
                            <div className="flex flex-col items-center gap-3">
                                <p className="text-sm text-muted-foreground">Your booking QR code</p>
                                <div className="p-3 bg-white rounded-lg border shadow-sm">
                                    <QRCodeSVG
                                        value={`${window.location.origin}/events/${event.slug}/register/confirmation/${registration.reference_no}`}
                                        size={160}
                                        level="M"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground text-center">
                                    Present this QR code at the event for check-in
                                </p>
                            </div>
                        </div>

                        {/* Invoice Download */}
                        {registration.invoice && (
                            <div className="border-t pt-4">
                                <a
                                    href={`/invoices/${registration.invoice.invoice_number}/download`}
                                    className="flex items-center justify-center gap-2 w-full p-3 rounded-lg border border-brand text-brand hover:bg-brand/5 transition-colors font-medium text-sm"
                                >
                                    <Download className="w-4 h-4" />
                                    Download Invoice ({registration.invoice.invoice_number})
                                </a>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center">
                    <Button asChild variant="outline">
                        <Link href={`/events/${event.slug}`}>Back to Event</Link>
                    </Button>
                    <Button asChild className="bg-brand hover:bg-brand-dark">
                        <Link href="/events">Browse More Events</Link>
                    </Button>
                </div>
            </div>
        </PublicLayout>
    );
}
