import PublicLayout from '@/Layouts/PublicLayout';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Link, useForm, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Calendar, MapPin, ChevronLeft, Ticket, ShoppingBag, Plus, Minus, AlertCircle, User } from 'lucide-react';
import { type Event, type EventTicket, type EventProduct } from '@/types';

interface Props {
    event: Event;
    tickets: EventTicket[];
    products: EventProduct[];
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

export default function EventRegister({ event, tickets, products }: Props) {
    const { flash } = usePage().props as { flash: { success?: string; error?: string } };
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
    const ticketSubtotal = selectedTicket ? selectedTicket.price * qty : 0;
    const productsTotal = selectedProducts.reduce((sum, p) => {
        const product = products.find(pr => pr.id === p.product_id);
        return sum + (product ? product.price * p.quantity : 0);
    }, 0);
    const grandTotal = ticketSubtotal + productsTotal;

    const startDate = new Date(event.start_at);
    const location = [event.venue, event.city, event.state].filter(Boolean).join(', ');

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
            <section className="relative bg-brand-navy text-white overflow-hidden">
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    <Link href={`/events/${event.slug}`} className="inline-flex items-center gap-1 text-sm text-white/70 hover:text-white mb-3">
                        <ChevronLeft className="w-4 h-4" /> Back to event
                    </Link>
                    <h1 className="text-2xl sm:text-3xl font-extrabold">{event.title}</h1>
                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-white/80">
                        <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {startDate.toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        {location && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {location}</span>}
                    </div>
                </div>
            </section>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
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
                            {/* Ticket Selection */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Ticket className="w-5 h-5 text-brand" /> Select Ticket
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {tickets.filter(t => t.is_on_sale).map(ticket => (
                                        <label
                                            key={ticket.id}
                                            className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                                data.ticket_id === String(ticket.id)
                                                    ? 'border-brand bg-brand/5'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="radio"
                                                    name="ticket_id"
                                                    value={ticket.id}
                                                    checked={data.ticket_id === String(ticket.id)}
                                                    onChange={() => setData('ticket_id', String(ticket.id))}
                                                    className="accent-brand"
                                                />
                                                <div>
                                                    <p className="font-semibold">{ticket.name}</p>
                                                    {ticket.description && <p className="text-sm text-gray-500">{ticket.description}</p>}
                                                    {ticket.available_count !== null && (
                                                        <p className="text-xs text-amber-600 mt-1">{ticket.available_count} spots left</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-lg">
                                                    {ticket.type === 'free' ? 'Free' : `RM ${Number(ticket.price).toFixed(2)}`}
                                                </p>
                                            </div>
                                        </label>
                                    ))}
                                    {tickets.filter(t => t.is_on_sale).length === 0 && (
                                        <p className="text-center py-6 text-gray-500">No tickets available at this time.</p>
                                    )}
                                    {errors.ticket_id && <p className="text-sm text-red-600">{errors.ticket_id}</p>}

                                    {selectedTicket && (
                                        <div className="flex items-center gap-3 pt-2">
                                            <Label htmlFor="quantity">Number of attendees</Label>
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
                                            <span className="text-xs text-muted-foreground">max {selectedTicket.max_per_order}</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Products / Add-ons — right after ticket selection */}
                            {products.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <ShoppingBag className="w-5 h-5 text-brand" /> Add-on Products
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
                                                                    {isSelected ? 'Added' : 'Add to order'}
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
                                                                                onClick={() => updateProductSelection(product.id, 'quantity', (selection?.quantity ?? 1) + 1)}
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
                                            {qty === 1 ? 'Your Details' : `Attendee ${index + 1} Details`}
                                            {qty > 1 && index === 0 && (
                                                <span className="text-xs font-normal text-muted-foreground ml-1">(Primary buyer)</span>
                                            )}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor={`name_${index}`}>Full Name *</Label>
                                                <Input
                                                    id={`name_${index}`}
                                                    value={attendee.name}
                                                    onChange={e => updateAttendee(index, 'name', e.target.value)}
                                                    className="mt-1"
                                                    placeholder="Full name"
                                                />
                                                {(errors as Record<string, string>)[`attendees.${index}.name`] && (
                                                    <p className="text-sm text-red-600 mt-1">{(errors as Record<string, string>)[`attendees.${index}.name`]}</p>
                                                )}
                                            </div>
                                            <div>
                                                <Label htmlFor={`email_${index}`}>Email *</Label>
                                                <Input
                                                    id={`email_${index}`}
                                                    type="email"
                                                    value={attendee.email}
                                                    onChange={e => updateAttendee(index, 'email', e.target.value)}
                                                    className="mt-1"
                                                    placeholder="you@example.com"
                                                />
                                                {(errors as Record<string, string>)[`attendees.${index}.email`] && (
                                                    <p className="text-sm text-red-600 mt-1">{(errors as Record<string, string>)[`attendees.${index}.email`]}</p>
                                                )}
                                            </div>
                                            <div>
                                                <Label htmlFor={`phone_${index}`}>Phone</Label>
                                                <Input
                                                    id={`phone_${index}`}
                                                    value={attendee.phone}
                                                    onChange={e => updateAttendee(index, 'phone', e.target.value)}
                                                    className="mt-1"
                                                    placeholder="+60 12-345 6789"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor={`company_${index}`}>Company / Organisation</Label>
                                                <Input
                                                    id={`company_${index}`}
                                                    value={attendee.company}
                                                    onChange={e => updateAttendee(index, 'company', e.target.value)}
                                                    className="mt-1"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor={`job_title_${index}`}>Job Title</Label>
                                                <Input
                                                    id={`job_title_${index}`}
                                                    value={attendee.job_title}
                                                    onChange={e => updateAttendee(index, 'job_title', e.target.value)}
                                                    className="mt-1"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor={`dietary_${index}`}>Dietary Requirements</Label>
                                                <Input
                                                    id={`dietary_${index}`}
                                                    value={attendee.dietary_requirements}
                                                    onChange={e => updateAttendee(index, 'dietary_requirements', e.target.value)}
                                                    className="mt-1"
                                                    placeholder="e.g. Halal, Vegetarian"
                                                />
                                            </div>
                                        </div>
                                        {/* Notes only on the last attendee card */}
                                        {index === data.attendees.length - 1 && (
                                            <div>
                                                <Label htmlFor="notes">Additional Notes</Label>
                                                <Textarea id="notes" value={data.notes} onChange={e => setData('notes', e.target.value)} rows={2} className="mt-1 resize-none" placeholder="Any special requirements…" />
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Order Sidebar */}
                        <div className="lg:sticky lg:top-6">
                            <Card>
                                <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
                                <CardContent className="space-y-3">
                                    {selectedTicket ? (
                                        <>
                                            <div className="flex justify-between text-sm">
                                                <span>{selectedTicket.name} x {data.quantity}</span>
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
                                                <span>Total</span>
                                                <span>RM {grandTotal.toFixed(2)}</span>
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">Select a ticket to see your order summary.</p>
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
