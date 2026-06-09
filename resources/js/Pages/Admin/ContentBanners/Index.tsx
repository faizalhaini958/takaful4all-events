import AdminLayout from '@/Layouts/AdminLayout';
import { useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Switch } from '@/Components/ui/switch';
import { Card, CardContent } from '@/Components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/Components/ui/dialog';
import { Plus, Pencil, Trash2, GripVertical, ExternalLink } from 'lucide-react';
import { type ContentBanner } from '@/types';

interface Props {
    banners: ContentBanner[];
}

function BannerFormDialog({
    banner,
    trigger,
    onClose,
}: {
    banner?: ContentBanner;
    trigger: React.ReactNode;
    onClose?: () => void;
}) {
    const [open, setOpen] = useState(false);
    const isEdit = !!banner;

    const { data, setData, post, processing, errors, reset } = useForm<{
        title: string;
        subtitle: string;
        image: File | null;
        button_text: string;
        button_link: string;
        sort_order: string;
        is_active: boolean;
        start_date: string;
        end_date: string;
    }>({
        title: banner?.title ?? '',
        subtitle: banner?.subtitle ?? '',
        image: null,
        button_text: banner?.button_text ?? '',
        button_link: banner?.button_link ?? '',
        sort_order: String(banner?.sort_order ?? 0),
        is_active: banner?.is_active ?? true,
        start_date: banner?.start_date ?? '',
        end_date: banner?.end_date ?? '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const url = isEdit ? `/admin/content-banners/${banner!.id}` : '/admin/content-banners';

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
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Edit Content Banner' : 'Add Content Banner'}</DialogTitle>
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
                        <Label htmlFor="subtitle">Subtitle <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
                        <Input
                            id="subtitle"
                            value={data.subtitle}
                            onChange={e => setData('subtitle', e.target.value)}
                            className="mt-1"
                            placeholder="Short description"
                        />
                        {errors.subtitle && <p className="text-sm text-red-600 mt-1">{errors.subtitle}</p>}
                    </div>

                    <div>
                        <Label>Banner Image *</Label>
                        {isEdit && banner?.image_url && !data.image && (
                            <div className="relative rounded-lg overflow-hidden bg-gray-100 mt-1">
                                <img
                                    src={banner.image_url}
                                    alt={banner.title}
                                    className="w-full rounded-lg object-cover"
                                    style={{ aspectRatio: '16 / 6' }}
                                />
                            </div>
                        )}
                        {data.image && (
                            <div className="relative rounded-lg overflow-hidden bg-gray-100 mt-1">
                                <img
                                    src={URL.createObjectURL(data.image)}
                                    alt="Preview"
                                    className="w-full rounded-lg object-cover"
                                    style={{ aspectRatio: '16 / 6' }}
                                />
                            </div>
                        )}
                        <Input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={e => setData('image', e.target.files?.[0] ?? null)}
                            className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Required ratio: <strong>16:6</strong> (e.g. 1920 × 720px). Min 800px wide. JPEG, PNG, or WebP. Max 5MB.<br />
                            Images that don't match this ratio will be centre-cropped to fit.
                        </p>
                        {errors.image && <p className="text-sm text-red-600 mt-1">{errors.image}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="button_text">Button Text <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
                            <Input
                                id="button_text"
                                value={data.button_text}
                                onChange={e => setData('button_text', e.target.value)}
                                className="mt-1"
                                placeholder="e.g. Learn More"
                            />
                            {errors.button_text && <p className="text-sm text-red-600 mt-1">{errors.button_text}</p>}
                        </div>
                        <div>
                            <Label htmlFor="button_link">Button Link <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
                            <Input
                                id="button_link"
                                type="url"
                                value={data.button_link}
                                onChange={e => setData('button_link', e.target.value)}
                                className="mt-1"
                                placeholder="https://..."
                            />
                            {errors.button_link && <p className="text-sm text-red-600 mt-1">{errors.button_link}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
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
                        <div>
                            <Label htmlFor="start_date">Start Date <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
                            <Input
                                id="start_date"
                                type="datetime-local"
                                value={data.start_date}
                                onChange={e => setData('start_date', e.target.value)}
                                className="mt-1"
                            />
                            {errors.start_date && <p className="text-sm text-red-600 mt-1">{errors.start_date}</p>}
                        </div>
                        <div>
                            <Label htmlFor="end_date">End Date <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
                            <Input
                                id="end_date"
                                type="datetime-local"
                                value={data.end_date}
                                onChange={e => setData('end_date', e.target.value)}
                                className="mt-1"
                            />
                            {errors.end_date && <p className="text-sm text-red-600 mt-1">{errors.end_date}</p>}
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <div className="flex flex-col">
                            <Label htmlFor="is_active" className="cursor-pointer">Active</Label>
                            <p className="text-xs text-muted-foreground">Only active banners within their date range appear on the Content page.</p>
                        </div>
                        <Switch
                            id="is_active"
                            checked={data.is_active}
                            onCheckedChange={checked => setData('is_active', checked)}
                        />
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

function formatDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-MY', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

export default function ContentBannersIndex({ banners }: Props) {
    const handleDelete = (banner: ContentBanner) => {
        if (!confirm(`Delete content banner "${banner.title}"?`)) return;
        router.delete(`/admin/content-banners/${banner.id}`);
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Content Banners</h1>
                        <p className="text-sm text-muted-foreground">
                            Manage promotional banners for the Content page. These appear in the Featured Highlights carousel.
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

                {banners.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center text-muted-foreground">
                            No content banners yet. Click "Add Banner" to create your first one.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {banners.map(banner => (
                            <Card key={banner.id}>
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3 sm:gap-4">
                                        <GripVertical className="w-5 h-5 text-muted-foreground flex-shrink-0 cursor-grab" />
                                        <img
                                            src={banner.image_url}
                                            alt={banner.title}
                                            className="h-16 w-24 sm:h-20 sm:w-36 rounded-lg object-cover flex-shrink-0 bg-gray-100"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-foreground truncate">{banner.title}</h3>
                                            {banner.subtitle && (
                                                <p className="text-xs text-muted-foreground truncate mt-0.5">{banner.subtitle}</p>
                                            )}
                                            {banner.button_link && (
                                                <a
                                                    href={banner.button_link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-brand hover:underline flex items-center gap-1 mt-1 truncate"
                                                >
                                                    {banner.button_link} <ExternalLink className="w-3 h-3 shrink-0" />
                                                </a>
                                            )}
                                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
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
                                                {(banner.start_date || banner.end_date) && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatDate(banner.start_date)} – {formatDate(banner.end_date)}
                                                    </span>
                                                )}
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
