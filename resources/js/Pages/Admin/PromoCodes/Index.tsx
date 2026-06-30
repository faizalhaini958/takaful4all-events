import AdminLayout from '@/Layouts/AdminLayout';
import { useForm, router, Link } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Switch } from '@/Components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/Components/ui/dialog';
import { Badge } from '@/Components/ui/badge';
import { Plus, Pencil, Trash2, Tag, Percent, DollarSign, Eye } from 'lucide-react';
import { type Event, type PaginatedData } from '@/types';

interface PromoCode {
    id: number;
    code: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    max_uses: number | null;
    used_count: number;
    max_uses_per_user: number | null;
    min_order_amount: number | null;
    event_id: number | null;
    event?: Event | null;
    starts_at: string | null;
    expires_at: string | null;
    is_active: boolean;
    created_by: number | null;
    creator?: { id: number; name: string } | null;
    created_at: string;
    updated_at: string;
}

interface Props {
    promo_codes: PaginatedData<PromoCode>;
    events: Event[];
    filters: {
        search?: string;
        event_id?: string;
    };
    stats: {
        total_codes: number;
        active_codes: number;
        total_redemptions: number;
        total_discounted: number;
    };
}

function PromoCodeFormDialog({
    promoCode,
    events,
    trigger,
    onClose,
}: {
    promoCode?: PromoCode;
    events: Event[];
    trigger: React.ReactNode;
    onClose?: () => void;
}) {
    const [open, setOpen] = useState(false);
    const isEdit = !!promoCode;

    const { data, setData, post, put, processing, errors, reset } = useForm({
        code: promoCode?.code ?? '',
        discount_type: promoCode?.discount_type ?? 'percentage',
        discount_value: String(promoCode?.discount_value ?? ''),
        max_uses: promoCode?.max_uses != null ? String(promoCode.max_uses) : '',
        max_uses_per_user: promoCode?.max_uses_per_user != null ? String(promoCode.max_uses_per_user) : '',
        min_order_amount: promoCode?.min_order_amount != null ? String(promoCode.min_order_amount) : '',
        event_id: promoCode?.event_id != null ? String(promoCode.event_id) : '',
        starts_at: promoCode?.starts_at?.slice(0, 16) ?? '',
        expires_at: promoCode?.expires_at?.slice(0, 16) ?? '',
        is_active: promoCode?.is_active ?? true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const url = isEdit ? `/admin/promo-codes/${promoCode!.id}` : '/admin/promo-codes';

        const options = {
            onSuccess: () => {
                setOpen(false);
                reset();
                onClose?.();
            },
        };

        if (isEdit) {
            put(url, options);
        } else {
            post(url, options);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Edit Promo Code' : 'Create Promo Code'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="code">Code *</Label>
                        <Input
                            id="code"
                            value={data.code}
                            onChange={e => setData('code', e.target.value.toUpperCase())}
                            className="mt-1 font-mono tracking-wider"
                            placeholder="e.g. SUMMER20"
                        />
                        {errors.code && <p className="text-sm text-red-600 mt-1">{errors.code}</p>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="discount_type">Discount Type *</Label>
                            <Select value={data.discount_type} onValueChange={v => setData('discount_type', v as 'percentage' | 'fixed')}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                                    <SelectItem value="fixed">Fixed (RM)</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.discount_type && <p className="text-sm text-red-600 mt-1">{errors.discount_type}</p>}
                        </div>
                        <div>
                            <Label htmlFor="discount_value">Discount Value *</Label>
                            <Input
                                id="discount_value"
                                type="number"
                                step="0.01"
                                min="0"
                                value={data.discount_value}
                                onChange={e => setData('discount_value', e.target.value)}
                                className="mt-1"
                                placeholder={data.discount_type === 'percentage' ? 'e.g. 20' : 'e.g. 10.00'}
                            />
                            {errors.discount_value && <p className="text-sm text-red-600 mt-1">{errors.discount_value}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="max_uses">Max Uses</Label>
                            <Input
                                id="max_uses"
                                type="number"
                                min="1"
                                value={data.max_uses}
                                onChange={e => setData('max_uses', e.target.value)}
                                className="mt-1"
                                placeholder="Unlimited"
                            />
                            {errors.max_uses && <p className="text-sm text-red-600 mt-1">{errors.max_uses}</p>}
                        </div>
                        <div>
                            <Label htmlFor="max_uses_per_user">Max Uses Per User</Label>
                            <Input
                                id="max_uses_per_user"
                                type="number"
                                min="1"
                                value={data.max_uses_per_user}
                                onChange={e => setData('max_uses_per_user', e.target.value)}
                                className="mt-1"
                                placeholder="Unlimited"
                            />
                            {errors.max_uses_per_user && <p className="text-sm text-red-600 mt-1">{errors.max_uses_per_user}</p>}
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="min_order_amount">Min Order Amount (RM)</Label>
                        <Input
                            id="min_order_amount"
                            type="number"
                            step="0.01"
                            min="0"
                            value={data.min_order_amount}
                            onChange={e => setData('min_order_amount', e.target.value)}
                            className="mt-1"
                            placeholder="No minimum"
                        />
                        {errors.min_order_amount && <p className="text-sm text-red-600 mt-1">{errors.min_order_amount}</p>}
                    </div>

                    <div>
                        <Label htmlFor="event_id">Event Scope</Label>
                        <Select value={data.event_id} onValueChange={v => setData('event_id', v === 'all' ? '' : v)}>
                            <SelectTrigger className="mt-1">
                                <SelectValue placeholder="All Events" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Events</SelectItem>
                                {events.map(event => (
                                    <SelectItem key={event.id} value={String(event.id)}>{event.title}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.event_id && <p className="text-sm text-red-600 mt-1">{errors.event_id}</p>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="starts_at">Starts At</Label>
                            <Input
                                id="starts_at"
                                type="datetime-local"
                                value={data.starts_at}
                                onChange={e => setData('starts_at', e.target.value)}
                                className="mt-1"
                            />
                            {errors.starts_at && <p className="text-sm text-red-600 mt-1">{errors.starts_at}</p>}
                        </div>
                        <div>
                            <Label htmlFor="expires_at">Expires At</Label>
                            <Input
                                id="expires_at"
                                type="datetime-local"
                                value={data.expires_at}
                                onChange={e => setData('expires_at', e.target.value)}
                                className="mt-1"
                            />
                            {errors.expires_at && <p className="text-sm text-red-600 mt-1">{errors.expires_at}</p>}
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <Label htmlFor="is_active" className="cursor-pointer">Active</Label>
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
                            {processing ? 'Saving…' : isEdit ? 'Update' : 'Create'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function PromoCodesIndex({ promo_codes, events, filters, stats }: Props) {
    const { data: promoList, current_page, last_page, total, links } = promo_codes;

    const handleDelete = (promoCode: PromoCode) => {
        if (!confirm(`Delete promo code "${promoCode.code}"?`)) return;
        router.delete(`/admin/promo-codes/${promoCode.id}`);
    };

    const handlePageChange = (page: number) => {
        const params: Record<string, string> = {};
        if (filters.search) params.search = filters.search;
        if (filters.event_id) params.event_id = filters.event_id;
        params.page = String(page);
        router.get('/admin/promo-codes', params, { preserveState: true });
    };

    const handleSearch = (value: string) => {
        router.get('/admin/promo-codes', { search: value, ...(filters.event_id ? { event_id: filters.event_id } : {}) }, { preserveState: true, replace: true });
    };

    const handleEventFilter = (value: string) => {
        router.get('/admin/promo-codes', { event_id: value || undefined, ...(filters.search ? { search: filters.search } : {}) }, { preserveState: true, replace: true });
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Promo Codes</h1>
                        <p className="text-sm text-muted-foreground">
                            Create and manage discount promo codes for event registrations.
                        </p>
                    </div>
                    <PromoCodeFormDialog
                        events={events}
                        trigger={
                            <Button className="bg-brand hover:bg-brand-dark">
                                <Plus className="w-4 h-4 mr-1.5" /> Create Code
                            </Button>
                        }
                    />
                </div>

                {/* Stats cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Card>
                        <CardContent className="py-3 px-4">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Codes</p>
                            <p className="text-xl font-bold mt-0.5">{stats.total_codes}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="py-3 px-4">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Active</p>
                            <p className="text-xl font-bold mt-0.5 text-emerald-600">{stats.active_codes}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="py-3 px-4">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Redemptions</p>
                            <p className="text-xl font-bold mt-0.5">{stats.total_redemptions}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="py-3 px-4">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Discounted</p>
                            <p className="text-xl font-bold mt-0.5 text-emerald-600">RM {Number(stats.total_discounted).toFixed(2)}</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex gap-3">
                    <Input
                        placeholder="Search codes..."
                        value={filters.search ?? ''}
                        onChange={e => handleSearch(e.target.value)}
                        className="max-w-xs"
                    />
                    <Select value={filters.event_id ?? 'all'} onValueChange={handleEventFilter}>
                        <SelectTrigger className="w-full sm:w-[200px]">
                            <SelectValue placeholder="All Events" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Events</SelectItem>
                            {events.map(event => (
                                <SelectItem key={event.id} value={String(event.id)}>{event.title}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {promoList.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center text-muted-foreground">
                            No promo codes yet. Click "Create Code" to create your first one.
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <div className="space-y-3">
                            {promoList.map(promoCode => (
                                <Card key={promoCode.id}>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1.5">
                                                <div className="flex items-center gap-2">
                                                    <Tag className="w-4 h-4 text-brand" />
                                                    <Link href={`/admin/promo-codes/${promoCode.id}`} className="font-mono font-bold text-lg tracking-wider hover:text-brand transition-colors">
                                                        {promoCode.code}
                                                    </Link>
                                                    <Badge variant={promoCode.is_active ? 'default' : 'secondary'} className="text-xs">
                                                        {promoCode.is_active ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                    {promoCode.discount_type === 'percentage' ? (
                                                        <span className="flex items-center gap-1">
                                                            <Percent className="w-3.5 h-3.5" /> {promoCode.discount_value}% off
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1">
                                                            <DollarSign className="w-3.5 h-3.5" /> RM {Number(promoCode.discount_value).toFixed(2)} off
                                                        </span>
                                                    )}
                                                    <span>{promoCode.used_count} / {promoCode.max_uses ?? '∞'} used</span>
                                                    {promoCode.event && (
                                                        <span className="text-xs bg-gray-100 dark:bg-muted px-2 py-0.5 rounded">
                                                            {promoCode.event.title}
                                                        </span>
                                                    )}
                                                    {!promoCode.event_id && (
                                                        <span className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded">
                                                            All Events
                                                        </span>
                                                    )}
                                                    {promoCode.expires_at && (
                                                        <span className="text-xs">
                                                            Expires: {new Date(promoCode.expires_at).toLocaleDateString('en-MY')}
                                                        </span>
                                                    )}
                                                    {promoCode.starts_at && new Date(promoCode.starts_at) > new Date() && (
                                                        <span className="text-xs text-amber-600">
                                                            Starts: {new Date(promoCode.starts_at).toLocaleDateString('en-MY')}
                                                        </span>
                                                    )}
                                                </div>
                                                {promoCode.creator && (
                                                    <p className="text-xs text-muted-foreground">
                                                        Created by {promoCode.creator.name}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                <Link href={`/admin/promo-codes/${promoCode.id}`}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" title="View details">
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                </Link>
                                                <PromoCodeFormDialog
                                                    promoCode={promoCode}
                                                    events={events}
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
                                                    onClick={() => handleDelete(promoCode)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {last_page > 1 && (
                            <div className="flex items-center justify-center gap-2 pt-4">
                                {links.filter(l => l.url).map((link, i) => (
                                    <Button
                                        key={i}
                                        variant={link.active ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => {
                                            const url = new URL(link.url!);
                                            const page = url.searchParams.get('page');
                                            if (page) handlePageChange(Number(page));
                                        }}
                                        className={link.active ? 'bg-brand hover:bg-brand-dark' : ''}
                                    >
                                        <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                    </Button>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </AdminLayout>
    );
}
