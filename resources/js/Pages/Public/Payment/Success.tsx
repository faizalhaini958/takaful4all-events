import PublicLayout from '@/Layouts/PublicLayout';
import { Card, CardContent } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Link, Head, usePage } from '@inertiajs/react';
import { CheckCircle2, Calendar, MapPin, Ticket, Mail, Hash, ArrowRight, Home, Package, UserPlus } from 'lucide-react';
import { type EventRegistration, type SharedProps } from '@/types';
import { useState } from 'react';
import RegisterModal from '@/Components/RegisterModal';

const POPPINS = "'Poppins', sans-serif";
const INTER   = "'Inter', 'DM Sans', sans-serif";

interface Props {
    registration: EventRegistration | null;
}

export default function PaymentSuccess({ registration }: Props) {
    const { auth } = usePage().props as SharedProps;
    const isGuest = !auth?.user;
    const [registerOpen, setRegisterOpen] = useState(false);
    const event = registration?.event;
    const startDate = event ? new Date(event.start_at) : null;
    const location = event ? [event.venue, event.city, event.state].filter(Boolean).join(', ') : '';

    return (
        <PublicLayout>
            <Head>
                <title>Payment Successful | Takaful4All Events</title>
                <meta name="robots" content="noindex, nofollow" />
            </Head>

            {/* ── Hero ── */}
            <section className="relative -mt-16 overflow-hidden" style={{ background: '#071B2A' }}>
                <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[280px] rounded-full opacity-20 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, #18C8FF 0%, transparent 70%)' }} />
                <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 md:pb-28 text-center" style={{ paddingTop: '7rem' }}>
                    <h1 style={{ fontFamily: POPPINS, color: 'white', fontSize: '2.25rem', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                        Payment Successful
                    </h1>
                    <p className="mt-3" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: INTER, fontSize: '1.125rem' }}>
                        Your payment has been processed successfully. Thank you!
                    </p>
                </div>
            </section>

            <div className="relative z-10 -mt-10 rounded-t-3xl rounded-b-3xl overflow-hidden" style={{ background: 'linear-gradient(180deg, #EBF5FA 0%, #ddeef6 100%)' }}>
                <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgba(0,100,140,0.07) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
            <div className="relative max-w-2xl mx-auto px-4 sm:px-6 py-16">
                {/* Success Icon */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 mb-4">
                        <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                    </div>
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
                                            RM {Number(registration.total_amount).toFixed(2)}
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

                            {/* Add-ons */}
                            {registration.products && registration.products.length > 0 && (
                                <div className="border rounded-lg p-4 space-y-2">
                                    <p className="text-sm font-semibold flex items-center gap-1.5 text-gray-700">
                                        <Package className="w-4 h-4" /> Add-ons Ordered
                                    </p>
                                    <div className="divide-y">
                                        {registration.products.map((p) => {
                                            let variants: string[] = [];
                                            if (p.variant) {
                                                try {
                                                    const parsed = JSON.parse(p.variant);
                                                    variants = Array.isArray(parsed) ? parsed : [p.variant];
                                                } catch {
                                                    variants = [p.variant];
                                                }
                                            }

                                            return (
                                                <div key={p.id} className="flex items-center justify-between py-2 text-sm">
                                                    <span className="text-gray-700">
                                                        {p.product?.name ?? 'Item'}
                                                        {variants.length > 0 && (
                                                            <>
                                                                {variants.length === 1 ? (
                                                                    <span className="text-gray-400 ml-1">({variants[0]})</span>
                                                                ) : (
                                                                    <span className="text-gray-400 ml-1">({variants.join(', ')})</span>
                                                                )}
                                                            </>
                                                        )}
                                                        <span className="text-gray-400 ml-1">× {p.quantity}</span>
                                                    </span>
                                                    <span className="font-medium text-gray-900">
                                                        RM {(Number(p.unit_price) * p.quantity).toFixed(2)}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Confirmation note */}
                            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
                                A confirmation email has been sent to <strong>{registration.email}</strong>.
                                Please keep your reference number for check-in at the event.
                            </div>

                            {/* Post-payment account creation CTA (guests only) */}
                            {isGuest && (
                                <div className="rounded-xl border-2 border-dashed border-brand/30 bg-brand/5 p-5 flex flex-col sm:flex-row items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0">
                                        <UserPlus className="w-5 h-5 text-brand" />
                                    </div>
                                    <div className="flex-1 text-center sm:text-left">
                                        <p className="font-semibold text-brand-navy text-sm">Save your booking</p>
                                        <p className="text-xs text-gray-500 mt-0.5">Create a free account to manage this booking, download your QR ticket, and get faster checkout next time.</p>
                                    </div>
                                    <Button
                                        size="sm"
                                        className="flex-shrink-0 whitespace-nowrap"
                                        onClick={() => setRegisterOpen(true)}
                                    >
                                        <UserPlus className="w-4 h-4 mr-1.5" />
                                        Create Account
                                    </Button>
                                </div>
                            )}

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
            </div>

            {/* Register modal for guest post-payment account creation */}
            <RegisterModal
                open={registerOpen}
                onOpenChange={setRegisterOpen}
                onSwitchToLogin={() => setRegisterOpen(false)}
                initialEmail={registration?.email}
            />
        </PublicLayout>
    );
}
