import PublicLayout from '@/Layouts/PublicLayout';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Link, router, useForm, usePage, Head } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import {
    Calendar, MapPin, ChevronLeft, Ticket, ShoppingBag, Plus, Minus,
    AlertCircle, User, Clock, Check, ChevronRight, FileText, CreditCard,
    CalendarDays, Users,
} from 'lucide-react';
import { type Event, type EventTicket, type EventProduct, type EventZone, type RegistrationField, type SharedProps, type AuthUser, fieldAppliesToTicket, resolveFieldOptions } from '@/types';
import { useTranslation } from '@/hooks/use-translation';
import { useAnalytics } from '@/hooks/use-analytics';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import RegistrationAuthGate from '@/Components/RegistrationAuthGate';
import LoginModal from '@/Components/LoginModal';
import RegisterModal from '@/Components/RegisterModal';

const POPPINS = "'Poppins', sans-serif";
const INTER   = "'Inter', 'DM Sans', sans-serif";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
    event: Event;
    tickets: EventTicket[];
    products: EventProduct[];
    zones: EventZone[];
}

interface ProductSelection {
    product_id: number;
    variants: string[];
    quantity: number;
}

interface Attendee {
    name: string;
    email: string;
    phone: string;
    company: string;
    job_title: string;
    dietary_requirements: string;
    custom_fields: Record<string, string>;
}

const emptyAttendee = (): Attendee => ({
    name: '', email: '', phone: '', company: '',
    job_title: '', dietary_requirements: '', custom_fields: {},
});

// ─── Step config ──────────────────────────────────────────────────────────────

const STEPS = [
    { number: 1, label: 'Types',     icon: Ticket },
    { number: 2, label: 'Your Info', icon: User },
    { number: 3, label: 'Review',    icon: FileText },
    { number: 4, label: 'Payment',   icon: CreditCard },
];

// ─── Main component ───────────────────────────────────────────────────────────

export default function EventRegister({ event, tickets, products, zones }: Props) {
    const { flash, auth } = usePage().props as SharedProps & { flash: { success?: string; error?: string } };
    const authUser: AuthUser | null = auth?.user ?? null;
    const returnTo = `/events/${event.slug}/register`;
    const { t, locale } = useTranslation();
    const { track } = useAnalytics();
    const { executeRecaptcha } = useGoogleReCaptcha();
    const tokenRef = useRef('');
    const [step, setStep] = useState(1);
    const [selectedProducts, setSelectedProducts] = useState<ProductSelection[]>([]);
    const [termsAgreed, setTermsAgreed] = useState(false);
    const [eligibilityWarning, setEligibilityWarning] = useState<string | null>(null);
    const [authGateOpen, setAuthGateOpen] = useState(false);
    const [loginModalOpen, setLoginModalOpen] = useState(false);
    const [registerModalOpen, setRegisterModalOpen] = useState(false);
    const [step2Prefilled, setStep2Prefilled] = useState(false);
    const topRef = useRef<HTMLDivElement>(null);
    const hasTerms = Boolean(event.terms_conditions?.trim());

    const { data, setData, post, processing, errors, transform } = useForm({
        ticket_id: '',
        quantity: '1',
        attendees: [emptyAttendee()] as Attendee[],
        notes: '',
        products: [] as ProductSelection[],
    });

    transform(d => ({ ...d, recaptcha_token: tokenRef.current }));

    const qty = Number(data.quantity) || 1;
    const selectedTicket = tickets.find(tk => tk.id === Number(data.ticket_id));
    const ticketSubtotal = selectedTicket ? Number(selectedTicket.current_price) * qty : 0;
    const productsTotal = selectedProducts.reduce((sum, p) => {
        const product = products.find(pr => pr.id === p.product_id);
        return sum + (product ? product.price * p.quantity : 0);
    }, 0);
    const grandTotal = ticketSubtotal + productsTotal;

    const hasCustomFields = (event.registration_fields?.length ?? 0) > 0;
    const sortedFields: RegistrationField[] = hasCustomFields
        ? [...(event.registration_fields ?? [])]
            .filter(f => fieldAppliesToTicket(f, selectedTicket?.name ?? null))
            .sort((a, b) => a.sort_order - b.sort_order)
        : [];

    const startDate = new Date(event.start_at);
    const formatShortDate = (d: Date) =>
        d.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' });
    const formatTime = (d: Date) =>
        d.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', hour12: true });

    // Sync attendees array with quantity
    useEffect(() => {
        setData(prev => {
            const current = prev.attendees;
            if (current.length === qty) return prev;
            if (current.length < qty) {
                return { ...prev, attendees: [...current, ...Array.from({ length: qty - current.length }, emptyAttendee)] };
            }
            return { ...prev, attendees: current.slice(0, qty) };
        });
    }, [qty]);

    // Pre-fill Attendee 1 from profile when logged in and step 2 first opens
    useEffect(() => {
        if (step === 2 && authUser && !step2Prefilled) {
            const first = data.attendees[0];
            if (!first.name && !first.email) {
                setData(prev => {
                    const updated = [...prev.attendees];
                    updated[0] = { ...updated[0], name: authUser.name, email: authUser.email };
                    return { ...prev, attendees: updated };
                });
            }
            setStep2Prefilled(true);
        }
    }, [step, authUser]);

    function scrollToTop() {
        topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    const STEP_LABELS: Record<number, string> = { 1: 'step_1', 2: 'step_2', 3: 'step_3', 4: 'payment' };

    function goTo(n: number) {
        setStep(n);
        scrollToTop();
        track('funnel_step', 'registration', STEP_LABELS[n] ?? `step_${n}`, { event: event.slug });
    }

    // Track step 1 on initial mount
    useEffect(() => {
        track('funnel_step', 'registration', 'step_1', { event: event.slug });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [event.slug]);

    // ── Product helpers ──
    function toggleProduct(productId: number) {
        const exists = selectedProducts.find(p => p.product_id === productId);
        const updated = exists
            ? selectedProducts.filter(p => p.product_id !== productId)
            : [...selectedProducts, { product_id: productId, variants: [''], quantity: 1 }];
        setSelectedProducts(updated);
        setData('products', updated);
    }
    function updateProductQty(productId: number, value: number) {
        const updated = selectedProducts.map(p => {
            if (p.product_id !== productId) return p;
            const variants = value > p.variants.length
                ? [...p.variants, ...Array(value - p.variants.length).fill('')]
                : p.variants.slice(0, value);
            return { ...p, quantity: value, variants };
        });
        setSelectedProducts(updated);
        setData('products', updated);
    }
    function updateProductVariant(productId: number, itemIndex: number, variant: string) {
        const updated = selectedProducts.map(p => {
            if (p.product_id !== productId) return p;
            const variants = [...(p.variants || [])];
            variants[itemIndex] = variant;
            return { ...p, variants };
        });
        setSelectedProducts(updated);
        setData('products', updated);
    }

    // ── Attendee helpers ──
    function updateAttendee(index: number, field: keyof Attendee, value: string) {
        const updated = [...data.attendees];
        updated[index] = { ...updated[index], [field]: value };
        setData('attendees', updated);
    }
    function updateCustomField(index: number, key: string, value: string) {
        const updated = [...data.attendees];
        updated[index] = { ...updated[index], custom_fields: { ...updated[index].custom_fields, [key]: value } };
        setData('attendees', updated);
    }

    async function handleSubmit() {
        if (executeRecaptcha) {
            tokenRef.current = await executeRecaptcha('event_register');
        }
        track('funnel_step', 'registration', 'payment', { event: event.slug });
        post(`/events/${event.slug}/register`, {
            // If backend returns validation errors, go back to Step 2 so they are visible
            onError: () => goTo(2),
        });
    }

    return (
        <PublicLayout>
            {/* Eligibility warning dialog */}
            <Dialog open={!!eligibilityWarning} onOpenChange={() => setEligibilityWarning(null)}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="h-5 w-5 shrink-0" />
                            Not Eligible for This Ticket
                        </DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">{eligibilityWarning}</p>
                    <p className="text-sm">Please go back and select a ticket that matches your details, or update your information.</p>
                    <DialogFooter>
                        <Button onClick={() => setEligibilityWarning(null)}>OK, I Understand</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Head>
                <title>{`Register — ${event.title} | Takaful4All Events`}</title>
                <meta name="robots" content="noindex, nofollow" />
            </Head>
            {/* Event header bar */}
            <div className="bg-white dark:bg-background">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-4">
                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-muted-foreground mb-4">
                        <Link href="/" className="hover:text-brand transition-colors">Home</Link>
                        <ChevronRight className="w-3 h-3" />
                        <Link href="/events" className="hover:text-brand transition-colors">Events</Link>
                        <ChevronRight className="w-3 h-3" />
                        <Link href={`/events/${event.slug}`} className="hover:text-brand transition-colors truncate max-w-[160px]">{event.title}</Link>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-gray-600 dark:text-muted-foreground font-medium">Register</span>
                    </nav>

                    {/* Badges */}
                    <div className="flex items-center gap-2 mb-3">
                        <span className="inline-flex items-center gap-1.5 bg-brand/10 text-brand text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                            <Ticket className="w-3 h-3" /> Registration
                        </span>
                        {event.status === 'upcoming' && (
                            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-[11px] font-bold px-3 py-1 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                                Open
                            </span>
                        )}
                    </div>

                    {/* Event title */}
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-foreground leading-tight mb-4" style={{ fontFamily: POPPINS }}>
                        {event.title}
                    </h1>

                    {/* Meta chips */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 bg-gray-100 dark:bg-muted text-gray-700 dark:text-muted-foreground text-sm font-medium px-3 py-1.5 rounded-lg">
                            <Calendar className="w-3.5 h-3.5 text-brand flex-shrink-0" />
                            {formatShortDate(startDate)}
                        </span>
                        <span className="inline-flex items-center gap-1.5 bg-gray-100 dark:bg-muted text-gray-700 dark:text-muted-foreground text-sm font-medium px-3 py-1.5 rounded-lg">
                            <Clock className="w-3.5 h-3.5 text-brand flex-shrink-0" />
                            {formatTime(startDate)}
                        </span>
                        {event.venue && (
                            <span className="inline-flex items-center gap-1.5 bg-gray-100 dark:bg-muted text-gray-700 dark:text-muted-foreground text-sm font-medium px-3 py-1.5 rounded-lg">
                                <MapPin className="w-3.5 h-3.5 text-brand flex-shrink-0" />
                                {event.venue}
                            </span>
                        )}
                    </div>
                </div>
            </div>
            {/* Gradient divider */}
            <div className="h-[3px] w-full" style={{ background: 'linear-gradient(90deg, transparent 0%, #009FBB 30%, #18C8FF 50%, #009FBB 70%, transparent 100%)' }} />

            {/* Step Indicator — sticky below any nav */}
            <div ref={topRef} className="border-b dark:border-border bg-white dark:bg-card sticky top-0 z-10 shadow-sm" style={{ borderColor: '#c8dfe8' }}>
                <div className="max-w-4xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center">
                        {STEPS.map((s, i) => {
                            const isCompleted = step > s.number;
                            const isActive    = step === s.number;
                            const Icon        = s.icon;
                            return (
                                <div key={s.number} className="flex items-center flex-1 min-w-0">
                                    <button
                                        type="button"
                                        onClick={() => isCompleted && goTo(s.number)}
                                        disabled={!isCompleted}
                                        className={[
                                            'flex flex-col items-center gap-1.5 py-3 px-1 w-full transition-colors disabled:cursor-default',
                                            isActive ? 'text-brand' : isCompleted ? 'text-brand/60 hover:text-brand cursor-pointer' : 'text-gray-300 dark:text-muted-foreground/50',
                                        ].join(' ')}
                                    >
                                        <div className={[
                                            'w-10 h-10 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold border-2 transition-all',
                                            isActive ? 'border-brand bg-brand text-white' : isCompleted ? 'border-brand/40 bg-brand/10 text-brand' : 'border-gray-200 dark:border-border bg-white dark:bg-muted/30 text-gray-300 dark:text-muted-foreground/50',
                                        ].join(' ')}>
                                            {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                                        </div>
                                        {/* Mobile: show label only for active step; Desktop: always show */}
                                        <span className={[
                                            'text-[10px] font-semibold uppercase tracking-wide text-center leading-tight',
                                            isActive ? 'block' : 'hidden sm:block',
                                        ].join(' ')}>
                                            {s.label}
                                        </span>
                                    </button>
                                    {i < STEPS.length - 1 && (
                                        <div className={['flex-1 h-0.5 mx-1 rounded-full transition-colors mb-4 sm:mb-0', step > s.number ? 'bg-brand/40' : 'bg-gray-200 dark:bg-border'].join(' ')} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Page content */}
            <div className="bg-gray-50 dark:bg-background min-h-screen">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 lg:py-10 pb-24 sm:pb-16 lg:pb-16">
                {flash?.error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <p>{flash.error}</p>
                    </div>
                )}

                {step === 1 && (
                    <Step1Tickets
                        event={event} tickets={tickets} zones={zones} products={products}
                        data={data} setData={setData} qty={qty}
                        selectedTicket={selectedTicket} selectedProducts={selectedProducts}
                        ticketSubtotal={ticketSubtotal} grandTotal={grandTotal}
                        errors={errors}
                        toggleProduct={toggleProduct} updateProductQty={updateProductQty} updateProductVariant={updateProductVariant}
                        onBack={() => router.visit(`/events/${event.slug}`)}
                        onNext={() => {
                            if (!authUser) {
                                setAuthGateOpen(true);
                            } else {
                                goTo(2);
                            }
                        }} t={t}
                    />
                )}
                {step === 2 && (
                    <Step2Info
                        data={data} setData={setData} qty={qty}
                        selectedTicket={selectedTicket} grandTotal={grandTotal}
                        errors={errors} hasCustomFields={hasCustomFields}
                        sortedFields={sortedFields} locale={locale}
                        updateAttendee={updateAttendee} updateCustomField={updateCustomField}
                        hasTerms={hasTerms} termsAgreed={termsAgreed} setTermsAgreed={setTermsAgreed}
                        event={event}
                        onBack={() => goTo(1)} onNext={() => {
                            // Frontend eligibility pre-check before proceeding to review
                            if (selectedTicket) {
                                const { min_age, max_age, allowed_gender } = selectedTicket;
                                const hasEligibility = min_age || max_age || allowed_gender;
                                if (hasEligibility) {
                                    // Find dob and gender fields
                                    const dobField = (sortedFields as RegistrationField[]).find(
                                        f => f.type === 'date' && (f.key.includes('dob') || f.key.includes('birth'))
                                    );
                                    const genderField = (sortedFields as RegistrationField[]).find(f => f.key === 'gender');

                                    for (const attendee of (data.attendees as Attendee[])) {
                                        // Age check
                                        if ((min_age || max_age) && dobField) {
                                            const dobVal = attendee.custom_fields[dobField.key];
                                            if (dobVal) {
                                                const age = Math.floor(
                                                    (Date.now() - new Date(dobVal).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
                                                );
                                                if (min_age && max_age && (age < min_age || age > max_age)) {
                                                    setEligibilityWarning(`This ticket is for participants aged ${min_age}\u2013${max_age} years. The date of birth entered gives age ${age}.`);
                                                    return;
                                                } else if (min_age && !max_age && age < min_age) {
                                                    setEligibilityWarning(`This ticket is for participants aged ${min_age} and above. The date of birth entered gives age ${age}.`);
                                                    return;
                                                } else if (!min_age && max_age && age > max_age) {
                                                    setEligibilityWarning(`This ticket is for participants aged ${max_age} and below. The date of birth entered gives age ${age}.`);
                                                    return;
                                                }
                                            }
                                        }
                                        // Gender check
                                        if (allowed_gender && genderField) {
                                            const gVal = (attendee.custom_fields[genderField.key] ?? '').toLowerCase();
                                            const norm = ['male','lelaki','m'].includes(gVal) ? 'male'
                                                       : ['female','perempuan','f'].includes(gVal) ? 'female'
                                                       : gVal;
                                            if (norm && norm !== allowed_gender) {
                                                const label = allowed_gender === 'male' ? 'Male' : 'Female';
                                                setEligibilityWarning(`This ticket is for ${label} participants only.`);
                                                return;
                                            }
                                        }
                                    }
                                }
                            }
                            goTo(3);
                        }} t={t}
                    />
                )}
                {step === 3 && (
                    <Step3Review
                        event={event} data={data}
                        selectedTicket={selectedTicket} selectedProducts={selectedProducts} products={products}
                        qty={qty} ticketSubtotal={ticketSubtotal} grandTotal={grandTotal}
                        hasTerms={hasTerms} termsAgreed={termsAgreed} setTermsAgreed={setTermsAgreed}
                        processing={processing} locale={locale}
                        sortedFields={sortedFields} hasCustomFields={hasCustomFields}
                        onBack={() => goTo(2)} onSubmit={handleSubmit} t={t}
                    />
                )}
            </div>
            </div>
            {/* Auth gate — shown between Step 1 and Step 2 for unauthenticated users */}
            <RegistrationAuthGate
                open={authGateOpen}
                onOpenChange={setAuthGateOpen}
                onSignIn={() => { setAuthGateOpen(false); setLoginModalOpen(true); }}
                onCreateAccount={() => { setAuthGateOpen(false); setRegisterModalOpen(true); }}
                onContinueAsGuest={() => { setAuthGateOpen(false); goTo(2); }}
            />
            <LoginModal
                open={loginModalOpen}
                onOpenChange={setLoginModalOpen}
                onSwitchToRegister={() => { setLoginModalOpen(false); setRegisterModalOpen(true); }}
                onSwitchToForgotPassword={() => setLoginModalOpen(false)}
                returnTo={returnTo}
            />
            <RegisterModal
                open={registerModalOpen}
                onOpenChange={setRegisterModalOpen}
                onSwitchToLogin={() => { setRegisterModalOpen(false); setLoginModalOpen(true); }}
                returnTo={returnTo}
            />
        </PublicLayout>
    );
}

// ─── Step 1: Ticket Types + Add-ons ──────────────────────────────────────────

function Step1Tickets({ event, tickets, zones, products, data, setData, qty, selectedTicket,
    selectedProducts, ticketSubtotal, grandTotal, errors, toggleProduct, updateProductQty,
    updateProductVariant, onBack, onNext, t }: any) {

    return (
        <div className="space-y-6">
            <StepHeader title="Select Ticket" subtitle="Choose your category and quantity." />

            {/* Venue map */}
            {event.venue_map && (
                <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-border">
                    <img src={event.venue_map.url} alt="Venue map" className="w-full h-auto" />
                    {zones.length > 0 && (
                        <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-muted/50 border-t border-gray-100 dark:border-border">
                            {zones.map((zone: any) => (
                                <span key={zone.id}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                                    style={{ backgroundColor: zone.color, color: zone.label_color }}>
                                    {zone.name}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Ticket list */}
            <div className="bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-border flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand inline-block" />
                    <h3 className="font-bold text-gray-900 dark:text-foreground">Ticket Categories</h3>
                </div>
                <div className="p-5 space-y-3">
                    {zones.length > 0 ? (
                        <div className="space-y-5">
                            {zones.map((zone: any) => {
                                const zt = tickets.filter((tk: any) => tk.event_zone_id === zone.id && tk.is_on_sale);
                                if (!zt.length) return null;
                                return (
                                    <div key={zone.id} className="rounded-xl border-2 overflow-hidden"
                                        style={{ borderColor: zone.color + '60' }}>
                                        <div className="px-4 py-3 flex items-center justify-between"
                                            style={{ backgroundColor: zone.color, color: zone.label_color }}>
                                            <span className="font-bold text-sm">{zone.name}</span>
                                            {zone.capacity != null && <span className="text-xs opacity-80">{zone.capacity} seats</span>}
                                        </div>
                                        <div className="p-4 space-y-2">
                                            {zt.map((ticket: any) => (
                                                <TicketOption key={ticket.id} ticket={ticket}
                                                    selected={data.ticket_id === String(ticket.id)}
                                                    onSelect={() => setData('ticket_id', String(ticket.id))} />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                            {tickets.filter((tk: any) => !tk.event_zone_id && tk.is_on_sale).map((ticket: any) => (
                                <TicketOption key={ticket.id} ticket={ticket}
                                    selected={data.ticket_id === String(ticket.id)}
                                    onSelect={() => setData('ticket_id', String(ticket.id))} />
                            ))}
                        </div>
                    ) : tickets.filter((tk: any) => tk.is_on_sale).length > 0 ? (
                        tickets.filter((tk: any) => tk.is_on_sale).map((ticket: any) => (
                            <TicketOption key={ticket.id} ticket={ticket}
                                selected={data.ticket_id === String(ticket.id)}
                                onSelect={() => setData('ticket_id', String(ticket.id))} />
                        ))
                    ) : (
                        <p className="text-center py-6 text-gray-400">{t('tickets.no_tickets')}</p>
                    )}
                    {errors.ticket_id && <p className="text-sm text-red-600 mt-1">{errors.ticket_id}</p>}

                    {/* Quantity selector */}
                    {selectedTicket && (
                        <div className="flex items-center gap-3 pt-3 border-t border-gray-100 dark:border-border">
                            <span className="text-sm font-semibold text-gray-700 dark:text-foreground">{t('register.num_attendees')}</span>
                            <div className="flex items-center border border-gray-200 dark:border-border rounded-lg overflow-hidden">
                                <button type="button"
                                    onClick={() => setData('quantity', String(Math.max(1, qty - 1)))}
                                    disabled={qty <= 1}
                                    className="px-3 py-2 hover:bg-gray-50 dark:hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                                    <Minus className="w-4 h-4" />
                                </button>
                                <span className="px-4 py-2 font-bold text-sm min-w-[2.5rem] text-center">{data.quantity}</span>
                                <button type="button"
                                    onClick={() => setData('quantity', String(Math.min(selectedTicket.max_per_order, qty + 1)))}
                                    className="px-3 py-2 hover:bg-gray-50 dark:hover:bg-muted transition-colors">
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                            <span className="text-xs text-gray-400 dark:text-muted-foreground">max {selectedTicket.max_per_order}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Add-ons */}
            {products.length > 0 && (
                <div className="bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 dark:border-border flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-brand" />
                        <h3 className="font-bold text-gray-900 dark:text-foreground">{t('register.addon_products')}</h3>
                    </div>
                    <div className="p-5 space-y-4">
                        {products.map((product: any) => {
                            const sel = selectedProducts.find((p: any) => p.product_id === product.id);
                            const isSelected = !!sel;
                            return (
                                <div key={product.id}
                                    className={['p-4 rounded-xl border-2 transition-all', isSelected ? 'border-brand bg-brand/5' : 'border-gray-200'].join(' ')}>
                                    <div className="flex items-start gap-3">
                                        {product.media && (
                                            <img src={product.media.url} alt={product.name}
                                                className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <p className="font-semibold text-sm">{product.name}</p>
                                                    {product.description && <p className="text-xs text-gray-500 mt-0.5">{product.description}</p>}
                                                </div>
                                                <p className="font-bold text-sm flex-shrink-0">RM {Number(product.price).toFixed(2)}</p>
                                            </div>
                                            <div className="mt-3 flex items-center gap-2 flex-wrap">
                                                <button type="button" onClick={() => toggleProduct(product.id)}
                                                    className={[
                                                        'px-3 py-1.5 rounded-lg text-xs font-bold border transition-all',
                                                        isSelected ? 'bg-brand text-white border-brand' : 'border-gray-300 dark:border-border text-gray-700 dark:text-muted-foreground hover:border-brand hover:text-brand',
                                                    ].join(' ')}>
                                                    {isSelected ? '✓ Added' : '+ Add'}
                                                </button>
                                                {isSelected && (
                                                    <div className="flex items-center border border-gray-200 dark:border-border rounded-lg overflow-hidden">
                                                        <button type="button"
                                                            onClick={() => { const nq = (sel?.quantity ?? 1) - 1; nq <= 0 ? toggleProduct(product.id) : updateProductQty(product.id, nq); }}
                                                            className="px-2 py-1 hover:bg-gray-50 dark:hover:bg-muted transition-colors">
                                                            <Minus className="w-3 h-3" />
                                                        </button>
                                                        <span className="px-2 text-xs font-bold">{sel?.quantity ?? 1}</span>
                                                        <button type="button"
                                                            onClick={() => updateProductQty(product.id, Math.min(product.stock ?? 99, (sel?.quantity ?? 1) + 1))}
                                                            className="px-2 py-1 hover:bg-gray-50 dark:hover:bg-muted transition-colors">
                                                            <Plus className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            {isSelected && product.variants_json?.length > 0 && (
                                                <div className="mt-3 p-3 bg-white dark:bg-muted/30 rounded-lg border border-gray-200 dark:border-border">
                                                    <p className="text-xs font-semibold text-gray-700 dark:text-foreground mb-2">Select {product.variants_json[0].label} for each item:</p>
                                                    <div className="space-y-2">
                                                        {Array.from({ length: sel?.quantity ?? 1 }).map((_: any, itemIndex: number) => (
                                                            <div key={itemIndex} className="flex items-center gap-2">
                                                                <span className="text-xs text-gray-500 min-w-fit">Item {itemIndex + 1}:</span>
                                                                <Select
                                                                    value={sel?.variants?.[itemIndex] ?? ''}
                                                                    onValueChange={v => updateProductVariant(product.id, itemIndex, v)}>
                                                                    <SelectTrigger className="h-8 flex-1 text-xs">
                                                                        <SelectValue placeholder="Select" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {(product.variants_json?.[0]?.options ?? []).map((opt: string) => (
                                                                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <OrderSummaryBar selectedTicket={selectedTicket} qty={qty}
                ticketSubtotal={ticketSubtotal} selectedProducts={selectedProducts}
                products={products} grandTotal={grandTotal} />

            <StepNav onBack={onBack} onNext={onNext} nextDisabled={!data.ticket_id} nextLabel="Next: Your Info" backLabel="Back to Event" />
        </div>
    );
}

// ─── Step 2: Personal / Team Info ─────────────────────────────────────────────

function Step2Info({ data, setData, qty, selectedTicket, grandTotal, errors, hasCustomFields,
    sortedFields, locale, updateAttendee, updateCustomField,
    hasTerms, termsAgreed, setTermsAgreed, event,
    onBack, onNext, t }: any) {

    function isValid(): boolean {
        for (let i = 0; i < data.attendees.length; i++) {
            const a = data.attendees[i];
            if (!a.name.trim() || !a.email.trim() || !a.phone.trim()) return false;
            if (hasCustomFields) {
                for (const f of (sortedFields as RegistrationField[]).filter(sf => sf.required && !sf.locked)) {
                    const val = a.custom_fields[f.key] ?? '';
                    if (!val.trim() || val === 'false') return false;
                }
            }
        }
        if (hasTerms && !termsAgreed) return false;
        return true;
    }

    return (
        <div className="space-y-6">
            <StepHeader
                title={qty === 1 ? 'Your Details' : `Participant Details (${qty} attendees)`}
                subtitle="Fill in the information for each participant." />

            {(data.attendees as Attendee[]).map((attendee, index) => (
                <div key={index} className="bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 dark:border-border flex items-center gap-2 bg-gray-50 dark:bg-muted/50">
                        <div className="w-7 h-7 rounded-full bg-brand text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {index + 1}
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-foreground text-sm">
                            {qty === 1 ? t('register.your_details') : `Participant ${index + 1}`}
                            {qty > 1 && index === 0 && (
                                <span className="text-xs font-normal text-gray-400 dark:text-muted-foreground ml-2">(Primary buyer)</span>
                            )}
                        </h3>
                    </div>
                    <div className="p-5">
                        {hasCustomFields ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor={`name_${index}`}>{t('register.full_name')} <span className="text-red-500">*</span></Label>
                                    <Input id={`name_${index}`} value={attendee.name}
                                        onChange={e => updateAttendee(index, 'name', e.target.value)}
                                        className="mt-2 h-12 sm:h-9" placeholder={t('register.full_name_placeholder')} required />
                                    {(errors as any)[`attendees.${index}.name`] && (
                                        <p className="text-xs text-red-600 mt-1">{(errors as any)[`attendees.${index}.name`]}</p>
                                    )}
                                </div>
                                <div>
                                    <Label htmlFor={`email_${index}`}>{t('register.email')} <span className="text-red-500">*</span></Label>
                                    <Input id={`email_${index}`} type="email" value={attendee.email}
                                        onChange={e => updateAttendee(index, 'email', e.target.value)}
                                        className="mt-2 h-12 sm:h-9" placeholder={t('register.email_placeholder')} required />
                                    {(errors as any)[`attendees.${index}.email`] && (
                                        <p className="text-xs text-red-600 mt-1">{(errors as any)[`attendees.${index}.email`]}</p>
                                    )}
                                </div>
                                <div>
                                    <Label htmlFor={`phone_${index}`}>{t('register.phone')} <span className="text-red-500">*</span></Label>
                                    <Input id={`phone_${index}`} value={attendee.phone}
                                        onChange={e => updateAttendee(index, 'phone', e.target.value)}
                                        className="mt-2 h-12 sm:h-9" placeholder={t('register.phone_placeholder')} required />
                                    {(errors as any)[`attendees.${index}.phone`] && (
                                        <p className="text-xs text-red-600 mt-1">{(errors as any)[`attendees.${index}.phone`]}</p>
                                    )}
                                </div>
                                {(sortedFields as RegistrationField[]).filter(f => !f.locked && f.type !== 'checkbox').map(field => (
                                    <div key={field.key}
                                        className={field.type === 'textarea' ? 'sm:col-span-2' : ''}>
                                        <CustomFieldInput
                                            field={field}
                                            value={attendee.custom_fields[field.key] ?? ''}
                                            onChange={(val: string) => updateCustomField(index, field.key, val)}
                                            onIcParsedDob={field.key === 'ic_number'
                                                ? (icVal: string, dob: string) => {
                                                    const updated = [...data.attendees];
                                                    updated[index] = {
                                                        ...updated[index],
                                                        custom_fields: {
                                                            ...updated[index].custom_fields,
                                                            ic_number: icVal,
                                                            date_of_birth: dob,
                                                        },
                                                    };
                                                    setData('attendees', updated);
                                                }
                                                : undefined}
                                            locale={locale}
                                            ticketName={selectedTicket?.name ?? null}
                                            error={(errors as any)[`attendees.${index}.custom_fields.${field.key}`]}
                                            inputId={`cf_${index}_${field.key}`} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor={`name_${index}`}>{t('register.full_name')}</Label>
                                    <Input id={`name_${index}`} value={attendee.name}
                                        onChange={e => updateAttendee(index, 'name', e.target.value)}
                                        className="mt-2 h-12 sm:h-9" placeholder={t('register.full_name_placeholder')} />
                                </div>
                                <div>
                                    <Label htmlFor={`email_${index}`}>{t('register.email')}</Label>
                                    <Input id={`email_${index}`} type="email" value={attendee.email}
                                        onChange={e => updateAttendee(index, 'email', e.target.value)}
                                        className="mt-2 h-12 sm:h-9" placeholder={t('register.email_placeholder')} />
                                </div>
                                <div>
                                    <Label htmlFor={`phone_${index}`}>{t('register.phone')} <span className="text-red-500">*</span></Label>
                                    <Input id={`phone_${index}`} value={attendee.phone}
                                        onChange={e => updateAttendee(index, 'phone', e.target.value)}
                                        className="mt-2 h-12 sm:h-9" placeholder={t('register.phone_placeholder')} required />
                                </div>
                                <div>
                                    <Label htmlFor={`company_${index}`}>{t('register.company')}</Label>
                                    <Input id={`company_${index}`} value={attendee.company}
                                        onChange={e => updateAttendee(index, 'company', e.target.value)}
                                        className="mt-2 h-12 sm:h-9" />
                                </div>
                                <div>
                                    <Label htmlFor={`job_title_${index}`}>{t('register.job_title')}</Label>
                                    <Input id={`job_title_${index}`} value={attendee.job_title}
                                        onChange={e => updateAttendee(index, 'job_title', e.target.value)}
                                        className="mt-2 h-12 sm:h-9" />
                                </div>
                                <div>
                                    <Label htmlFor={`dietary_${index}`}>{t('register.dietary')}</Label>
                                    <Input id={`dietary_${index}`} value={attendee.dietary_requirements}
                                        onChange={e => updateAttendee(index, 'dietary_requirements', e.target.value)}
                                        className="mt-2 h-12 sm:h-9" placeholder={t('register.dietary_placeholder')} />
                                </div>
                            </div>
                        )}
                        {index === data.attendees.length - 1 && (
                            <div className="mt-4">
                                <Label htmlFor="notes">{t('register.notes')}</Label>
                                <Textarea id="notes" value={data.notes}
                                    onChange={e => setData('notes', e.target.value)}
                                    rows={3} className="mt-1 resize-y"
                                    placeholder={t('register.notes_placeholder')} />
                            </div>
                        )}
                        {hasCustomFields && (sortedFields as RegistrationField[]).filter(f => !f.locked && f.type === 'checkbox').map(field => (
                            <div key={field.key} className="mt-4">
                                <CustomFieldInput
                                    field={field}
                                    value={attendee.custom_fields[field.key] ?? ''}
                                    onChange={(val: string) => updateCustomField(index, field.key, val)}
                                    locale={locale}
                                    ticketName={selectedTicket?.name ?? null}
                                    error={(errors as any)[`attendees.${index}.custom_fields.${field.key}`]}
                                    inputId={`cf_${index}_${field.key}`} />
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {/* Terms & Conditions — shown in Step 2, below the attendee form */}
            {hasTerms && (
                <div className="rounded-xl border border-gray-200 dark:border-border bg-white dark:bg-card overflow-hidden">
                    <div className="bg-gray-50 dark:bg-muted/50 border-b border-gray-200 dark:border-border px-4 py-2.5 flex items-center gap-2">
                        <svg className="w-3.5 h-3.5 text-brand flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                        <span className="text-xs font-bold text-gray-600 dark:text-muted-foreground uppercase tracking-wide">Terms &amp; Conditions</span>
                    </div>
                    <div className="px-4 pt-3 pb-1 max-h-48 overflow-y-auto">
                        <p className="text-sm text-gray-600 dark:text-muted-foreground whitespace-pre-wrap leading-relaxed">{event.terms_conditions}</p>
                    </div>
                    <div className="px-4 py-3 bg-gray-50 dark:bg-muted/50 border-t border-gray-200 dark:border-border">
                        <label className="flex items-start gap-3 cursor-pointer select-none">
                            <input type="checkbox" checked={termsAgreed}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTermsAgreed(e.target.checked)}
                                className="accent-brand w-4 h-4 mt-0.5 flex-shrink-0 cursor-pointer" />
                            <span className="text-sm font-semibold text-gray-800 dark:text-foreground leading-snug">
                                I have read and agree to the Terms &amp; Conditions above.
                                <span className="text-red-500 ml-1">*</span>
                            </span>
                        </label>
                    </div>
                </div>
            )}

            <OrderSummaryBar selectedTicket={selectedTicket} qty={qty}
                ticketSubtotal={0} selectedProducts={[]} products={[]}
                grandTotal={grandTotal} compact />

            <StepNav onBack={onBack} onNext={onNext} nextDisabled={!isValid()} nextLabel="Next: Review" />
        </div>
    );
}

// ─── Step 3: Review & Submit ──────────────────────────────────────────────────

function Step3Review({ event, data, selectedTicket, selectedProducts, products, qty, ticketSubtotal,
    grandTotal, hasTerms, termsAgreed, setTermsAgreed, processing, locale,
    sortedFields, hasCustomFields, onBack, onSubmit }: any) {

    return (
        <div className="space-y-6">
            <StepHeader title="Review Your Order" subtitle="Check everything before submitting." />

            {/* Order summary */}
            <div className="bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-border flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-brand" />
                    <h3 className="font-bold text-gray-900 dark:text-foreground">Order Summary</h3>
                </div>
                <div className="p-5 space-y-3">
                    {selectedTicket ? (
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-gray-900 dark:text-foreground">{selectedTicket.name}</p>
                                <p className="text-xs text-gray-500 dark:text-muted-foreground">Quantity: {qty}</p>
                            </div>
                            <p className="font-bold text-gray-900 dark:text-foreground">RM {ticketSubtotal.toFixed(2)}</p>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400 dark:text-muted-foreground">No ticket selected</p>
                    )}
                    {(selectedProducts as ProductSelection[]).map(sp => {
                        const product = (products as EventProduct[]).find(p => p.id === sp.product_id);
                        if (!product) return null;
                        return (
                            <div key={sp.product_id} className="flex items-center justify-between text-sm">
                                <div>
                                    <p className="font-medium text-gray-800 dark:text-foreground">{product.name} × {sp.quantity}</p>
                                    {sp.variants.filter(Boolean).length > 0 && (
                                        <p className="text-xs text-gray-400 dark:text-muted-foreground">{sp.variants.filter(Boolean).join(', ')}</p>
                                    )}
                                </div>
                                <p className="font-semibold">RM {(product.price * sp.quantity).toFixed(2)}</p>
                            </div>
                        );
                    })}
                    <div className="border-t border-gray-100 dark:border-border pt-3 flex items-center justify-between font-bold">
                        <span>Total</span>
                        <span className="text-brand text-lg">{grandTotal > 0 ? `RM ${grandTotal.toFixed(2)}` : 'Free'}</span>
                    </div>
                </div>
            </div>

            {/* Attendee summaries */}
            {(data.attendees as Attendee[]).map((attendee, index) => (
                <div key={index} className="bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 dark:border-border bg-gray-50 dark:bg-muted/50 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-brand text-white flex items-center justify-center text-xs font-bold">
                            {index + 1}
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-foreground text-sm">
                            {qty === 1 ? 'Your Details' : `Participant ${index + 1}`}
                        </h3>
                    </div>
                    <div className="p-5">
                        {/* Core contact fields */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                            <div className="col-span-2">
                                <ReviewField label="Full Name" value={attendee.name} />
                            </div>
                            <ReviewField label="Email" value={attendee.email} />
                            <ReviewField label="Phone" value={attendee.phone} />
                            {!hasCustomFields && attendee.company && (
                                <ReviewField label="Company" value={attendee.company} />
                            )}
                        </div>

                        {/* Custom fields */}
                        {hasCustomFields && (
                            <>
                                <div className="border-t border-gray-100 dark:border-border my-4" />
                                <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                                    {(sortedFields as RegistrationField[]).filter(f => !f.locked).map(field => {
                                        const label = locale === 'ms' ? field.label_ms : field.label_en;
                                        const val = attendee.custom_fields[field.key];
                                        if (!val || val === 'false') return null;
                                        const displayVal = val === 'true' ? '✓ Yes' : val;
                                        const isWide = field.type === 'textarea' || field.type === 'checkbox'
                                            || label.length > 16 || displayVal.length > 22;
                                        return (
                                            <div key={field.key} className={isWide ? 'col-span-2' : ''}>
                                                <ReviewField label={label} value={displayVal} />
                                            </div>
                                        );
                                    })}
                                    {index === data.attendees.length - 1 && data.notes && (
                                        <div className="col-span-2">
                                            <ReviewField label="Notes" value={data.notes} />
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {/* Notes when no custom fields */}
                        {!hasCustomFields && index === data.attendees.length - 1 && data.notes && (
                            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-border">
                                <ReviewField label="Notes" value={data.notes} />
                            </div>
                        )}
                    </div>
                </div>
            ))}

            {/* Submit + Back */}
            <div className="space-y-2">
                <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
                    <button type="button" onClick={onBack}
                        className="flex items-center justify-center gap-1.5 text-sm font-semibold text-gray-600 dark:text-muted-foreground bg-gray-50 dark:bg-muted border border-gray-400 dark:border-border hover:border-brand hover:text-brand hover:bg-white dark:hover:bg-card rounded-xl py-3 px-6 transition-colors w-full sm:w-auto">
                        <ChevronLeft className="w-4 h-4" /> Back to Your Info
                    </button>
                    <Button
                        type="button"
                        onClick={onSubmit}
                        disabled={processing || !selectedTicket}
                        className="w-full sm:w-auto sm:min-w-[220px] bg-brand hover:bg-brand-dark text-white font-bold py-4 rounded-xl text-base disabled:opacity-50"
                        size="lg">
                        {processing ? 'Submitting…' : grandTotal > 0 ? `Register — RM ${grandTotal.toFixed(2)}` : 'Register — Free'}
                    </Button>
                </div>
                <p className="text-center text-xs text-gray-500 dark:text-muted-foreground uppercase tracking-wider">🔒 Secure &amp; Instant Checkout</p>
            </div>
        </div>
    );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function StepHeader({ title, subtitle }: { title: string; subtitle?: string }) {
    return (
        <div>
            <h2 className="text-xl font-extrabold text-gray-900 dark:text-foreground">{title}</h2>
            {subtitle && <p className="text-sm text-gray-500 dark:text-muted-foreground mt-1">{subtitle}</p>}
        </div>
    );
}

function StepNav({ onBack, onNext, nextDisabled, nextLabel, backLabel, showBack = true }: {
    onBack?: () => void;
    onNext?: () => void;
    nextDisabled?: boolean;
    nextLabel?: string;
    backLabel?: string;
    showBack?: boolean;
}) {
    return (
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
            {onBack ? (
                <button type="button" onClick={onBack}
                    className="flex items-center justify-center gap-1.5 text-sm font-semibold text-gray-600 dark:text-muted-foreground bg-gray-50 dark:bg-muted border border-gray-400 dark:border-border hover:border-brand hover:text-brand hover:bg-white dark:hover:bg-card rounded-xl py-3 px-6 transition-colors w-full sm:w-auto">
                    <ChevronLeft className="w-4 h-4" /> {backLabel ?? 'Back'}
                </button>
            ) : <div />}
            {onNext && (
                <Button type="button" onClick={onNext} disabled={nextDisabled}
                    className="bg-brand hover:bg-brand-dark text-white font-bold px-8 py-3 rounded-xl text-sm disabled:opacity-40 w-full sm:w-auto">
                    {nextLabel ?? 'Next'} <ChevronRight className="w-4 h-4 ml-1.5" />
                </Button>
            )}
        </div>
    );
}

function OrderSummaryBar({ selectedTicket, qty, ticketSubtotal, selectedProducts, products, grandTotal, compact }: {
    selectedTicket: EventTicket | undefined;
    qty: number;
    ticketSubtotal: number;
    selectedProducts: ProductSelection[];
    products: EventProduct[];
    grandTotal: number;
    compact?: boolean;
}) {
    if (!selectedTicket) return null;

    const summaryContent = (
        <>
            <div className="min-w-0">
                <p className="text-[10px] text-gray-400 dark:text-muted-foreground uppercase font-semibold tracking-wide">Order Summary</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-foreground truncate mt-0.5">
                    {selectedTicket.name} × {qty}
                    {!compact && selectedProducts.length > 0 && ` + ${selectedProducts.length} add-on(s)`}
                </p>
            </div>
            <div className="text-right flex-shrink-0">
                <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide">Total</p>
                <p className="text-lg font-extrabold text-brand">
                    {grandTotal > 0 ? `RM ${grandTotal.toFixed(2)}` : 'Free'}
                </p>
            </div>
        </>
    );

    return (
        <>
            {/* Mobile: fixed sticky bar at bottom */}
            <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-card border-t border-gray-200 dark:border-border shadow-[0_-4px_12px_rgba(0,0,0,0.08)] px-4 py-3 flex items-center justify-between gap-4">
                {summaryContent}
            </div>

            {/* Desktop: inline card */}
            <div className="hidden sm:flex bg-gray-50 dark:bg-muted rounded-xl border border-gray-200 dark:border-border px-5 py-4 items-center justify-between gap-4">
                {summaryContent}
            </div>
        </>
    );
}

function ReviewField({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-[11px] uppercase tracking-wider text-gray-400 dark:text-muted-foreground font-semibold leading-tight break-words">{label}</p>
            <p className="text-sm font-medium text-gray-900 dark:text-foreground mt-1 break-words">{value || '—'}</p>
        </div>
    );
}

// ─── Custom Field Input ───────────────────────────────────────────────────────

function CustomFieldInput({ field, value, onChange, onIcParsedDob, locale, ticketName, error, inputId }: {
    field: RegistrationField;
    value: string;
    onChange: (val: string) => void;
    onIcParsedDob?: (icVal: string, dob: string) => void;
    locale: string;
    ticketName?: string | null;
    error?: string;
    inputId: string;
}) {
    const label = locale === 'ms' ? field.label_ms : field.label_en;
    const placeholder = locale === 'ms' ? (field.placeholder_ms ?? '') : (field.placeholder_en ?? '');
    const options = resolveFieldOptions(field, ticketName ?? null, locale);

    // ── IC Number masking: xxxxxx-xx-xxxx ─────────────────────────────────
    function handleIcChange(raw: string) {
        // Strip everything except digits
        const digits = raw.replace(/\D/g, '').slice(0, 12);
        // Build masked value
        let masked = digits;
        if (digits.length > 6) masked = digits.slice(0, 6) + '-' + digits.slice(6);
        if (digits.length > 8) masked = digits.slice(0, 6) + '-' + digits.slice(6, 8) + '-' + digits.slice(8);
        // Auto-fill DOB when all 12 digits are present — one atomic update
        if (digits.length === 12 && onIcParsedDob) {
            const yy = parseInt(digits.slice(0, 2), 10);
            const mm = digits.slice(2, 4);
            const dd = digits.slice(4, 6);
            const currentYY = new Date().getFullYear() % 100;
            const yyyy = yy > currentYY ? 1900 + yy : 2000 + yy;
            onIcParsedDob(masked, `${yyyy}-${mm}-${dd}`);
        } else {
            onChange(masked);
        }
    }

    return (
        <>
            {field.type !== 'checkbox' && (
                <Label htmlFor={inputId}>{label}{field.required && <span className="text-red-500 ml-1">*</span>}</Label>
            )}
            {field.type === 'text' && field.key === 'ic_number' && (
                <Input id={inputId} value={value}
                    onChange={e => handleIcChange(e.target.value)}
                    className="mt-2 h-12 sm:h-9 font-mono tracking-wider" placeholder="xxxxxx-xx-xxxx"
                    inputMode="numeric" required={field.required} />
            )}
            {field.type === 'text' && field.key !== 'ic_number' && (
                <Input id={inputId} value={value} onChange={e => onChange(e.target.value)}
                    className="mt-2 h-12 sm:h-9" placeholder={placeholder} required={field.required} />
            )}
            {field.type === 'textarea' && (
                <Textarea id={inputId} value={value} onChange={e => onChange(e.target.value)}
                    className="mt-1 resize-none" rows={3} placeholder={placeholder} />
            )}
            {field.type === 'select' && (
                <Select value={value} onValueChange={onChange}>
                    <SelectTrigger className="mt-2 h-12 sm:h-9">
                        <SelectValue placeholder={placeholder || `— ${label} —`} />
                    </SelectTrigger>
                    <SelectContent>
                        {options.map((opt: string) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                    </SelectContent>
                </Select>
            )}
            {field.type === 'radio' && (
                <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
                    {options.map((opt: string) => (
                        <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
                            <input type="radio" name={inputId} value={opt} checked={value === opt}
                                onChange={() => onChange(opt)} className="accent-brand" />
                            {opt}
                        </label>
                    ))}
                </div>
            )}
            {field.type === 'date' && (
                <Input id={inputId} type="date" value={value} onChange={e => onChange(e.target.value)}
                    className="mt-2 h-12 sm:h-9" inputMode="numeric" required={field.required} />
            )}
            {field.type === 'checkbox' && (() => {
                const description = locale === 'ms' ? (field.description_ms ?? field.description_en) : (field.description_en ?? field.description_ms);
                return description ? (
                    <div className="rounded-xl border border-gray-200 dark:border-border bg-white dark:bg-card overflow-hidden">
                        <div className="bg-gray-50 dark:bg-muted/50 border-b border-gray-200 dark:border-border px-4 py-2.5 flex items-center gap-2">
                            <svg className="w-3.5 h-3.5 text-brand flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                            <span className="text-xs font-bold text-gray-600 dark:text-muted-foreground uppercase tracking-wide">Event Waiver</span>
                        </div>
                        <div className="px-4 pt-3 pb-1 max-h-40 overflow-y-auto">
                            <p className="text-sm text-gray-600 dark:text-muted-foreground leading-relaxed">{description}</p>
                        </div>
                        <div className="px-4 py-3 bg-gray-50 dark:bg-muted/50 border-t border-gray-200 dark:border-border">
                            <label htmlFor={inputId} className="flex items-start gap-3 cursor-pointer select-none">
                                <input id={inputId} type="checkbox" checked={value === 'true'}
                                    onChange={e => onChange(e.target.checked ? 'true' : 'false')}
                                    className="accent-brand w-4 h-4 mt-0.5 flex-shrink-0" required={field.required} />
                                <span className="text-sm font-semibold text-gray-800 dark:text-foreground leading-snug">
                                    {label}{field.required && <span className="text-red-500 ml-1">*</span>}
                                </span>
                            </label>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-start gap-2 pt-1">
                        <input id={inputId} type="checkbox" checked={value === 'true'}
                            onChange={e => onChange(e.target.checked ? 'true' : 'false')}
                            className="accent-brand w-4 h-4 mt-0.5 flex-shrink-0" required={field.required} />
                        <Label htmlFor={inputId} className="text-sm font-normal cursor-pointer leading-snug">
                            {label}{field.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                    </div>
                );
            })()}
            {error && (
                <p className="text-xs text-red-600 mt-1">
                    {error.replace(/[Tt]he attendees\.\d+\.custom_fields\.\S+ (field )?/g, `${label} `)}
                </p>
            )}
        </>
    );
}

// ─── Ticket Option ────────────────────────────────────────────────────────────

function TicketOption({ ticket, selected, onSelect }: {
    ticket: EventTicket;
    selected: boolean;
    onSelect: () => void;
}) {
    const borderStyle = ticket.color && !selected
        ? { borderLeftWidth: '4px', borderLeftColor: ticket.color, borderTopWidth: '1px', borderRightWidth: '1px', borderBottomWidth: '1px' }
        : undefined;

    return (
        <label className={[
            'flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all',
            selected ? 'border-2 border-brand bg-brand/5' : 'border border-gray-200 dark:border-border hover:border-gray-300 dark:hover:border-border/80 dark:bg-card',
        ].join(' ')} style={borderStyle}>
            <div className="flex items-center gap-3">
                <input type="radio" name="ticket_id" value={ticket.id} checked={selected}
                    onChange={onSelect} className="accent-brand" />
                <div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">{ticket.name}</p>
                        {ticket.is_early_bird && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                <Clock className="w-3 h-3" /> Early Bird
                            </span>
                        )}
                    </div>
                    {/* Eligibility info */}
                    {(ticket.min_age || ticket.max_age || ticket.allowed_gender) && (
                        <div className="flex items-center gap-3 flex-wrap mt-1">
                            {(ticket.min_age || ticket.max_age) && (
                                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                                    <CalendarDays className="w-3 h-3" />
                                    {ticket.min_age && ticket.max_age
                                        ? `Ages ${ticket.min_age}–${ticket.max_age}`
                                        : ticket.min_age ? `Age ${ticket.min_age}+` : `Age ≤${ticket.max_age}`}
                                </span>
                            )}
                            {ticket.allowed_gender && (
                                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                                    <Users className="w-3 h-3" />
                                    {ticket.allowed_gender === 'male' ? 'Male only' : 'Female only'}
                                </span>
                            )}
                        </div>
                    )}
                    {ticket.description && <p className="text-xs text-gray-500 dark:text-muted-foreground mt-0.5 line-clamp-2">{ticket.description}</p>}
                    {ticket.available_count != null && ticket.available_count <= 50 && (
                        <p className="text-[10px] text-amber-600 font-bold mt-0.5">{ticket.available_count} spots left</p>
                    )}
                    {ticket.is_early_bird && ticket.early_bird_end_at && (
                        <p className="text-[10px] text-amber-700 mt-0.5">
                            Ends {new Date(ticket.early_bird_end_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                    )}
                </div>
            </div>
            <div className="text-right flex-shrink-0 ml-4">
                {ticket.type === 'free' ? (
                    <p className="font-extrabold text-emerald-600">Free</p>
                ) : ticket.is_early_bird ? (
                    <>
                        <p className="font-extrabold text-emerald-600">RM {Number(ticket.current_price).toFixed(2)}</p>
                        <p className="text-xs text-gray-400 line-through">RM {Number(ticket.price).toFixed(2)}</p>
                    </>
                ) : (
                    <p className="font-extrabold text-gray-900">RM {Number(ticket.current_price).toFixed(2)}</p>
                )}
            </div>
        </label>
    );
}
