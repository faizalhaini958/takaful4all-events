import PublicLayout from '@/Layouts/PublicLayout';
import { Card, CardContent } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Link, Head } from '@inertiajs/react';
import { CheckCircle2, Clock, XCircle, UserCheck, AlertCircle, Calendar, MapPin, Ticket, Mail, Hash, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect } from 'react';
import { type EventRegistration } from '@/types';
import { useAnalytics } from '@/hooks/use-analytics';

const POPPINS = "'Poppins', sans-serif";
const INTER   = "'Inter', 'DM Sans', sans-serif";

const PAGE_HEADER: Record<string, { iconBg: string; iconColor: string; Icon: React.ElementType; title: string; subtitle: string }> = {
    confirmed:       { iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', Icon: CheckCircle2, title: 'Registration Successful!',       subtitle: 'Your registration has been confirmed. We look forward to seeing you!' },
    attended:        { iconBg: 'bg-blue-100',    iconColor: 'text-blue-600',    Icon: UserCheck,   title: 'Attendance Recorded',             subtitle: 'Thank you for attending this event.' },
    pending:         { iconBg: 'bg-amber-100',   iconColor: 'text-amber-600',   Icon: Clock,       title: 'Pending Approval',                subtitle: "Your registration is pending admin approval. We'll notify you once it's confirmed." },
    pending_payment: { iconBg: 'bg-amber-100',   iconColor: 'text-amber-600',   Icon: Clock,       title: 'Complete Your Payment',           subtitle: 'Your spot is reserved. Please complete your payment to confirm your registration.' },
    waitlisted:      { iconBg: 'bg-gray-100',    iconColor: 'text-gray-600',    Icon: AlertCircle, title: 'You\'re on the Waitlist',         subtitle: 'We\'ll notify you if a spot becomes available.' },
    cancelled:       { iconBg: 'bg-red-100',     iconColor: 'text-red-600',     Icon: XCircle,     title: 'Registration Cancelled',          subtitle: 'This registration has been cancelled.' },
};

interface Props {
    registration: EventRegistration;
}

export default function RegistrationConfirmation({ registration }: Props) {
    const event = registration.event!;
    const startDate = new Date(event.start_at);
    const location = [event.venue, event.city, event.state].filter(Boolean).join(', ');
    const pendingKey = (registration.status === 'pending' && registration.payment_status === 'pending') ? 'pending_payment' : registration.status;
    const header = PAGE_HEADER[pendingKey] ?? PAGE_HEADER['pending'];
    const { Icon } = header;
    const { track } = useAnalytics();

    // Track funnel completion — only fire once on mount
    useEffect(() => {
        track('funnel_step', 'registration', 'confirmed', { event: event.slug, status: registration.status });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [registration.id]);

    return (
        <PublicLayout>
            <Head>
                <title>Registration Status | Takaful4All Events</title>
                <meta name="robots" content="noindex, nofollow" />
            </Head>

            {/* ── Hero ── */}
            <section className="bg-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 text-center">
                    <div className={`inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full ${header.iconBg} mb-4 sm:mb-5`}>
                        <Icon className={`w-8 h-8 sm:w-10 sm:h-10 ${header.iconColor}`} />
                    </div>
                    <h1 style={{ fontFamily: POPPINS, fontSize: '2rem', fontWeight: 800, letterSpacing: '0.02em', color: '#111827' }}>
                        {header.title}
                    </h1>
                    <p className="mt-2" style={{ color: '#6b7280', fontFamily: INTER, fontSize: '1rem' }}>
                        {header.subtitle}
                    </p>
                </div>
            </section>
            {/* Gradient divider */}
            <div className="h-[3px] w-full" style={{ background: 'linear-gradient(90deg, transparent 0%, #009FBB 30%, #18C8FF 50%, #009FBB 70%, transparent 100%)' }} />

            <div className="bg-gray-50 min-h-screen">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-16">

                {/* Confirmation Card */}
                <Card className="overflow-hidden">
                    {/* Event header */}
                    <div className="bg-brand-navy text-white p-5 sm:p-6">
                        <h2 className="text-2xl font-bold leading-tight">{event.title}</h2>
                        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 mt-3 text-sm text-white/85">
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

                    <CardContent className="p-4 sm:p-6 space-y-5">
                        {/* Reference */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 sm:p-4 rounded-lg bg-gray-50 border">
                            <div className="flex items-center gap-2">
                                <Hash className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Reference No.</span>
                            </div>
                            <span className="font-mono font-bold text-xl sm:text-lg break-all sm:break-normal text-brand-navy">{registration.reference_no}</span>
                        </div>

                        {/* Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
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
                                <p className="font-medium break-words leading-snug">{registration.ticket?.name}</p>
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
                                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                                        <span className="min-w-0 break-words">Ticket ({registration.ticket?.name} x {registration.quantity})</span>
                                        <span className="font-semibold whitespace-nowrap text-right">RM {Number(registration.subtotal).toFixed(2)}</span>
                                    </div>
                                    {registration.products?.map(p => (
                                        <div key={p.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                                            <span className="min-w-0 break-words">
                                                {p.product?.name}
                                                {p.variant && ` (${p.variant})`}
                                                {' '} x {p.quantity}
                                            </span>
                                            <span className="font-semibold whitespace-nowrap text-right">RM {(Number(p.unit_price) * p.quantity).toFixed(2)}</span>
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
                        {(() => {
                            const statusConfig: Record<string, { bg: string; color: string; message: string }> = {
                                confirmed:       { bg: '#ecfdf5', color: '#065f46', message: 'Your spot is confirmed. See you at the event!' },
                                attended:        { bg: '#eff6ff', color: '#1e40af', message: 'You have attended this event. Thank you!' },
                                pending:         { bg: '#fffbeb', color: '#92400e', message: 'Your registration is pending admin approval. You will receive an email once confirmed.' },
                                pending_payment: { bg: '#fffbeb', color: '#92400e', message: 'Your spot is reserved. Please complete your payment to confirm your registration.' },
                                waitlisted:      { bg: '#f3f4f6', color: '#374151', message: 'You are on the waitlist. We will notify you if a spot becomes available.' },
                                cancelled:       { bg: '#fef2f2', color: '#991b1b', message: 'This registration has been cancelled.' },
                            };
                            const cfg = statusConfig[pendingKey] ?? statusConfig['pending'];
                            return (
                                <div className="p-3 rounded-lg text-center text-sm font-medium"
                                    style={{ backgroundColor: cfg.bg, color: cfg.color }}
                                >
                                    {cfg.message}
                                </div>
                            );
                        })()}

                        {/* QR Code — only shown once registration is confirmed */}
                        {registration.status === 'confirmed' && (
                        <div className="border-t pt-5">
                            <div className="flex flex-col items-center gap-3">
                                <p className="text-sm text-muted-foreground">Your booking QR code</p>
                                <div className="p-3 bg-white rounded-lg border shadow-sm">
                                    <QRCodeSVG
                                        value={`${window.location.origin}/events/${event.slug}/register/confirmation/${registration.reference_no}`}
                                        size={148}
                                        level="M"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground text-center">
                                    Present this QR code at the event for check-in
                                </p>
                            </div>
                        </div>
                        )}

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
                    <Button asChild variant="outline" className="w-full sm:w-auto">
                        <Link href={`/events/${event.slug}`}>Back to Event</Link>
                    </Button>
                    <Button asChild className="w-full sm:w-auto bg-brand hover:bg-brand-dark">
                        <Link href="/events">Browse More Events</Link>
                    </Button>
                </div>
            </div>
            </div>
        </PublicLayout>
    );
}
