import AdminLayout from '@/Layouts/AdminLayout';
import { useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Switch } from '@/Components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/Components/ui/dialog';
import { Plus, Pencil, Trash2, GripVertical, ExternalLink } from 'lucide-react';
import { type Banner } from '@/types';

interface Props {
    banners: Banner[];
}

function BannerFormDialog({
    banner,
    trigger,
    onClose,
}: {
    banner?: Banner;
    trigger: React.ReactNode;
    onClose?: () => void;
}) {
    const [open, setOpen] = useState(false);
    const isEdit = !!banner;

    const { data, setData, post, processing, errors, reset } = useForm<{
        title: string;
        image: File | null;
        link_url: string;
        sort_order: string;
        is_active: boolean;
    }>({
        title: banner?.title ?? '',
        image: null,
        link_url: banner?.link_url ?? '',
        sort_order: String(banner?.sort_order ?? 0),
        is_active: banner?.is_active ?? true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const url = isEdit ? `/admin/banners/${banner!.id}` : '/admin/banners';

        post(url, {
            forceFormData: true,
            onSuccess: () => {
                setOpen(false);
                reset();
                onClose?.();
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Edit Banner' : 'Add Banner'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="title">Title *</Label>
                        <Input
                            id="title"
                            value={data.title}
                            onChange={e => setData('title', e.target.value)}
                            className="mt-1"
                            placeholder="Banner title"
                        />
                        {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title}</p>}
                    </div>

                    <div>
                        <Label htmlFor="image">Image {!isEdit && '*'}</Label>
                        {isEdit && banner?.image_url && (
                            <img src={banner.image_url} alt={banner.title} className="mt-1 rounded-lg h-32 w-full object-cover" />
                        )}
                        <Input
                            id="image"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={e => setData('image', e.target.files?.[0] ?? null)}
                            className="mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Min 800px wide. JPEG, PNG, or WebP. Max 5MB.</p>
                        {errors.image && <p className="text-sm text-red-600 mt-1">{errors.image}</p>}
                    </div>

                    <div>
                        <Label htmlFor="link_url">Link URL <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
                        <Input
                            id="link_url"
                            type="url"
                            value={data.link_url}
                            onChange={e => setData('link_url', e.target.value)}
                            className="mt-1"
                            placeholder="https://..."
                        />
                        {errors.link_url && <p className="text-sm text-red-600 mt-1">{errors.link_url}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="sort_order">Sort Order</Label>
                            <Input
                                id="sort_order"
                                type="number"
                                value={data.sort_order}
                                onChange={e => setData('sort_order', e.target.value)}
                                className="mt-1"
                                min="0"
                            />
                        </div>
                        <div className="flex items-center justify-between pt-6">
                            <Label htmlFor="is_active" className="cursor-pointer">Active</Label>
                            <Switch
                                id="is_active"
                                checked={data.is_active}
                                onCheckedChange={checked => setData('is_active', checked)}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing} className="bg-brand hover:bg-brand-dark">
                            {processing ? 'Saving…' : isEdit ? 'Update Banner' : 'Create Banner'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function BannersIndex({ banners }: Props) {
    const handleDelete = (banner: Banner) => {
        if (!confirm(`Delete banner "${banner.title}"?`)) return;
        router.delete(`/admin/banners/${banner.id}`);
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Banners</h1>
                        <p className="text-sm text-muted-foreground">
                            Manage homepage carousel banners. Drag to reorder.
                        </p>
                    </div>
                    <BannerFormDialog
                        trigger={
                            <Button className="bg-brand hover:bg-brand-dark">
                                <Plus className="w-4 h-4 mr-1.5" /> Add Banner
                            </Button>
                        }
                    />
                </div>

                {/* Banners List */}
                {banners.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center text-muted-foreground">
                            No banners yet. Click "Add Banner" to create your first one.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {banners.map(banner => (
                            <Card key={banner.id}>
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-4">
                                        <GripVertical className="w-5 h-5 text-muted-foreground flex-shrink-0 cursor-grab" />
                                        <img
                                            src={banner.image_url}
                                            alt={banner.title}
                                            className="h-20 w-36 rounded-lg object-cover flex-shrink-0 bg-gray-100"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-foreground truncate">{banner.title}</h3>
                                            {banner.link_url && (
                                                <a
                                                    href={banner.link_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-brand hover:underline flex items-center gap-1 mt-0.5"
                                                >
                                                    {banner.link_url} <ExternalLink className="w-3 h-3" />
                                                </a>
                                            )}
                                            <div className="flex items-center gap-3 mt-1.5">
                                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                                    banner.is_active
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                    {banner.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    Order: {banner.sort_order}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            <BannerFormDialog
                                                banner={banner}
                                                trigger={
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <Pencil className="w-4 h-4" />
                                                    </Button>
                                                }
                                            />
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => handleDelete(banner)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
