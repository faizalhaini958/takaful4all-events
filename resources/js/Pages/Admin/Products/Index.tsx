import AdminLayout from '@/Layouts/AdminLayout';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Switch } from '@/Components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import ImageUpload from '@/Components/ImageUpload';
import { router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Plus, Pencil, Trash2, ShoppingBag, CalendarDays } from 'lucide-react';
import { type Event, type EventProduct, type Media } from '@/types';

interface Props {
    events: Pick<Event, 'id' | 'title' | 'slug'>[];
    currentEvent: string;
    event: Event | null;
    products: EventProduct[];
    mediaList: Pick<Media, 'id' | 'url' | 'title'>[];
}

const emptyProduct = {
    name: '',
    description: '',
    price: '0',
    currency: 'MYR',
    variants_json: '[]',
    stock: '',
    media_id: '',
    is_active: true,
    sort_order: '0',
};

interface VariantGroup {
    label: string;
    options: string;
}

export default function ProductsIndex({ events, currentEvent, event, products }: Props) {
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<EventProduct | null>(null);
    const [variants, setVariants] = useState<VariantGroup[]>([]);
    const [currentMedia, setCurrentMedia] = useState<Media | null>(null);
    const [previewImage, setPreviewImage] = useState<{ url: string; alt: string } | null>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm(emptyProduct);

    function selectEvent(slug: string) {
        if (slug === 'none') {
            router.get('/admin/products', {}, { preserveState: false });
        } else {
            router.get('/admin/products', { event: slug }, { preserveState: false });
        }
    }

    function openCreate() {
        reset();
        setEditingId(null);
        setVariants([]);
        setCurrentMedia(null);
        setShowForm(true);
    }

    function openEdit(product: EventProduct) {
        setEditingId(product.id);
        const existingVariants = product.variants_json?.map(v => ({
            label: v.label,
            options: v.options.join(', '),
        })) ?? [];
        setVariants(existingVariants);
        setCurrentMedia(product.media ?? null);
        setData({
            name: product.name,
            description: product.description ?? '',
            price: String(product.price),
            currency: product.currency,
            variants_json: JSON.stringify(product.variants_json ?? []),
            stock: product.stock !== null ? String(product.stock) : '',
            media_id: product.media_id ? String(product.media_id) : '',
            is_active: product.is_active,
            sort_order: String(product.sort_order),
        });
        setShowForm(true);
    }

    function addVariantGroup() {
        setVariants([...variants, { label: '', options: '' }]);
    }

    function updateVariant(index: number, field: keyof VariantGroup, value: string) {
        const updated = [...variants];
        updated[index][field] = value;
        setVariants(updated);
        const parsed = updated
            .filter(v => v.label.trim())
            .map(v => ({
                label: v.label.trim(),
                options: v.options.split(',').map(o => o.trim()).filter(Boolean),
            }));
        setData('variants_json', JSON.stringify(parsed));
    }

    function removeVariantGroup(index: number) {
        const updated = variants.filter((_, i) => i !== index);
        setVariants(updated);
        const parsed = updated
            .filter(v => v.label.trim())
            .map(v => ({
                label: v.label.trim(),
                options: v.options.split(',').map(o => o.trim()).filter(Boolean),
            }));
        setData('variants_json', JSON.stringify(parsed));
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!event) return;
        const submitData = {
            ...data,
            variants_json: data.variants_json ? JSON.parse(data.variants_json) : null,
        };

        if (editingId) {
            router.put(`/admin/events/${event.slug}/products/${editingId}`, submitData, {
                onSuccess: () => { setShowForm(false); reset(); },
            });
        } else {
            router.post(`/admin/events/${event.slug}/products`, submitData, {
                onSuccess: () => { setShowForm(false); reset(); },
            });
        }
    }

    function confirmDelete() {
        if (!deleteTarget || !event) return;
        router.delete(`/admin/events/${event.slug}/products/${deleteTarget.id}`, {
            onFinish: () => setDeleteTarget(null),
        });
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Manage Products</h1>
                        <p className="text-sm text-muted-foreground mt-1">Create and manage add-on products for your events</p>
                    </div>
                    {event && (
                        <Button onClick={openCreate} className="bg-brand hover:bg-brand-dark">
                            <Plus className="w-4 h-4 mr-1" /> Add Product
                        </Button>
                    )}
                </div>

                {/* Event Selector */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <CalendarDays className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Select Event</Label>
                                <Select value={currentEvent || 'none'} onValueChange={selectEvent}>
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Choose an event to manage products..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">— Select an event —</SelectItem>
                                        {events.map(ev => (
                                            <SelectItem key={ev.id} value={ev.slug}>{ev.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* No event selected */}
                {!event && (
                    <div className="text-center py-16 text-muted-foreground">
                        <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p className="text-lg font-medium">Select an event above</p>
                        <p className="text-sm mt-1">Choose an event to view and manage its products.</p>
                        {events.length === 0 && (
                            <p className="text-sm mt-3 text-yellow-600">No events with RSVP enabled. Enable RSVP on an event first.</p>
                        )}
                    </div>
                )}

                {/* Products table */}
                {event && (
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Variants</TableHead>
                                        <TableHead>Stock</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {products.map(product => (
                                        <TableRow key={product.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    {product.media && (
                                                        <img src={product.media.url} alt={product.name} className="w-10 h-10 rounded object-cover" />
                                                    )}
                                                    <div>
                                                        <div className="font-medium">{product.name}</div>
                                                        {product.description && (
                                                            <div className="text-xs text-muted-foreground truncate max-w-xs">{product.description}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{product.currency} {Number(product.price).toFixed(2)}</TableCell>
                                            <TableCell>
                                                {product.variants_json?.map(v => (
                                                    <div key={v.label} className="text-xs">
                                                        <span className="font-medium">{v.label}:</span> {v.options.join(', ')}
                                                    </div>
                                                )) ?? <span className="text-muted-foreground">—</span>}
                                            </TableCell>
                                            <TableCell>{product.stock ?? '∞'}</TableCell>
                                            <TableCell>
                                                <Badge variant={product.is_active ? 'default' : 'outline'}>
                                                    {product.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <button onClick={() => openEdit(product)} className="text-sm text-brand-navy hover:underline">
                                                    <Pencil className="w-4 h-4 inline" />
                                                </button>
                                                <button onClick={() => setDeleteTarget(product)} className="text-sm text-red-600 hover:underline">
                                                    <Trash2 className="w-4 h-4 inline" />
                                                </button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {products.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                                <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                                No products yet. Add products like t-shirts or merchandise for attendees to purchase.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Create / Edit Dialog */}
            <Dialog open={showForm} onOpenChange={open => !open && setShowForm(false)}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingId ? 'Edit Product' : 'New Product'}</DialogTitle>
                        <DialogDescription>
                            {editingId ? 'Update product details.' : 'Add a product that attendees can purchase with their ticket.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="product_name">Product Name *</Label>
                            <Input id="product_name" value={data.name} onChange={e => setData('name', e.target.value)} placeholder="e.g. Official Event T-Shirt" className="mt-1" />
                            {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
                        </div>

                        <div>
                            <Label htmlFor="product_desc">Description</Label>
                            <Textarea id="product_desc" value={data.description} onChange={e => setData('description', e.target.value)} rows={2} className="mt-1" />
                        </div>

                        <div>
                            <Label>Product Image</Label>
                            <div className="mt-1">
                                <ImageUpload
                                    value={data.media_id}
                                    currentMedia={currentMedia}
                                    onChange={(mediaId, media) => {
                                        setData('media_id', mediaId);
                                        setCurrentMedia(media as Media);
                                    }}
                                    onClear={() => {
                                        setData('media_id', '');
                                        setCurrentMedia(null);
                                    }}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="product_price">Price ({data.currency})</Label>
                                <Input id="product_price" type="number" step="0.01" min="0" value={data.price} onChange={e => setData('price', e.target.value)} className="mt-1" />
                                {errors.price && <p className="text-sm text-red-600 mt-1">{errors.price}</p>}
                            </div>
                            <div>
                                <Label htmlFor="product_stock">Stock <span className="text-xs text-muted-foreground">(blank = unlimited)</span></Label>
                                <Input id="product_stock" type="number" min="0" value={data.stock} onChange={e => setData('stock', e.target.value)} className="mt-1" placeholder="Unlimited" />
                            </div>
                        </div>

                        {/* Variants */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <Label>Variants <span className="text-xs text-muted-foreground">(e.g. Size, Color)</span></Label>
                                <Button type="button" variant="outline" size="sm" onClick={addVariantGroup}>
                                    <Plus className="w-3 h-3 mr-1" /> Add Variant
                                </Button>
                            </div>
                            {variants.map((variant, i) => (
                                <div key={i} className="flex gap-2 mb-2">
                                    <Input
                                        value={variant.label}
                                        onChange={e => updateVariant(i, 'label', e.target.value)}
                                        placeholder="Label (e.g. Size)"
                                        className="w-1/3"
                                    />
                                    <Input
                                        value={variant.options}
                                        onChange={e => updateVariant(i, 'options', e.target.value)}
                                        placeholder="Options (comma-separated: S, M, L, XL)"
                                        className="flex-1"
                                    />
                                    <Button type="button" variant="ghost" size="sm" onClick={() => removeVariantGroup(i)}>
                                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                    </Button>
                                </div>
                            ))}
                            {variants.length === 0 && (
                                <p className="text-xs text-muted-foreground">No variants. Click "Add Variant" for sizes, colors, etc.</p>
                            )}
                        </div>

                        <div className="flex items-center justify-between">
                            <Label htmlFor="product_active" className="cursor-pointer">Active</Label>
                            <Switch id="product_active" checked={data.is_active} onCheckedChange={checked => setData('is_active', checked)} />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                            <Button type="submit" disabled={processing} className="bg-brand hover:bg-brand-dark">
                                {processing ? 'Saving…' : editingId ? 'Update Product' : 'Create Product'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete confirmation */}
            <Dialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Product</DialogTitle>
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

            {/* Image preview lightbox */}
            <Dialog open={!!previewImage} onOpenChange={open => !open && setPreviewImage(null)}>
                <DialogContent className="max-w-2xl p-2">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Product Image</DialogTitle>
                        <DialogDescription>Preview of {previewImage?.alt}</DialogDescription>
                    </DialogHeader>
                    {previewImage && (
                        <img src={previewImage.url} alt={previewImage.alt} className="w-full h-auto rounded-lg" />
                    )}
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
