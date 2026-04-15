import PublicLayout from '@/Layouts/PublicLayout';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Link, useForm, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Calendar, MapPin, ChevronLeft, Ticket, ShoppingBag, Plus, Minus, AlertCircle, User, Palette, Clock, Check } from 'lucide-react';
import { type Event, type EventTicket, type EventProduct, type EventZone } from '@/types';
import { useTranslation } from '@/hooks/use-translation';

const STATUS_CONFIG: Record<string, { labelKey: string; classes: string }> = {
    upcoming: { labelKey: 'event.badge_upcoming', classes: 'bg-emerald-100 text-emerald-800 border border-emerald-200' },
    past:     { labelKey: 'event.badge_past',     classes: 'bg-gray-100 text-gray-600 border border-gray-200' },
    draft:    { labelKey: 'event.badge_draft',     classes: 'bg-yellow-100 text-yellow-800 border border-yellow-200' },
};

interface Props {
    event: Event;
    tickets: EventTicket[];
    products: EventProduct[];
    zones: EventZone[];
}

interface ProductSelection {
    product_id: number;
    variant: string;
    quantity: number;
}

interface Attendee {
    name: string;
    email: string;
    phone: string;
    company: string;
    job_title: string;
    dietary_requirements: string;
}

const emptyAttendee = (): Attendee => ({
    name: '',
    email: '',
    phone: '',
    company: '',
    job_title: '',
    dietary_requirements: '',
});

export default function EventRegister({ event, tickets, products, zones }: Props) {
    const { flash } = usePage().props as { flash: { success?: string; error?: string } };
    const { t } = useTranslation();
    const statusCfg = STATUS_CONFIG[event.status] ?? STATUS_CONFIG.draft;
    const [selectedProducts, setSelectedProducts] = useState<ProductSelection[]>([]);

    const { data, setData, post, processing, errors } = useForm({
        ticket_id: '',
        quantity: '1',
        attendees: [emptyAttendee()] as Attendee[],
        notes: '',
        products: [] as ProductSelection[],
    });

    const qty = Number(data.quantity) || 1;

    // Keep attendees array in sync with quantity
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

    const selectedTicket = tickets.find(t => t.id === Number(data.ticket_id));
    const ticketSubtotal = selectedTicket ? Number(selectedTicket.current_price) * qty : 0;
    const productsTotal = selectedProducts.reduce((sum, p) => {
        const product = products.find(pr => pr.id === p.product_id);
        return sum + (product ? product.price * p.quantity : 0);
    }, 0);
    const grandTotal = ticketSubtotal + productsTotal;

    const startDate = new Date(event.start_at);
    const endDate = event.end_at ? new Date(event.end_at) : null;
    const location = [event.venue, event.city, event.state].filter(Boolean).join(', ');

    const formatShortDate = (d: Date) =>
        d.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' });

    const formatTime = (d: Date) =>
        d.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', hour12: true });

    function updateAttendee(index: number, field: keyof Attendee, value: string) {
        const updated = [...data.attendees];
        updated[index] = { ...updated[index], [field]: value };
        setData('attendees', updated);
    }

    function toggleProduct(productId: number) {
        const exists = selectedProducts.find(p => p.product_id === productId);
        let updated: ProductSelection[];
        if (exists) {
            updated = selectedProducts.filter(p => p.product_id !== productId);
        } else {
            updated = [...selectedProducts, { product_id: productId, variant: '', quantity: 1 }];
        }
        setSelectedProducts(updated);
        setData('products', updated);
    }

    function updateProductSelection(productId: number, field: 'variant' | 'quantity', value: string | number) {
        const updated = selectedProducts.map(p => {
            if (p.product_id === productId) {
                return { ...p, [field]: value };
            }
            return p;
        });
        setSelectedProducts(updated);
        setData('products', updated);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post(`/events/${event.slug}/register`);
    }

    return (
        <PublicLayout>
            {/* Hero */}
            <div className="relative w-full bg-brand-navy overflow-hidden" style={{ minHeight: '170px' }}>
                <div className="absolute inset-0 bg-gradient-to-br from-brand-navy to-brand-dark opacity-90" />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col justify-end" style={{ minHeight: '170px' }}>
                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-1.5 text-xs text-brand-light/70 mb-6" aria-label="Breadcrumb">
                        <Link href="/" className="hover:text-brand-light transition-colors">{t('event.breadcrumb_home')}</Link>
                        <ChevronLeft className="w-3 h-3 flex-shrink-0 rotate-180" />
                        <Link href="/events" className="hover:text-brand-light transition-colors">{t('event.breadcrumb_events')}</Link>
                        <ChevronLeft className="w-3 h-3 flex-shrink-0 rotate-180" />
                        <Link href={`/events/${event.slug}`} className="hover:text-brand-light transition-colors truncate max-w-xs">{event.title}</Link>
                        <ChevronLeft className="w-3 h-3 flex-shrink-0 rotate-180" />
                        <span className="text-brand-light">{t('register.register')}</span>
                    </nav>

                    {/* Status badge */}
                    <span className={`self-start text-xs font-semibold px-3 py-1 rounded-full mb-4 ${statusCfg.classes}`}>
                        {t(statusCfg.labelKey)}
                    </span>

                    {/* Title */}
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-6 max-w-4xl">
                        {event.title}
                    </h1>

                    {/* Quick meta strip */}
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-brand-light/80">
                        <span className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-brand flex-shrink-0" />
                            {formatShortDate(startDate)}
                        </span>
                        {endDate && (
                            <span className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-brand flex-shrink-0" />
                                {formatTime(startDate)} – {formatTime(endDate)}
                            </span>
                        )}
                        {event.venue && (
                            <span className="flex items-center gap-1.5">
                                <MapPin className="w-4 h-4 text-brand flex-shrink-0" />
                                {event.venue}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
                {flash?.error && (
                    <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <p>{flash.error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
                        {/* Main Form */}
                        <div className="space-y-6">
                            {/* Venue Map */}
                            {event.venue_map && (
                                <Card>
                                    <CardContent className="p-4">
                                        <img
                                            src={event.venue_map.url}
                                            alt="Venue seating map"
                                            className="w-full h-auto rounded-lg"
                                        />
                                        {zones.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {zones.map(zone => (
                                                    <span
                                                        key={zone.id}
                                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                                                        style={{ backgroundColor: zone.color, color: zone.label_color }}
                                                    >
                                                        {zone.name}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Ticket Selection */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Ticket className="w-5 h-5 text-brand" /> {t('register.select_ticket')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {/* Zone-based display when zones exist */}
                                    {zones.length > 0 ? (
                                        <div className="space-y-5">
                                            {zones.map(zone => {
                                                const zoneTickets = tickets.filter(t => t.event_zone_id === zone.id && t.is_on_sale);
                                                if (zoneTickets.length === 0) return null;
                                                return (
                                                    <div key={zone.id} className="rounded-xl border-2 overflow-hidden" style={{ borderColor: zone.color + '60' }}>
                                                        {/* Zone header */}
                                                        <div className="px-4 py-3" style={{ backgroundColor: zone.color, color: zone.label_color }}>
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-bold text-sm">{zone.name}</span>
                                                                {zone.capacity !== null && <span className="text-xs opacity-80">{zone.capacity} seats</span>}
                                                            </div>
                                                            {zone.description && <p className="text-xs opacity-80 mt-0.5">{zone.description}</p>}
                                                        </div>

                                                        <div className="p-4">
                                                            {/* Zone image + perks */}
                                                            {(zone.image_url || (zone.perks && zone.perks.length > 0)) && (
                                                                <div className="flex gap-4 mb-4">
                                                                    {zone.image_url && (
                                                                        <img src={zone.image_url} alt={zone.name} className="w-28 h-20 rounded-lg object-cover flex-shrink-0" />
                                                                    )}
                                                                    {zone.perks && zone.perks.length > 0 && (
                                                                        <ul className="text-xs text-gray-600 space-y-1">
                                                                            {zone.perks.map((perk, i) => (
                                                                                <li key={i} className="flex items-start gap-1.5">
                                                                                    <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                                                                    {perk}
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* Ticket options */}
                                                            <div className="space-y-2">
                                                                {zoneTickets.map(ticket => (
                                                                    <TicketOption key={ticket.id} ticket={ticket} selected={data.ticket_id === String(ticket.id)} onSelect={() => setData('ticket_id', String(ticket.id))} />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {/* Unzoned tickets */}
                                            {tickets.filter(t => !t.event_zone_id && t.is_on_sale).map(ticket => (
                                                <TicketOption key={ticket.id} ticket={ticket} selected={data.ticket_id === String(ticket.id)} onSelect={() => setData('ticket_id', String(ticket.id))} />
                                            ))}
                                        </div>
                                    ) : (
                                        /* Flat ticket list (no zones) */
                                        <>
                                    {tickets.filter(t => t.is_on_sale).map(ticket => (
                                        <TicketOption key={ticket.id} ticket={ticket} selected={data.ticket_id === String(ticket.id)} onSelect={() => setData('ticket_id', String(ticket.id))} />
                                    ))}
                                    {tickets.filter(t => t.is_on_sale).length === 0 && (
                                        <p className="text-center py-6 text-gray-500">{t('tickets.no_tickets')}</p>
                                    )}
                                        </>
                                    )}
                                    {errors.ticket_id && <p className="text-sm text-red-600">{errors.ticket_id}</p>}

                                    {selectedTicket && (
                                        <div className="flex items-center gap-3 pt-2">
                                            <Label htmlFor="quantity">{t('register.num_attendees')}</Label>
                                            <div className="flex items-center border rounded-lg">
                                                <button
                                                    type="button"
                                                    onClick={() => setData('quantity', String(Math.max(1, qty - 1)))}
                                                    className="px-3 py-1 hover:bg-gray-100"
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </button>
                                                <span className="px-3 font-medium">{data.quantity}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setData('quantity', String(Math.min(selectedTicket.max_per_order, qty + 1)))}
                                                    className="px-3 py-1 hover:bg-gray-100"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <span className="text-xs text-muted-foreground">{t('register.max')} {selectedTicket.max_per_order}</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Products / Add-ons — right after ticket selection */}
                            {products.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <ShoppingBag className="w-5 h-5 text-brand" /> {t('register.addon_products')}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {products.map(product => {
                                            const isSelected = selectedProducts.some(p => p.product_id === product.id);
                                            const selection = selectedProducts.find(p => p.product_id === product.id);

                                            return (
                                                <div
                                                    key={product.id}
                                                    className={`p-4 rounded-lg border-2 transition-all ${
                                                        isSelected ? 'border-brand bg-brand/5' : 'border-gray-200'
                                                    }`}
                                                >
                                                    <div className="flex items-start gap-4">
                                                        {product.media && (
                                                            <img src={product.media.url} alt={product.name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                                                        )}
                                                        <div className="flex-1">
                                                            <div className="flex items-start justify-between">
                                                                <div>
                                                                    <p className="font-semibold">{product.name}</p>
                                                                    {product.description && <p className="text-sm text-gray-500 mt-0.5">{product.description}</p>}
                                                                </div>
                                                                <p className="font-bold text-lg ml-4">RM {Number(product.price).toFixed(2)}</p>
                                                            </div>

                                                            <div className="mt-3 flex items-center gap-3 flex-wrap">
                                                                <Button
                                                                    type="button"
                                                                    variant={isSelected ? 'default' : 'outline'}
                                                                    size="sm"
                                                                    onClick={() => toggleProduct(product.id)}
                                                                    className={isSelected ? 'bg-brand hover:bg-brand-dark' : ''}
                                                                >
                                                                    {isSelected ? t('register.added') : t('register.add_to_order')}
                                                                </Button>

                                                                {isSelected && (
                                                                    <>
                                                                        {/* Variant selector */}
                                                                        {product.variants_json?.map(v => (
                                                                            <div key={v.label} className="flex items-center gap-1">
                                                                                <span className="text-xs text-muted-foreground">{v.label}:</span>
                                                                                <Select
                                                                                    value={selection?.variant ?? ''}
                                                                                    onValueChange={val => updateProductSelection(product.id, 'variant', val)}
                                                                                >
                                                                                    <SelectTrigger className="h-8 w-20 text-xs">
                                                                                        <SelectValue placeholder="Select" />
                                                                                    </SelectTrigger>
                                                                                    <SelectContent>
                                                                                        {v.options.map(opt => (
                                                                                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                                                                        ))}
                                                                                    </SelectContent>
                                                                                </Select>
                                                                            </div>
                                                                        ))}

                                                                        {/* Quantity */}
                                                                        <div className="flex items-center border rounded">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => updateProductSelection(product.id, 'quantity', Math.max(1, (selection?.quantity ?? 1) - 1))}
                                                                                className="px-2 py-0.5 hover:bg-gray-100 text-sm"
                                                                            >
                                                                                <Minus className="w-3 h-3" />
                                                                            </button>
                                                                            <span className="px-2 text-sm font-medium">{selection?.quantity ?? 1}</span>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => updateProductSelection(product.id, 'quantity', Math.min(product.stock ?? 99, (selection?.quantity ?? 1) + 1))}
                                                                                className="px-2 py-0.5 hover:bg-gray-100 text-sm"
                                                                            >
                                                                                <Plus className="w-3 h-3" />
                                                                            </button>
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Attendee Details */}
                            {data.attendees.map((attendee, index) => (
                                <Card key={index}>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <User className="w-5 h-5 text-brand" />
                                            {qty === 1 ? t('register.your_details') : t('register.attendee_details', { index: index + 1 })}
                                            {qty > 1 && index === 0 && (
                                                <span className="text-xs font-normal text-muted-foreground ml-1">({t('register.primary_buyer')})</span>
                                            )}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor={`name_${index}`}>{t('register.full_name')}</Label>
                                                <Input
                                                    id={`name_${index}`}
                                                    value={attendee.name}
                                                    onChange={e => updateAttendee(index, 'name', e.target.value)}
                                                    className="mt-1"
                                                    placeholder={t('register.full_name_placeholder')}
                                                />
                                                {(errors as Record<string, string>)[`attendees.${index}.name`] && (
                                                    <p className="text-sm text-red-600 mt-1">{(errors as Record<string, string>)[`attendees.${index}.name`]}</p>
                                                )}
                                            </div>
                                            <div>
                                                <Label htmlFor={`email_${index}`}>{t('register.email')}</Label>
                                                <Input
                                                    id={`email_${index}`}
                                                    type="email"
                                                    value={attendee.email}
                                                    onChange={e => updateAttendee(index, 'email', e.target.value)}
                                                    className="mt-1"
                                                    placeholder={t('register.email_placeholder')}
                                                />
                                                {(errors as Record<string, string>)[`attendees.${index}.email`] && (
                                                    <p className="text-sm text-red-600 mt-1">{(errors as Record<string, string>)[`attendees.${index}.email`]}</p>
                                                )}
                                            </div>
                                            <div>
                                                <Label htmlFor={`phone_${index}`}>{t('register.phone')} <span className="text-red-500">*</span></Label>
                                                <Input
                                                    id={`phone_${index}`}
                                                    value={attendee.phone}
                                                    onChange={e => updateAttendee(index, 'phone', e.target.value)}
                                                    className="mt-1"
                                                    placeholder={t('register.phone_placeholder')}
                                                    required
                                                />
                                                {(errors as Record<string, string>)[`attendees.${index}.phone`] && (
                                                    <p className="text-sm text-red-600 mt-1">{(errors as Record<string, string>)[`attendees.${index}.phone`]}</p>
                                                )}
                                            </div>
                                            <div>
                                                <Label htmlFor={`company_${index}`}>{t('register.company')} <span className="text-red-500">*</span></Label>
                                                <Input
                                                    id={`company_${index}`}
                                                    value={attendee.company}
                                                    onChange={e => updateAttendee(index, 'company', e.target.value)}
                                                    className="mt-1"
                                                    required
                                                />
                                                {(errors as Record<string, string>)[`attendees.${index}.company`] && (
                                                    <p className="text-sm text-red-600 mt-1">{(errors as Record<string, string>)[`attendees.${index}.company`]}</p>
                                                )}
                                            </div>
                                            <div>
                                                <Label htmlFor={`job_title_${index}`}>{t('register.job_title')}</Label>
                                                <Input
                                                    id={`job_title_${index}`}
                                                    value={attendee.job_title}
                                                    onChange={e => updateAttendee(index, 'job_title', e.target.value)}
                                                    className="mt-1"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor={`dietary_${index}`}>{t('register.dietary')}</Label>
                                                <Input
                                                    id={`dietary_${index}`}
                                                    value={attendee.dietary_requirements}
                                                    onChange={e => updateAttendee(index, 'dietary_requirements', e.target.value)}
                                                    className="mt-1"
                                                    placeholder={t('register.dietary_placeholder')}
                                                />
                                            </div>
                                        </div>
                                        {/* Notes only on the last attendee card */}
                                        {index === data.attendees.length - 1 && (
                                            <div>
                                                <Label htmlFor="notes">{t('register.notes')}</Label>
                                                <Textarea id="notes" value={data.notes} onChange={e => setData('notes', e.target.value)} rows={2} className="mt-1 resize-none" placeholder={t('register.notes_placeholder')} />
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Order Sidebar */}
                        <div className="lg:sticky lg:top-24">
                            <Card>
                                <CardHeader><CardTitle>{t('register.order_summary')}</CardTitle></CardHeader>
                                <CardContent className="space-y-3">
                                    {selectedTicket ? (
                                        <>
                                            <div className="flex justify-between text-sm">
                                                <span>
                                                    {selectedTicket.name} x {data.quantity}
                                                    {selectedTicket.is_early_bird && <span className="text-amber-600 text-xs ml-1">(Early Bird)</span>}
                                                </span>
                                                <span>RM {ticketSubtotal.toFixed(2)}</span>
                                            </div>
                                            {selectedProducts.map(sp => {
                                                const product = products.find(p => p.id === sp.product_id);
                                                if (!product) return null;
                                                return (
                                                    <div key={sp.product_id} className="flex justify-between text-sm">
                                                        <span>
                                                            {product.name}
                                                            {sp.variant && <span className="text-muted-foreground"> ({sp.variant})</span>}
                                                            {' '} x {sp.quantity}
                                                        </span>
                                                        <span>RM {(product.price * sp.quantity).toFixed(2)}</span>
                                                    </div>
                                                );
                                            })}
                                            <div className="border-t pt-3 flex justify-between font-bold">
                                                <span>{t('register.total')}</span>
                                                <span>RM {grandTotal.toFixed(2)}</span>
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">{t('register.select_ticket')}.</p>
                                    )}

                                    <Button
                                        type="submit"
                                        disabled={processing || !data.ticket_id}
                                        className="w-full bg-brand hover:bg-brand-dark mt-4"
                                        size="lg"
                                    >
                                        {processing ? 'Submitting…' : grandTotal > 0 ? `Register — RM ${grandTotal.toFixed(2)}` : 'Register — Free'}
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </form>
            </div>
        </PublicLayout>
    );
}

/**
 * Reusable ticket radio option with early bird pricing support.
 */
function TicketOption({ ticket, selected, onSelect }: {
    ticket: EventTicket;
    selected: boolean;
    onSelect: () => void;
}) {
    const borderStyle = ticket.color
        ? { borderLeftWidth: '4px', borderLeftColor: ticket.color, borderTopWidth: '1px', borderRightWidth: '1px', borderBottomWidth: '1px' }
        : undefined;

    return (
        <label
            className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-all ${
                selected
                    ? 'border-2 border-brand bg-brand/5'
                    : 'border border-gray-200 hover:border-gray-300'
            }`}
            style={!selected ? borderStyle : undefined}
        >
            <div className="flex items-center gap-3">
                <input type="radio" name="ticket_id" value={ticket.id} checked={selected} onChange={onSelect} className="accent-brand" />
                <div>
                    <div className="flex items-center gap-2">
                        <p className="font-semibold">{ticket.name}</p>
                        {ticket.is_early_bird && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                <Clock className="w-3 h-3" /> Early Bird
                            </span>
                        )}
                    </div>
                    {ticket.description && <p className="text-sm text-gray-500">{ticket.description}</p>}
                    {ticket.available_count !== null && <p className="text-xs text-amber-600 mt-1">{ticket.available_count} spots left</p>}
                    {ticket.is_early_bird && ticket.early_bird_end_at && (
                        <p className="text-xs text-amber-700 mt-1">
                            Ends {new Date(ticket.early_bird_end_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                    )}
                </div>
            </div>
            <div className="text-right flex-shrink-0 ml-4">
                {ticket.type === 'free' ? (
                    <p className="font-bold text-lg text-emerald-600">Free</p>
                ) : ticket.is_early_bird ? (
                    <>
                        <p className="font-bold text-lg text-emerald-600">RM {Number(ticket.current_price).toFixed(2)}</p>
                        <p className="text-xs text-gray-400 line-through">RM {Number(ticket.price).toFixed(2)}</p>
                    </>
                ) : (
                    <p className="font-bold text-lg text-gray-900">RM {Number(ticket.current_price).toFixed(2)}</p>
                )}
            </div>
        </label>
    );
}
