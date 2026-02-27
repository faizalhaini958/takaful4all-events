import PublicLayout from '@/Layouts/PublicLayout';
import { Card, CardContent } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Link } from '@inertiajs/react';
import { XCircle, Calendar, MapPin, Hash, RotateCcw, Home, HelpCircle } from 'lucide-react';
import { type EventRegistration } from '@/types';

interface Props {
    registration: EventRegistration | null;
}

export default function PaymentFailure({ registration }: Props) {
    const event = registration?.event;
    const startDate = event ? new Date(event.start_at) : null;
    const location = event ? [event.venue, event.city, event.state].filter(Boolean).join(', ') : '';

    return (
        <PublicLayout>
            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
                {/* Failure Icon */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-4">
                        <XCircle className="w-10 h-10 text-red-600" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-brand-navy">Payment Failed</h1>
                    <p className="text-gray-600 mt-2">
                        Unfortunately, your payment could not be processed. Please try again.
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
                            <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-200">
                                <div className="flex items-center gap-2">
                                    <Hash className="w-4 h-4 text-red-600" />
                                    <span className="text-sm text-red-700">Reference No.</span>
                                </div>
                                <span className="font-mono font-bold text-lg text-red-800">
                                    {registration.reference_no}
                                </span>
                            </div>

                            {/* Error info */}
                            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800 space-y-2">
                                <p className="font-medium flex items-center gap-2">
                                    <HelpCircle className="w-4 h-4" />
                                    Common reasons for payment failure:
                                </p>
                                <ul className="list-disc list-inside space-y-1 ml-6">
                                    <li>Insufficient funds in your account</li>
                                    <li>Card details entered incorrectly</li>
                                    <li>Transaction declined by your bank</li>
                                    <li>Network timeout during processing</li>
                                </ul>
                            </div>

                            {/* Registration status notice */}
                            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
                                Your registration <strong>({registration.reference_no})</strong> is still on file.
                                You can try making the payment again from the event page.
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <Button asChild className="flex-1">
                                    <Link href={`/events/${event.slug}/register`}>
                                        <RotateCcw className="w-4 h-4 mr-2" />
                                        Try Again
                                    </Link>
                                </Button>
                                <Button asChild variant="outline" className="flex-1">
                                    <Link href={`/events/${event.slug}`}>
                                        View Event Details
                                    </Link>
                                </Button>
                                <Button asChild variant="ghost" className="flex-1">
                                    <Link href="/">
                                        <Home className="w-4 h-4 mr-2" />
                                        Back to Home
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    /* Generic failure (no registration found) */
                    <Card>
                        <CardContent className="p-8 text-center space-y-6">
                            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
                                <p className="font-medium mb-2">What can you do?</p>
                                <ul className="list-disc list-inside space-y-1 text-left">
                                    <li>Check that your card details are correct</li>
                                    <li>Ensure you have sufficient funds</li>
                                    <li>Try a different payment method</li>
                                    <li>Contact your bank if the issue persists</li>
                                </ul>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <Button asChild>
                                    <Link href="/events">
                                        <RotateCcw className="w-4 h-4 mr-2" />
                                        Browse Events
                                    </Link>
                                </Button>
                                <Button asChild variant="outline">
                                    <Link href="/">
                                        <Home className="w-4 h-4 mr-2" />
                                        Back to Home
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </PublicLayout>
    );
}
