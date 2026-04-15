import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Switch } from '@/Components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/Components/ui/dropdown-menu';
import { Separator } from '@/Components/ui/separator';
import { Link, router, useForm } from '@inertiajs/react';
import { useState, useRef } from 'react';
import { ChevronLeft, Plus, Pencil, Trash2, Ticket, MoreHorizontal, Zap, Tag, MapPin, Eye, Image as ImageIcon, X } from 'lucide-react';
import { type Event, type EventTicket, type EventZone, type Media } from '@/types';

interface Props {
    event: Event;
    tickets: EventTicket[];
    zones: EventZone[];
    venueMapMedia: Media | null;
}

const emptyTicket = {
    name: '',
    color: '',
    description: '',
    type: 'free' as 'free' | 'paid',
    price: '0',
    early_bird_price: '',
    early_bird_end_at: '',
    currency: 'MYR',
    quantity: '',
    max_per_order: '5',
    sale_start_at: '',
    sale_end_at: '',
    is_active: true,
    sort_order: '0',
    event_zone_id: '',
};

export default function EventTickets({ event, tickets, zones, venueMapMedia }: Props) {
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<EventTicket | null>(null);
    const [showMapPreview, setShowMapPreview] = useState(false);
    const [venueMapId, setVenueMapId] = useState<string>(
        venueMapMedia ? String(venueMapMedia.id) : 'none'
    );
    const [savingMap, setSavingMap] = useState(false);
    const venueMapFileRef = useRef<HTMLInputElement>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm(emptyTicket);

    function openCreate() {
        reset();
        setEditingId(null);
        setShowForm(true);
    }

    function openEdit(ticket: EventTicket) {
        setEditingId(ticket.id);
        setData({
            name: ticket.name,
            color: ticket.color ?? '',
            description: ticket.description ?? '',
            type: ticket.type,
            price: String(ticket.price),
            early_bird_price: ticket.early_bird_price !== null ? String(ticket.early_bird_price) : '',
            early_bird_end_at: ticket.early_bird_end_at ? ticket.early_bird_end_at.slice(0, 16) : '',
            currency: ticket.currency,
            quantity: ticket.quantity !== null ? String(ticket.quantity) : '',
            max_per_order: String(ticket.max_per_order),
            sale_start_at: ticket.sale_start_at ? ticket.sale_start_at.slice(0, 16) : '',
            sale_end_at: ticket.sale_end_at ? ticket.sale_end_at.slice(0, 16) : '',
            is_active: ticket.is_active,
            sort_order: String(ticket.sort_order),
            event_zone_id: ticket.event_zone_id ? String(ticket.event_zone_id) : '',
        });
        setShowForm(true);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (editingId) {
            put(`/admin/events/${event.slug}/tickets/${editingId}`, {
                onSuccess: () => { setShowForm(false); reset(); },
            });
        } else {
            post(`/admin/events/${event.slug}/tickets`, {
                onSuccess: () => { setShowForm(false); reset(); },
            });
        }
    }

    function confirmDelete() {
        if (!deleteTarget) return;
        router.delete(`/admin/events/${event.slug}/tickets/${deleteTarget.id}`, {
            onFinish: () => setDeleteTarget(null),
        });
    }

    return (
        <AdminLayout>
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/admin/events" className="text-muted-foreground hover:text-foreground transition-colors">
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">Tickets</h1>
                            <p className="text-sm text-muted-foreground">{event.title}</p>
                        </div>
                    </div>
                    <Button onClick={openCreate}>
                        <Plus className="w-4 h-4 mr-1.5" /> Add Ticket
                    </Button>
                </div>

                {/* Venue / Seating Map */}
                <div className="rounded-xl border border-border/60 bg-card shadow-sm px-5 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-primary" />
                            <h3 className="text-sm font-semibold text-foreground">Venue / Seating Map</h3>
                            {venueMapMedia && (
                                <span className="text-xs text-muted-foreground">— {venueMapMedia.title || 'Uploaded'}</span>
                            )}
                            {savingMap && <span className="text-xs text-muted-foreground italic">Saving…</span>}
                        </div>
                        <div className="flex items-center gap-2">
                            {venueMapMedia && (
                                <>
                                    <Button variant="outline" size="sm" onClick={() => setShowMapPreview(true)}>
                                        <Eye className="w-3.5 h-3.5 mr-1.5" /> View Zone
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => {
                                            setVenueMapId('none');
                                            setSavingMap(true);
                                            router.post(`/admin/events/${event.slug}/tickets/venue-map`, {
                                                venue_map_media_id: null,
                                            }, { onFinish: () => setSavingMap(false) });
                                        }}
                                    >
                                        <X className="w-3.5 h-3.5 mr-1" /> Remove
                                    </Button>
                                </>
                            )}
                            <Button
                                variant={venueMapMedia ? 'ghost' : 'outline'}
                                size="sm"
                                onClick={() => venueMapFileRef.current?.click()}
                            >
                                <ImageIcon className="w-3.5 h-3.5 mr-1.5" />
                                {venueMapMedia ? 'Change' : 'Upload Image'}
                            </Button>
                            <input
                                ref={venueMapFileRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    setSavingMap(true);
                                    try {
                                        const form = new FormData();
                                        form.append('file', file);
                                        const { data } = await (await import('axios')).default.post<{ media: { id: number; url: string; title: string } }>(
                                            '/admin/media', form,
                                            { headers: { 'Content-Type': 'multipart/form-data' } },
                                        );
                                        const newId = String(data.media.id);
                                        setVenueMapId(newId);
                                        router.post(`/admin/events/${event.slug}/tickets/venue-map`, {
                                            venue_map_media_id: newId,
                                        }, { onFinish: () => setSavingMap(false) });
                                    } catch {
                                        setSavingMap(false);
                                    }
                                    if (venueMapFileRef.current) venueMapFileRef.current.value = '';
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Summary stats */}
                {tickets.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div className="rounded-xl border border-border/60 p-3.5">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Total Tickets</p>
                            <p className="text-2xl font-bold tabular-nums text-foreground">{tickets.length}</p>
                        </div>
                        <div className="rounded-xl border border-border/60 p-3.5 bg-emerald-500/5">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">On Sale</p>
                            <p className="text-2xl font-bold tabular-nums text-foreground">{tickets.filter(t => t.is_on_sale).length}</p>
                        </div>
                        <div className="rounded-xl border border-border/60 p-3.5 bg-primary/5">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary mb-1">Total Sold</p>
                            <p className="text-2xl font-bold tabular-nums text-foreground">{tickets.reduce((sum, t) => sum + t.sold_count, 0)}</p>
                        </div>
                        <div className="rounded-xl border border-border/60 p-3.5 bg-amber-500/5">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">Total Capacity</p>
                            <p className="text-2xl font-bold tabular-nums text-foreground">
                                {tickets.every(t => t.quantity !== null)
                                    ? tickets.reduce((sum, t) => sum + (t.quantity ?? 0), 0)
                                    : '∞'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Tickets table */}
                <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b border-border/60 bg-muted/40 hover:bg-muted/40">
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Zone</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Price</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sold / Capacity</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tickets.map(ticket => (
                                <TableRow key={ticket.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2.5">
                                            {ticket.color && (
                                                <div className="w-3.5 h-3.5 rounded-full flex-shrink-0 ring-1 ring-border/60" style={{ backgroundColor: ticket.color }} />
                                            )}
                                            <span className="text-foreground">{ticket.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {ticket.zone ? (
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-3 h-3 rounded-full ring-1 ring-border/40" style={{ backgroundColor: ticket.zone.color }} />
                                                <span className="text-sm text-foreground">{ticket.zone.name}</span>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground/50">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize ${
                                            ticket.type === 'paid'
                                                ? 'bg-primary/15 text-primary border-primary/30'
                                                : 'bg-muted text-muted-foreground border-muted-foreground/20'
                                        }`}>
                                            {ticket.type}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {ticket.type === 'paid' ? (
                                            <div className="flex items-center gap-1.5">
                                                {ticket.is_early_bird ? (
                                                    <>
                                                        <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                                                            {ticket.currency} {Number(ticket.early_bird_price).toFixed(2)}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground/60 line-through tabular-nums">
                                                            {Number(ticket.price).toFixed(2)}
                                                        </span>
                                                        <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                                                            <Zap className="w-2.5 h-2.5 mr-0.5" /> Early Bird
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="font-medium tabular-nums text-foreground">
                                                        {ticket.currency} {Number(ticket.price).toFixed(2)}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground">Free</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold tabular-nums text-foreground">{ticket.sold_count}</span>
                                            <span className="text-muted-foreground/50">/</span>
                                            <span className="tabular-nums text-muted-foreground">{ticket.quantity ?? '∞'}</span>
                                            {ticket.quantity !== null && ticket.sold_count > 0 && (
                                                <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full bg-primary transition-all"
                                                        style={{ width: `${Math.min(100, (ticket.sold_count / ticket.quantity) * 100)}%` }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {ticket.is_on_sale ? (
                                            <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                                On Sale
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                                                Off Sale
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="w-12">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-36">
                                                <DropdownMenuItem onClick={() => openEdit(ticket)}>
                                                    <Pencil className="mr-2 h-4 w-4" /> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => setDeleteTarget(ticket)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {tickets.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                                        <Ticket className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                        <p className="text-sm">No tickets yet. Create your first ticket to start accepting registrations.</p>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Create / Edit Dialog */}
            <Dialog open={showForm} onOpenChange={open => !open && setShowForm(false)}>
                <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>{editingId ? 'Edit Ticket' : 'New Ticket'}</DialogTitle>
                        <DialogDescription>
                            {editingId ? 'Update ticket details.' : 'Add a new ticket type for this event.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-1 pr-1">
                        <div>
                            <Label htmlFor="name">Ticket Name *</Label>
                            <Input id="name" value={data.name} onChange={e => setData('name', e.target.value)} placeholder="e.g. Early Bird, VIP, Standard" className="mt-1" />
                            {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
                        </div>

                        <div>
                            <Label htmlFor="color">Seat Color</Label>
                            <div className="flex items-center gap-3 mt-1">
                                <input
                                    id="color"
                                    type="color"
                                    value={data.color || '#3b82f6'}
                                    onChange={e => setData('color', e.target.value)}
                                    className="w-10 h-10 rounded-lg border border-border cursor-pointer p-0.5"
                                />
                                <Input
                                    value={data.color}
                                    onChange={e => setData('color', e.target.value)}
                                    placeholder="#3b82f6"
                                    className="w-28 font-mono text-sm"
                                    maxLength={7}
                                />
                                {data.color && (
                                    <button type="button" onClick={() => setData('color', '')} className="text-xs text-muted-foreground hover:text-foreground">
                                        Clear
                                    </button>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Assign a color to match the seating layout map.</p>
                        </div>

                        <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" value={data.description} onChange={e => setData('description', e.target.value)} rows={2} className="mt-1" />
                        </div>

                        {zones.length > 0 && (
                            <div>
                                <Label>Zone</Label>
                                <Select value={data.event_zone_id} onValueChange={v => setData('event_zone_id', v)}>
                                    <SelectTrigger className="mt-1"><SelectValue placeholder="No zone" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">No zone</SelectItem>
                                        {zones.map(zone => (
                                            <SelectItem key={zone.id} value={String(zone.id)}>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: zone.color }} />
                                                    {zone.name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Type</Label>
                                <Select value={data.type} onValueChange={v => setData('type', v as 'free' | 'paid')}>
                                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="free">Free</SelectItem>
                                        <SelectItem value="paid">Paid</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {data.type === 'paid' && (
                                <div>
                                    <Label htmlFor="price">Price ({data.currency})</Label>
                                    <Input id="price" type="number" step="0.01" min="0" value={data.price} onChange={e => setData('price', e.target.value)} className="mt-1" />
                                    {errors.price && <p className="text-sm text-red-600 mt-1">{errors.price}</p>}
                                </div>
                            )}
                        </div>

                        {/* Early Bird Pricing */}
                        {data.type === 'paid' && (
                            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
                                <div className="flex items-center gap-2">
                                    <Zap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                    <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">Early Bird Pricing</span>
                                    <span className="text-xs text-muted-foreground">(optional)</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="early_bird_price">Early Bird Price ({data.currency})</Label>
                                        <Input
                                            id="early_bird_price"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={data.early_bird_price}
                                            onChange={e => setData('early_bird_price', e.target.value)}
                                            className="mt-1 bg-background"
                                            placeholder="Leave blank for none"
                                        />
                                        {errors.early_bird_price && <p className="text-sm text-red-600 mt-1">{errors.early_bird_price}</p>}
                                    </div>
                                    <div>
                                        <Label htmlFor="early_bird_end_at">Early Bird Ends</Label>
                                        <Input
                                            id="early_bird_end_at"
                                            type="datetime-local"
                                            value={data.early_bird_end_at}
                                            onChange={e => setData('early_bird_end_at', e.target.value)}
                                            className="mt-1 bg-background"
                                        />
                                        {errors.early_bird_end_at && <p className="text-sm text-red-600 mt-1">{errors.early_bird_end_at}</p>}
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground">Set a discounted price that applies until the early bird end date. After that, the regular price is charged.</p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="quantity">Capacity <span className="text-xs text-muted-foreground">(blank = unlimited)</span></Label>
                                <Input id="quantity" type="number" min="1" value={data.quantity} onChange={e => setData('quantity', e.target.value)} className="mt-1" placeholder="Unlimited" />
                            </div>
                            <div>
                                <Label htmlFor="max_per_order">Max per Order</Label>
                                <Input id="max_per_order" type="number" min="1" value={data.max_per_order} onChange={e => setData('max_per_order', e.target.value)} className="mt-1" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="sale_start_at">Sale Starts</Label>
                                <Input id="sale_start_at" type="datetime-local" value={data.sale_start_at} onChange={e => setData('sale_start_at', e.target.value)} className="mt-1" />
                            </div>
                            <div>
                                <Label htmlFor="sale_end_at">Sale Ends</Label>
                                <Input id="sale_end_at" type="datetime-local" value={data.sale_end_at} onChange={e => setData('sale_end_at', e.target.value)} className="mt-1" />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <Label htmlFor="is_active" className="cursor-pointer">Active</Label>
                            <Switch id="is_active" checked={data.is_active} onCheckedChange={checked => setData('is_active', checked)} />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Saving…' : editingId ? 'Update Ticket' : 'Create Ticket'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete confirmation */}
            <Dialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Ticket</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{deleteTarget?.name}"? This cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Venue Map Preview Modal */}
            <Dialog open={showMapPreview} onOpenChange={setShowMapPreview}>
                <DialogContent className="max-w-3xl p-0 overflow-hidden">
                    <DialogHeader className="px-6 pt-6 pb-0">
                        <DialogTitle className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-primary" /> Venue / Seating Map
                        </DialogTitle>
                        <DialogDescription>{event.title}</DialogDescription>
                    </DialogHeader>
                    {venueMapMedia && (
                        <div className="px-6 pb-6">
                            <img
                                src={venueMapMedia.url}
                                alt="Venue / Seating Map"
                                className="w-full rounded-lg border border-border/60"
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
