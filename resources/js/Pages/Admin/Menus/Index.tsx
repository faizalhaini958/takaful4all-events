import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Separator } from '@/Components/ui/separator';
import { router, useForm } from '@inertiajs/react';
import { useState, type FormEventHandler } from 'react';
import { type Menu, type MenuItem } from '@/types';

interface Props {
    menus: Menu[];
}

interface ItemForm {
    label:     string;
    url:       string;
    target:    string;
    parent_id: string;
    sort:      string;
}

export default function MenusIndex({ menus }: Props) {
    const [activeMenuId, setActiveMenuId] = useState<number | null>(menus[0]?.id ?? null);
    const activeMenu = menus.find(m => m.id === activeMenuId) ?? menus[0] ?? null;
    const [showItemDialog, setShowItemDialog] = useState(false);
    const [editingItem, setEditingItem]       = useState<MenuItem | null>(null);

    // --- New menu form ---
    const newMenuForm = useForm({ name: '', slug: '' });

    const submitNewMenu: FormEventHandler = e => {
        e.preventDefault();
        newMenuForm.post('/admin/menus', {
            preserveState: false, // let it reset so new menu appears selected
            onSuccess: () => newMenuForm.reset(),
        });
    };

    // --- Item form ---
    const itemForm = useForm<ItemForm>({
        label:     '',
        url:       '',
        target:    '_self',
        parent_id: '',
        sort:      '0',
    });

    function openNewItem() {
        itemForm.reset();
        setEditingItem(null);
        setShowItemDialog(true);
    }

    function openEditItem(item: MenuItem) {
        itemForm.setData({
            label:     item.label,
            url:       item.url,
            target:    item.target ?? '_self',
            parent_id: item.parent_id ? String(item.parent_id) : '',
            sort:      String(item.sort),
        });
        setEditingItem(item);
        setShowItemDialog(true);
    }

    const submitItem: FormEventHandler = e => {
        e.preventDefault();
        if (!activeMenu) return;

        const opts = {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => setShowItemDialog(false),
        };

        if (editingItem) {
            itemForm.put(`/admin/menus/${activeMenu.id}/items/${editingItem.id}`, opts);
        } else {
            itemForm.post(`/admin/menus/${activeMenu.id}/items`, opts);
        }
    };

    function deleteItem(item: MenuItem) {
        if (!activeMenu || !confirm(`Delete "${item.label}"?`)) return;
        router.delete(`/admin/menus/${activeMenu.id}/items/${item.id}`, {
            preserveState: true,
            preserveScroll: true,
        });
    }

    function deleteMenu(menu: Menu) {
        if (!confirm(`Delete menu "${menu.name}"? All items will also be deleted.`)) return;
        const nextId = menus.filter(m => m.id !== menu.id)[0]?.id ?? null;
        router.delete(`/admin/menus/${menu.id}`, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => setActiveMenuId(nextId),
        });
    }

    const items = activeMenu?.items ?? [];
    const rootItems = items.filter(i => !i.parent_id);

    return (
        <AdminLayout>
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-foreground">Menus</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: menu list + new menu */}
                    <div className="space-y-4">
                        <Card>
                            <CardHeader><CardTitle className="text-base">All Menus</CardTitle></CardHeader>
                            <CardContent className="space-y-1 p-2">
                                {menus.map(menu => (
                                    <div
                                        key={menu.id}
                                        className={`flex items-center justify-between px-3 py-2 rounded cursor-pointer text-sm ${
                                            activeMenu?.id === menu.id
                                                ? 'bg-brand-navy text-white'
                                                : 'hover:bg-accent text-foreground'
                                        }`}
                                        onClick={() => setActiveMenuId(menu.id)}
                                    >
                                        <span className="truncate">{menu.name}</span>
                                        <button
                                            onClick={e => { e.stopPropagation(); deleteMenu(menu); }}
                                            className={`ml-2 text-xs ${activeMenu?.id === menu.id ? 'text-white/70 hover:text-white' : 'text-red-500 hover:text-red-700'}`}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                                {menus.length === 0 && (
                                    <p className="text-sm text-muted-foreground px-3 py-2">No menus yet.</p>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle className="text-base">New Menu</CardTitle></CardHeader>
                            <CardContent>
                                <form onSubmit={submitNewMenu} className="space-y-3">
                                    <div>
                                        <Label htmlFor="menu-name">Name</Label>
                                        <Input
                                            id="menu-name"
                                            value={newMenuForm.data.name}
                                            onChange={e => newMenuForm.setData('name', e.target.value)}
                                            className="mt-1"
                                            placeholder="Main Navigation"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="menu-slug">Slug</Label>
                                        <Input
                                            id="menu-slug"
                                            value={newMenuForm.data.slug}
                                            onChange={e => newMenuForm.setData('slug', e.target.value)}
                                            className="mt-1"
                                            placeholder="main-navigation"
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={newMenuForm.processing}
                                        className="w-full bg-brand hover:bg-brand-dark"
                                    >
                                        Create Menu
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right: active menu items */}
                    <div className="lg:col-span-2">
                        {activeMenu ? (
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base">{activeMenu.name} — Items</CardTitle>
                                        <Button size="sm" onClick={openNewItem} className="bg-brand hover:bg-brand-dark">
                                            + Add Item
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {rootItems.length === 0 && (
                                        <p className="text-sm text-muted-foreground px-4 py-6 text-center">No items yet. Click "+ Add Item".</p>
                                    )}
                                    <ul className="divide-y">
                                        {rootItems.map(item => {
                                            const children = items.filter(c => c.parent_id === item.id);
                                            return (
                                                <li key={item.id}>
                                                    <div className="flex items-center justify-between px-4 py-3 hover:bg-accent">
                                                        <div>
                                                            <p className="text-sm font-medium text-foreground">{item.label}</p>
                                                            <p className="text-xs text-muted-foreground">{item.url}</p>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button onClick={() => openEditItem(item)} className="text-xs text-brand-navy hover:underline">Edit</button>
                                                            <button onClick={() => deleteItem(item)} className="text-xs text-red-600 hover:underline">Delete</button>
                                                        </div>
                                                    </div>
                                                    {children.map(child => (
                                                        <div key={child.id} className="flex items-center justify-between px-8 py-2 bg-muted/30 border-t border-border">
                                                            <div>
                                                                <p className="text-sm text-foreground">↳ {child.label}</p>
                                                                <p className="text-xs text-muted-foreground">{child.url}</p>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button onClick={() => openEditItem(child)} className="text-xs text-brand-navy hover:underline">Edit</button>
                                                                <button onClick={() => deleteItem(child)} className="text-xs text-red-600 hover:underline">Delete</button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm border border-border rounded-lg">
                                Select a menu on the left to manage its items.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add/Edit item dialog */}
            <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingItem ? 'Edit Item' : 'Add Item'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitItem} className="space-y-4">
                        <div>
                            <Label htmlFor="item-label">Label *</Label>
                            <Input
                                id="item-label"
                                value={itemForm.data.label}
                                onChange={e => itemForm.setData('label', e.target.value)}
                                className="mt-1"
                            />
                            {itemForm.errors.label && <p className="text-sm text-red-600 mt-1">{itemForm.errors.label}</p>}
                        </div>
                        <div>
                            <Label htmlFor="item-url">URL *</Label>
                            <Input
                                id="item-url"
                                value={itemForm.data.url}
                                onChange={e => itemForm.setData('url', e.target.value)}
                                className="mt-1"
                                placeholder="/events"
                            />
                            {itemForm.errors.url && <p className="text-sm text-red-600 mt-1">{itemForm.errors.url}</p>}
                        </div>
                        <div>
                            <Label htmlFor="item-target">Target</Label>
                            <Select value={itemForm.data.target} onValueChange={v => itemForm.setData('target', v)}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="_self">Same tab</SelectItem>
                                    <SelectItem value="_blank">New tab</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="item-parent">Parent Item (optional)</Label>
                            <Select value={itemForm.data.parent_id || 'none'} onValueChange={v => itemForm.setData('parent_id', v === 'none' ? '' : v)}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Top level" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Top level</SelectItem>
                                    {(activeMenu?.items ?? [])
                                        .filter(i => !i.parent_id && i.id !== editingItem?.id)
                                        .map(i => (
                                            <SelectItem key={i.id} value={String(i.id)}>{i.label}</SelectItem>
                                        ))
                                    }
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="item-sort">Sort Order</Label>
                            <Input
                                id="item-sort"
                                type="number"
                                value={itemForm.data.sort}
                                onChange={e => itemForm.setData('sort', e.target.value)}
                                className="mt-1"
                            />
                        </div>
                        <Separator />
                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={() => setShowItemDialog(false)}>Cancel</Button>
                            <Button type="submit" disabled={itemForm.processing} className="bg-brand hover:bg-brand-dark">
                                {editingItem ? 'Update' : 'Add'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
