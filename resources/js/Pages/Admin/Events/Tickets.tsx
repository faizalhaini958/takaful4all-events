import AdminLayout from '@/Layouts/AdminLayout';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Switch } from '@/Components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { ChevronLeft, Plus, Pencil, Trash2, Ticket } from 'lucide-react';
import { type Event, type EventTicket, type EventZone } from '@/types';

interface Props {
    event: Event;
    tickets: EventTicket[];
    zones: EventZone[];
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

export default function EventTickets({ event, tickets, zones }: Props) {
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<EventTicket | null>(null);

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
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href={`/admin/events/${event.slug}/edit`} className="text-muted-foreground hover:text-foreground transition-colors">
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">Tickets</h1>
                            <p className="text-sm text-muted-foreground">{event.title}</p>
                        </div>
                    </div>
                    <Button onClick={openCreate} className="bg-brand hover:bg-brand-dark">
                        <Plus className="w-4 h-4 mr-1" /> Add Ticket
                    </Button>
                </div>

                {/* Tickets table */}
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Zone</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Sold / Capacity</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tickets.map(ticket => (
                                    <TableRow key={ticket.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                {ticket.color && (
                                                    <div className="w-4 h-4 rounded-full flex-shrink-0 border border-gray-200" style={{ backgroundColor: ticket.color }} />
                                                )}
                                                {ticket.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {ticket.zone ? (
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ticket.zone.color }} />
                                                    <span className="text-sm">{ticket.zone.name}</span>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={ticket.type === 'paid' ? 'default' : 'secondary'}>
                                                {ticket.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {ticket.type === 'paid' ? (
                                                <div>
                                                    {ticket.is_early_bird ? (
                                                        <>
                                                            <span className="font-medium text-emerald-600">{ticket.currency} {Number(ticket.early_bird_price).toFixed(2)}</span>
                                                            <span className="text-xs text-muted-foreground line-through ml-1">{Number(ticket.price).toFixed(2)}</span>
                                                            <Badge variant="secondary" className="ml-1.5 text-[10px] bg-amber-100 text-amber-800">Early Bird</Badge>
                                                        </>
                                                    ) : (
                                                        <span>{ticket.currency} {Number(ticket.price).toFixed(2)}</span>
                                                    )}
                                                </div>
                                            ) : 'Free'}
                                        </TableCell>
                                        <TableCell>
                                            {ticket.sold_count} / {ticket.quantity ?? '∞'}
                                        </TableCell>
                                        <TableCell>
                                            {ticket.is_on_sale ? (
                                                <Badge variant="default" className="bg-emerald-600">On Sale</Badge>
                                            ) : (
                                                <Badge variant="outline">Off Sale</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <button onClick={() => openEdit(ticket)} className="text-sm text-brand-navy hover:underline">
                                                <Pencil className="w-4 h-4 inline" />
                                            </button>
                                            <button onClick={() => setDeleteTarget(ticket)} className="text-sm text-red-600 hover:underline">
                                                <Trash2 className="w-4 h-4 inline" />
                                            </button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {tickets.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                                            <Ticket className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                            No tickets yet. Create your first ticket to start accepting registrations.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
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
                                    className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5"
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
                            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-amber-800">Early Bird Pricing</span>
                                    <span className="text-xs text-amber-600">(optional)</span>
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
                                            className="mt-1 bg-white"
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
                                            className="mt-1 bg-white"
                                        />
                                        {errors.early_bird_end_at && <p className="text-sm text-red-600 mt-1">{errors.early_bird_end_at}</p>}
                                    </div>
                                </div>
                                <p className="text-xs text-amber-700">Set a discounted price that applies until the early bird end date. After that, the regular price is charged.</p>
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
                            <Button type="submit" disabled={processing} className="bg-brand hover:bg-brand-dark">
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
        </AdminLayout>
    );
}
