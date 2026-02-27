import PublicLayout from '@/Layouts/PublicLayout';
import { Card, CardContent } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Link } from '@inertiajs/react';
import { CheckCircle2, Calendar, MapPin, Ticket, Mail, Hash, ArrowRight, Home } from 'lucide-react';
import { type EventRegistration } from '@/types';

interface Props {
    registration: EventRegistration | null;
}

export default function PaymentSuccess({ registration }: Props) {
    const event = registration?.event;
    const startDate = event ? new Date(event.start_at) : null;
    const location = event ? [event.venue, event.city, event.state].filter(Boolean).join(', ') : '';

    return (
        <PublicLayout>
            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
                {/* Success Icon */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 mb-4">
                        <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-brand-navy">Payment Successful!</h1>
                    <p className="text-gray-600 mt-2">
                        Your payment has been processed successfully. Thank you!
                    </p>
                </div>

                {registration && event ? (
                    <Card className="overflow-hidden">
                        {/* Event header */}
                        <div className="bg-brand-navy text-white p-6">
                            <h2 className="text-xl font-bold">{event.title}</h2>
                            <div className="flex flex-wrap gap-4 mt-2 text-sm text-white/80">
                                {startDate && (
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        {startDate.toLocaleDateString('en-MY', {
                                            weekday: 'long',
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric',
                                        })}
                                    </span>
                                )}
                                {location && (
                                    <span className="flex items-center gap-1">
                                        <MapPin className="w-4 h-4" /> {location}
                                    </span>
                                )}
                            </div>
                        </div>

                        <CardContent className="p-6 space-y-5">
                            {/* Reference */}
                            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                                <div className="flex items-center gap-2">
                                    <Hash className="w-4 h-4 text-emerald-600" />
                                    <span className="text-sm text-emerald-700">Reference No.</span>
                                </div>
                                <span className="font-mono font-bold text-lg text-emerald-800">
                                    {registration.reference_no}
                                </span>
                            </div>

                            {/* Details */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Name</p>
                                    <p className="font-medium">{registration.name}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground flex items-center gap-1">
                                        <Mail className="w-3 h-3" /> Email
                                    </p>
                                    <p className="font-medium">{registration.email}</p>
                                </div>
                                {registration.ticket && (
                                    <div>
                                        <p className="text-muted-foreground flex items-center gap-1">
                                            <Ticket className="w-3 h-3" /> Ticket
                                        </p>
                                        <p className="font-medium">{registration.ticket.name}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-muted-foreground">Attendees</p>
                                    <p className="font-medium">{registration.quantity}</p>
                                </div>
                                {registration.total_amount > 0 && (
                                    <div>
                                        <p className="text-muted-foreground">Amount Paid</p>
                                        <p className="font-medium text-emerald-700">
                                            RM {(registration.total_amount / 100).toFixed(2)}
                                        </p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-muted-foreground">Payment Status</p>
                                    <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        Paid
                                    </span>
                                </div>
                            </div>

                            {/* Confirmation note */}
                            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
                                A confirmation email has been sent to <strong>{registration.email}</strong>.
                                Please keep your reference number for check-in at the event.
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <Button asChild className="flex-1">
                                    <Link href={`/events/${event.slug}`}>
                                        <ArrowRight className="w-4 h-4 mr-2" />
                                        View Event Details
                                    </Link>
                                </Button>
                                <Button asChild variant="outline" className="flex-1">
                                    <Link href="/">
                                        <Home className="w-4 h-4 mr-2" />
                                        Back to Home
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    /* Generic success (no registration found) */
                    <Card>
                        <CardContent className="p-8 text-center space-y-4">
                            <p className="text-gray-600">
                                Your payment has been received and is being processed.
                                You will receive a confirmation email shortly.
                            </p>
                            <Button asChild>
                                <Link href="/">
                                    <Home className="w-4 h-4 mr-2" />
                                    Back to Home
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </PublicLayout>
    );
}
