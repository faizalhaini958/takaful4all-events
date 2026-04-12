import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/Components/ui/dropdown-menu';
import { Separator } from '@/Components/ui/separator';
import InputError from '@/Components/InputError';
import { router, useForm } from '@inertiajs/react';
import { useState, type FormEventHandler } from 'react';
import { type Menu, type MenuItem } from '@/types';
import { Plus, MoreHorizontal, Pencil, Trash2, ExternalLink, Link2, CornerDownRight, GripVertical, Menu as MenuIcon, ListTree } from 'lucide-react';

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

function generateSlug(value: string) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

export default function MenusIndex({ menus }: Props) {
    const [activeMenuId, setActiveMenuId] = useState<number | null>(menus[0]?.id ?? null);
    const activeMenu = menus.find(m => m.id === activeMenuId) ?? menus[0] ?? null;
    const [showItemDialog, setShowItemDialog] = useState(false);
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
    const [showNewMenuDialog, setShowNewMenuDialog] = useState(false);
    const [deleteMenuTarget, setDeleteMenuTarget] = useState<Menu | null>(null);
    const [deleteItemTarget, setDeleteItemTarget] = useState<MenuItem | null>(null);

    // --- New menu form ---
    const newMenuForm = useForm({ name: '', slug: '' });

    const submitNewMenu: FormEventHandler = e => {
        e.preventDefault();
        newMenuForm.post('/admin/menus', {
            preserveState: false,
            onSuccess: () => { newMenuForm.reset(); setShowNewMenuDialog(false); },
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
        itemForm.clearErrors();
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
        itemForm.clearErrors();
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

    function confirmDeleteItem() {
        if (!activeMenu || !deleteItemTarget) return;
        router.delete(`/admin/menus/${activeMenu.id}/items/${deleteItemTarget.id}`, {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => setDeleteItemTarget(null),
        });
    }

    function confirmDeleteMenu() {
        if (!deleteMenuTarget) return;
        const nextId = menus.filter(m => m.id !== deleteMenuTarget.id)[0]?.id ?? null;
        router.delete(`/admin/menus/${deleteMenuTarget.id}`, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => { setActiveMenuId(nextId); setDeleteMenuTarget(null); },
        });
    }

    const items = activeMenu?.items ?? [];
    const rootItems = items.filter(i => !i.parent_id);

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Menus</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">Manage navigation menus and their items</p>
                    </div>
                    <Button size="sm" onClick={() => { newMenuForm.reset(); newMenuForm.clearErrors(); setShowNewMenuDialog(true); }}>
                        <Plus className="w-4 h-4 mr-1.5" /> New Menu
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
                    {/* Left: menu list */}
                    <div className="space-y-2">
                        <p className="text-[11px] font-bold uppercase text-primary tracking-widest px-1 mb-1">Menus</p>
                        {menus.map(menu => {
                            const isActive = activeMenu?.id === menu.id;
                            return (
                                <button
                                    key={menu.id}
                                    onClick={() => setActiveMenuId(menu.id)}
                                    className={`w-full flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all ${
                                        isActive
                                            ? 'border-primary/50 ring-2 ring-primary/20 bg-primary/5'
                                            : 'border-border/60 bg-card hover:border-primary/30'
                                    }`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${isActive ? 'bg-primary/15' : 'bg-muted/60'}`}>
                                            <MenuIcon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className={`text-sm font-medium truncate ${isActive ? 'text-foreground' : 'text-foreground'}`}>{menu.name}</p>
                                            <p className="text-[11px] text-muted-foreground font-mono">{menu.slug}</p>
                                        </div>
                                    </div>
                                    <span className={`text-xs font-semibold tabular-nums ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                                        {menu.items.length}
                                    </span>
                                </button>
                            );
                        })}
                        {menus.length === 0 && (
                            <div className="rounded-xl border border-dashed border-border/60 p-6 text-center">
                                <ListTree className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
                                <p className="text-sm text-muted-foreground">No menus yet</p>
                                <Button variant="link" size="sm" className="mt-1 text-primary" onClick={() => setShowNewMenuDialog(true)}>
                                    Create your first menu
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Right: active menu items */}
                    <div>
                        {activeMenu ? (
                            <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
                                {/* Items header */}
                                <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b border-border/60">
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-sm font-semibold text-foreground">{activeMenu.name}</h2>
                                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary tabular-nums">
                                            {items.length} item{items.length !== 1 && 's'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={openNewItem}>
                                            <Plus className="w-3.5 h-3.5 mr-1" /> Add Item
                                        </Button>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-40">
                                                <DropdownMenuItem
                                                    className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                                                    onClick={() => setDeleteMenuTarget(activeMenu)}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete Menu
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>

                                {/* Items list */}
                                {rootItems.length === 0 ? (
                                    <div className="text-center py-12">
                                        <ListTree className="w-10 h-10 mx-auto mb-3 text-muted-foreground/20" />
                                        <p className="text-sm text-muted-foreground font-medium">No items yet</p>
                                        <Button variant="link" size="sm" className="mt-1 text-primary" onClick={openNewItem}>
                                            Add your first item
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-border/40">
                                        {rootItems.map(item => {
                                            const children = items.filter(c => c.parent_id === item.id);
                                            return (
                                                <div key={item.id}>
                                                    {/* Root item */}
                                                    <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors group">
                                                        <GripVertical className="w-4 h-4 text-muted-foreground/30 shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-foreground">{item.label}</p>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <code className="text-[11px] font-mono text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">{item.url}</code>
                                                                {item.target === '_blank' && (
                                                                    <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                                                                        <ExternalLink className="w-2.5 h-2.5" /> new tab
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => openEditItem(item)}>
                                                                <Pencil className="w-3.5 h-3.5" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-600" onClick={() => setDeleteItemTarget(item)}>
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    {/* Children */}
                                                    {children.map(child => (
                                                        <div key={child.id} className="flex items-center gap-3 pl-12 pr-4 py-2.5 bg-muted/10 hover:bg-muted/20 transition-colors group border-t border-border/20">
                                                            <CornerDownRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm text-foreground">{child.label}</p>
                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                    <code className="text-[11px] font-mono text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">{child.url}</code>
                                                                    {child.target === '_blank' && (
                                                                        <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                                                                            <ExternalLink className="w-2.5 h-2.5" /> new tab
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => openEditItem(child)}>
                                                                    <Pencil className="w-3.5 h-3.5" />
                                                                </Button>
                                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-600" onClick={() => setDeleteItemTarget(child)}>
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed border-border/60 flex items-center justify-center h-48">
                                <div className="text-center">
                                    <MenuIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
                                    <p className="text-sm text-muted-foreground">Select a menu to manage its items</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* New Menu Dialog */}
            <Dialog open={showNewMenuDialog} onOpenChange={setShowNewMenuDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Plus className="w-5 h-5 text-primary" /> New Menu
                        </DialogTitle>
                        <DialogDescription>Create a new navigation menu</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submitNewMenu} className="space-y-4 mt-1">
                        <div className="space-y-1.5">
                            <Label htmlFor="menu-name">Name</Label>
                            <Input
                                id="menu-name"
                                value={newMenuForm.data.name}
                                onChange={e => {
                                    newMenuForm.setData('name', e.target.value);
                                    newMenuForm.setData('slug', generateSlug(e.target.value));
                                }}
                                placeholder="Main Navigation"
                                required
                            />
                            <InputError message={newMenuForm.errors.name} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="menu-slug">Slug</Label>
                            <Input
                                id="menu-slug"
                                value={newMenuForm.data.slug}
                                onChange={e => newMenuForm.setData('slug', e.target.value)}
                                placeholder="main-navigation"
                                className="font-mono text-sm"
                                required
                            />
                            <InputError message={newMenuForm.errors.slug} />
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0 pt-2">
                            <Button type="button" variant="outline" onClick={() => setShowNewMenuDialog(false)}>Cancel</Button>
                            <Button type="submit" disabled={newMenuForm.processing}>
                                {newMenuForm.processing ? 'Creating…' : 'Create Menu'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Add/Edit Item Dialog */}
            <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {editingItem ? <Pencil className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
                            {editingItem ? 'Edit Item' : 'Add Item'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingItem ? `Update "${editingItem.label}"` : `Add a new item to ${activeMenu?.name ?? 'menu'}`}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submitItem} className="space-y-4 mt-1">
                        <div className="space-y-1.5">
                            <Label htmlFor="item-label">Label</Label>
                            <Input
                                id="item-label"
                                value={itemForm.data.label}
                                onChange={e => itemForm.setData('label', e.target.value)}
                                required
                            />
                            <InputError message={itemForm.errors.label} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="item-url">URL</Label>
                            <div className="flex items-center gap-2">
                                <Link2 className="w-4 h-4 text-muted-foreground shrink-0" />
                                <Input
                                    id="item-url"
                                    value={itemForm.data.url}
                                    onChange={e => itemForm.setData('url', e.target.value)}
                                    placeholder="/events"
                                    required
                                />
                            </div>
                            <InputError message={itemForm.errors.url} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="item-target">Target</Label>
                                <Select value={itemForm.data.target} onValueChange={v => itemForm.setData('target', v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="_self">Same tab</SelectItem>
                                        <SelectItem value="_blank">New tab</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="item-sort">Sort Order</Label>
                                <Input
                                    id="item-sort"
                                    type="number"
                                    value={itemForm.data.sort}
                                    onChange={e => itemForm.setData('sort', e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="item-parent">Parent Item</Label>
                            <Select value={itemForm.data.parent_id || 'none'} onValueChange={v => itemForm.setData('parent_id', v === 'none' ? '' : v)}>
                                <SelectTrigger>
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
                        <DialogFooter className="gap-2 sm:gap-0 pt-2">
                            <Button variant="outline" type="button" onClick={() => setShowItemDialog(false)}>Cancel</Button>
                            <Button type="submit" disabled={itemForm.processing}>
                                {itemForm.processing ? 'Saving…' : editingItem ? 'Update Item' : 'Add Item'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Menu Confirmation */}
            <Dialog open={!!deleteMenuTarget} onOpenChange={open => !open && setDeleteMenuTarget(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                            <Trash2 className="w-5 h-5" /> Delete Menu
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong className="text-foreground">{deleteMenuTarget?.name}</strong>? All items in this menu will also be deleted. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setDeleteMenuTarget(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDeleteMenu}>
                            <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Item Confirmation */}
            <Dialog open={!!deleteItemTarget} onOpenChange={open => !open && setDeleteItemTarget(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                            <Trash2 className="w-5 h-5" /> Delete Item
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong className="text-foreground">{deleteItemTarget?.label}</strong>?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setDeleteItemTarget(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDeleteItem}>
                            <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
