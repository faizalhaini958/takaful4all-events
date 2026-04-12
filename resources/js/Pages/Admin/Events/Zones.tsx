import AdminLayout from '@/Layouts/AdminLayout';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { ChevronLeft, Plus, Pencil, Trash2, Palette, X, Image } from 'lucide-react';
import { type Event, type EventZone } from '@/types';

interface Props {
    event: Event;
    zones: (EventZone & { tickets_count: number })[];
}

const emptyZone = {
    name: '',
    description: '',
    color: '#6366f1',
    label_color: '#ffffff',
    perks: [] as string[],
    image: null as File | null,
    remove_image: false,
    capacity: '',
    sort_order: '0',
};

export default function EventZones({ event, zones }: Props) {
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<EventZone | null>(null);
    const [newPerk, setNewPerk] = useState('');
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm(emptyZone);

    function openCreate() {
        reset();
        setEditingId(null);
        setNewPerk('');
        setPreviewImage(null);
        setShowForm(true);
    }

    function openEdit(zone: EventZone) {
        setEditingId(zone.id);
        setData({
            name: zone.name,
            description: zone.description ?? '',
            color: zone.color,
            label_color: zone.label_color || '#ffffff',
            perks: zone.perks ?? [],
            image: null,
            remove_image: false,
            capacity: zone.capacity !== null ? String(zone.capacity) : '',
            sort_order: String(zone.sort_order),
        });
        setNewPerk('');
        setPreviewImage(zone.image_url || null);
        setShowForm(true);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const options = {
            onSuccess: () => { setShowForm(false); reset(); setPreviewImage(null); },
            forceFormData: true,
        };
        if (editingId) {
            router.post(`/admin/events/${event.slug}/zones/${editingId}`, {
                ...data,
                _method: 'PUT',
                perks: JSON.stringify(data.perks),
            }, options);
        } else {
            router.post(`/admin/events/${event.slug}/zones`, {
                ...data,
                perks: JSON.stringify(data.perks),
            }, options);
        }
    }

    function addPerk() {
        const trimmed = newPerk.trim();
        if (!trimmed) return;
        setData('perks', [...data.perks, trimmed]);
        setNewPerk('');
    }

    function removePerk(index: number) {
        setData('perks', data.perks.filter((_, i) => i !== index));
    }

    function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) {
            setData('image', file);
            setData('remove_image', false);
            setPreviewImage(URL.createObjectURL(file));
        }
    }

    function removeImage() {
        setData('image', null);
        setData('remove_image', true);
        setPreviewImage(null);
    }

    function confirmDelete() {
        if (!deleteTarget) return;
        router.delete(`/admin/events/${event.slug}/zones/${deleteTarget.id}`, {
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
                            <h1 className="text-2xl font-bold text-foreground">Zones</h1>
                            <p className="text-sm text-muted-foreground">{event.title}</p>
                        </div>
                    </div>
                    <Button onClick={openCreate} size="sm">
                        <Plus className="w-4 h-4 mr-1" /> Add Zone
                    </Button>
                </div>

                {/* Table */}
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">Colour</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Perks</TableHead>
                                    <TableHead className="text-center">Capacity</TableHead>
                                    <TableHead className="text-center">Tickets</TableHead>
                                    <TableHead className="text-center">Order</TableHead>
                                    <TableHead className="w-24">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {zones.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                                            <Palette className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                            No zones yet. Create your first zone to organise seating or pricing tiers.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {zones.map(zone => (
                                    <TableRow key={zone.id}>
                                        <TableCell>
                                            <div
                                                className="w-6 h-6 rounded-full border flex items-center justify-center text-[8px] font-bold"
                                                style={{ backgroundColor: zone.color, color: zone.label_color }}
                                            >
                                                {zone.name.charAt(0)}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <span className="font-medium">{zone.name}</span>
                                                {zone.image_url && <Image className="w-3 h-3 inline ml-1.5 text-muted-foreground" />}
                                            </div>
                                            {zone.description && <p className="text-muted-foreground text-xs truncate max-w-[200px]">{zone.description}</p>}
                                        </TableCell>
                                        <TableCell>
                                            {zone.perks && zone.perks.length > 0 ? (
                                                <Badge variant="secondary">{zone.perks.length} perks</Badge>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {zone.capacity !== null ? zone.capacity : <span className="text-muted-foreground">∞</span>}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="secondary">{zone.tickets_count}</Badge>
                                        </TableCell>
                                        <TableCell className="text-center">{zone.sort_order}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => openEdit(zone)}>
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(zone)}>
                                                    <Trash2 className="w-4 h-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Create/Edit Dialog */}
                <Dialog open={showForm} onOpenChange={setShowForm}>
                    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                        <form onSubmit={handleSubmit}>
                            <DialogHeader>
                                <DialogTitle>{editingId ? 'Edit Zone' : 'New Zone'}</DialogTitle>
                                <DialogDescription>
                                    {editingId ? 'Update the zone details.' : 'Define a new zone for this event.'}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div>
                                    <Label htmlFor="zone_name">Name *</Label>
                                    <Input
                                        id="zone_name"
                                        value={data.name}
                                        onChange={e => setData('name', e.target.value)}
                                        className="mt-1"
                                        placeholder="e.g. Platinum, Premium, Standard"
                                    />
                                    {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="zone_description">Description</Label>
                                    <Textarea
                                        id="zone_description"
                                        value={data.description}
                                        onChange={e => setData('description', e.target.value)}
                                        className="mt-1 resize-none"
                                        rows={2}
                                        placeholder="Optional description"
                                    />
                                    {errors.description && <p className="text-sm text-destructive mt-1">{errors.description}</p>}
                                </div>

                                {/* Colors */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="zone_color">Zone Colour *</Label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <input
                                                type="color"
                                                id="zone_color"
                                                value={data.color}
                                                onChange={e => setData('color', e.target.value)}
                                                className="w-10 h-10 rounded cursor-pointer border"
                                            />
                                            <Input
                                                value={data.color}
                                                onChange={e => setData('color', e.target.value)}
                                                className="flex-1 font-mono text-sm"
                                                maxLength={7}
                                            />
                                        </div>
                                        {errors.color && <p className="text-sm text-destructive mt-1">{errors.color}</p>}
                                    </div>
                                    <div>
                                        <Label htmlFor="zone_label_color">Label Colour</Label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <input
                                                type="color"
                                                id="zone_label_color"
                                                value={data.label_color}
                                                onChange={e => setData('label_color', e.target.value)}
                                                className="w-10 h-10 rounded cursor-pointer border"
                                            />
                                            <Input
                                                value={data.label_color}
                                                onChange={e => setData('label_color', e.target.value)}
                                                className="flex-1 font-mono text-sm"
                                                maxLength={7}
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">Text colour on the badge</p>
                                    </div>
                                </div>

                                {/* Preview badge */}
                                <div>
                                    <Label>Preview</Label>
                                    <div className="mt-1">
                                        <span
                                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold"
                                            style={{ backgroundColor: data.color, color: data.label_color }}
                                        >
                                            {data.name || 'Zone Name'}
                                        </span>
                                    </div>
                                </div>

                                {/* Perks */}
                                <div>
                                    <Label>Perks / Inclusions</Label>
                                    <p className="text-xs text-muted-foreground mb-2">Add features shown on the public ticket page</p>
                                    <div className="space-y-1.5 mb-2">
                                        {data.perks.map((perk, i) => (
                                            <div key={i} className="flex items-center gap-2 bg-muted rounded-md px-3 py-1.5 text-sm">
                                                <span className="flex-1">{perk}</span>
                                                <button type="button" onClick={() => removePerk(i)} className="text-muted-foreground hover:text-destructive">
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <Input
                                            value={newPerk}
                                            onChange={e => setNewPerk(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPerk(); } }}
                                            placeholder="e.g. VIP access, 3-course lunch"
                                            className="flex-1"
                                        />
                                        <Button type="button" variant="outline" size="sm" onClick={addPerk}>
                                            <Plus className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    {errors.perks && <p className="text-sm text-destructive mt-1">{errors.perks}</p>}
                                </div>

                                {/* Zone image */}
                                <div>
                                    <Label>Zone Image</Label>
                                    <p className="text-xs text-muted-foreground mb-2">Optional photo of this section/area</p>
                                    {previewImage && (
                                        <div className="relative mb-2 w-full max-w-[200px]">
                                            <img src={previewImage} alt="Zone preview" className="w-full h-auto rounded-md border" />
                                            <button
                                                type="button"
                                                onClick={removeImage}
                                                className="absolute -top-2 -right-2 bg-destructive text-white rounded-full w-5 h-5 flex items-center justify-center"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    )}
                                    {!previewImage && (
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="mt-1"
                                        />
                                    )}
                                    {errors.image && <p className="text-sm text-destructive mt-1">{errors.image}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="zone_capacity">Capacity</Label>
                                        <Input
                                            id="zone_capacity"
                                            type="number"
                                            value={data.capacity}
                                            onChange={e => setData('capacity', e.target.value)}
                                            className="mt-1"
                                            min="1"
                                            placeholder="Unlimited"
                                        />
                                        {errors.capacity && <p className="text-sm text-destructive mt-1">{errors.capacity}</p>}
                                    </div>
                                    <div>
                                        <Label htmlFor="zone_order">Sort Order</Label>
                                        <Input
                                            id="zone_order"
                                            type="number"
                                            value={data.sort_order}
                                            onChange={e => setData('sort_order', e.target.value)}
                                            className="mt-1"
                                            min="0"
                                        />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Saving…' : editingId ? 'Update Zone' : 'Create Zone'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation */}
                <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete Zone</DialogTitle>
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
            </div>
        </AdminLayout>
    );
}
