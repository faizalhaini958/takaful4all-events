import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Separator } from '@/Components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/Components/ui/dropdown-menu';
import InputError from '@/Components/InputError';
import { Link, router, useForm } from '@inertiajs/react';
import { useState, type FormEventHandler } from 'react';
import { type PaginatedData } from '@/types';
import { Users, Search, Plus, MoreHorizontal, Pencil, Trash2, Shield, Building2, UserCircle, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface UserRow {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'editor' | 'company' | 'public';
    company_name: string | null;
    company_registration_no: string | null;
    company_address: string | null;
    company_phone: string | null;
    created_at: string;
}

type UserRole = 'admin' | 'editor' | 'company' | 'public';

const EMPTY_FORM: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    company_name: string;
    company_registration_no: string;
    company_address: string;
    company_phone: string;
} = {
    name: '',
    email: '',
    password: '',
    role: 'public',
    company_name: '',
    company_registration_no: '',
    company_address: '',
    company_phone: '',
};

interface Props {
    users: PaginatedData<UserRow>;
    filters: {
        role: string;
        search: string;
    };
}

const ROLE_PILL: Record<string, { class: string; icon: typeof Shield }> = {
    admin:   { class: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30',       icon: Shield },
    editor:  { class: 'bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30', icon: Pencil },
    company: { class: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',     icon: Building2 },
    public:  { class: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30',             icon: UserCircle },
};

export default function UsersIndex({ users, filters }: Props) {
    const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
    const [search, setSearch] = useState(filters.search);
    const [formOpen, setFormOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserRow | null>(null);

    const form = useForm({ ...EMPTY_FORM });

    function openCreate() {
        setEditingUser(null);
        form.reset();
        form.clearErrors();
        setFormOpen(true);
    }

    function openEdit(user: UserRow) {
        setEditingUser(user);
        form.setData({
            name: user.name,
            email: user.email,
            password: '',
            role: user.role,
            company_name: user.company_name ?? '',
            company_registration_no: user.company_registration_no ?? '',
            company_address: user.company_address ?? '',
            company_phone: user.company_phone ?? '',
        });
        form.clearErrors();
        setFormOpen(true);
    }

    function closeForm() {
        setFormOpen(false);
        setEditingUser(null);
    }

    const handleFormSubmit: FormEventHandler = e => {
        e.preventDefault();
        if (editingUser) {
            form.put(`/admin/users/${editingUser.id}`, {
                onSuccess: () => closeForm(),
                preserveScroll: true,
            });
        } else {
            form.post('/admin/users', {
                onSuccess: () => closeForm(),
                preserveScroll: true,
            });
        }
    };

    function confirmDelete() {
        if (!deleteTarget) return;
        router.delete(`/admin/users/${deleteTarget.id}`, {
            onFinish: () => setDeleteTarget(null),
        });
    }

    function applyFilters(newFilters: Partial<typeof filters>) {
        router.get('/admin/users', {
            ...filters,
            ...newFilters,
            page: 1,
        }, {
            preserveState: true,
            replace: true,
        });
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        applyFilters({ search });
    }

    const hasActiveFilters = !!(filters.search || filters.role);

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Users</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">{users.total} user{users.total !== 1 && 's'} total</p>
                    </div>
                    <Button size="sm" onClick={openCreate}>
                        <Plus className="w-4 h-4 mr-1.5" /> New User
                    </Button>
                </div>

                {/* Role Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(['admin', 'editor', 'company', 'public'] as const).map(role => {
                        const pill = ROLE_PILL[role];
                        const Icon = pill.icon;
                        const isActive = filters.role === role;
                        return (
                            <button
                                key={role}
                                onClick={() => applyFilters({ role: isActive ? '' : role })}
                                className={`rounded-xl border p-4 text-left transition-all ${
                                    isActive
                                        ? 'border-primary/50 ring-2 ring-primary/20 bg-primary/5'
                                        : 'border-border/60 bg-card hover:border-primary/30'
                                }`}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${pill.class.split(' ').filter(c => c.startsWith('bg-'))[0]}`}>
                                        <Icon className={`w-4 h-4 ${pill.class.split(' ').filter(c => c.startsWith('text-'))[0]}`} />
                                    </div>
                                </div>
                                <p className="text-xs font-medium capitalize tracking-wider text-muted-foreground">{role}</p>
                            </button>
                        );
                    })}
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <form onSubmit={handleSearch} className="flex gap-2 flex-1">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search name, email, or company..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Button type="submit" variant="secondary" size="sm" className="h-9">Search</Button>
                    </form>

                    <Select
                        value={filters.role || 'all'}
                        onValueChange={val => applyFilters({ role: val === 'all' ? '' : val })}
                    >
                        <SelectTrigger className="w-full sm:w-[160px] h-9">
                            <SelectValue placeholder="All Roles" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Roles</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="editor">Editor</SelectItem>
                            <SelectItem value="company">Company</SelectItem>
                            <SelectItem value="public">Public</SelectItem>
                        </SelectContent>
                    </Select>

                    {hasActiveFilters && (
                        <Button variant="ghost" size="sm" className="h-9 text-muted-foreground hover:text-foreground" onClick={() => { setSearch(''); applyFilters({ search: '', role: '' }); }}>
                            <X className="w-3.5 h-3.5 mr-1" /> Clear
                        </Button>
                    )}
                </div>

                {/* Users Table */}
                <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b border-border/60 bg-muted/40 hover:bg-muted/40">
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">User</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Role</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Company</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Joined</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.data.map(user => {
                                const pill = ROLE_PILL[user.role] ?? ROLE_PILL.public;
                                return (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium text-foreground truncate">{user.name}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize ${pill.class}`}>
                                                {user.role}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {user.company_name ? (
                                                <span className="flex items-center gap-1.5">
                                                    <Building2 className="w-3.5 h-3.5 shrink-0 text-muted-foreground/60" />
                                                    {user.company_name}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground/40">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                            {new Date(user.created_at).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-40">
                                                    <DropdownMenuItem onClick={() => openEdit(user)} className="flex items-center gap-2">
                                                        <Pencil className="w-3.5 h-3.5" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                                                        onClick={() => setDeleteTarget(user)}
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {users.data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-16 text-muted-foreground">
                                        <Users className="w-12 h-12 mx-auto mb-3 opacity-15" />
                                        <p className="font-medium">{hasActiveFilters ? 'No users match the current filters.' : 'No users found.'}</p>
                                        {hasActiveFilters && (
                                            <Button variant="link" size="sm" className="mt-2 text-primary" onClick={() => { setSearch(''); applyFilters({ search: '', role: '' }); }}>
                                                Clear all filters
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    {/* Pagination Footer */}
                    {users.last_page > 1 && (
                        <>
                            <Separator />
                            <div className="flex items-center justify-between px-4 py-3">
                                <p className="text-sm text-muted-foreground">
                                    Showing <span className="font-medium text-foreground">{users.from}</span> to <span className="font-medium text-foreground">{users.to}</span> of <span className="font-medium text-foreground">{users.total}</span>
                                </p>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">
                                        Page {users.current_page} of {users.last_page}
                                    </span>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={users.current_page <= 1} asChild={users.current_page > 1}>
                                            {users.current_page > 1 ? (
                                                <Link href={users.links[0]?.url ?? '#'} preserveState preserveScroll><ChevronLeft className="w-4 h-4" /></Link>
                                            ) : (
                                                <span><ChevronLeft className="w-4 h-4" /></span>
                                            )}
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={users.current_page >= users.last_page} asChild={users.current_page < users.last_page}>
                                            {users.current_page < users.last_page ? (
                                                <Link href={users.links[users.links.length - 1]?.url ?? '#'} preserveState preserveScroll><ChevronRight className="w-4 h-4" /></Link>
                                            ) : (
                                                <span><ChevronRight className="w-4 h-4" /></span>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Create / Edit User Modal */}
            <Dialog open={formOpen} onOpenChange={open => { if (!open) closeForm(); }}>
                <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {editingUser ? <Pencil className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
                            {editingUser ? 'Edit User' : 'New User'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingUser ? `Update details for ${editingUser.name}` : 'Create a new user account'}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleFormSubmit} className="space-y-5 mt-1">
                        {/* Account Information */}
                        <div>
                            <p className="text-[11px] font-bold uppercase text-primary tracking-widest mb-3">Account Information</p>
                            <div className="space-y-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="modal-name">Full Name</Label>
                                    <Input
                                        id="modal-name"
                                        value={form.data.name}
                                        onChange={e => form.setData('name', e.target.value)}
                                        required
                                    />
                                    <InputError message={form.errors.name} />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="modal-email">Email</Label>
                                    <Input
                                        id="modal-email"
                                        type="email"
                                        value={form.data.email}
                                        onChange={e => form.setData('email', e.target.value)}
                                        required
                                    />
                                    <InputError message={form.errors.email} />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="modal-password">
                                        Password
                                        {editingUser && <span className="text-muted-foreground text-xs ml-1">(leave blank to keep current)</span>}
                                    </Label>
                                    <Input
                                        id="modal-password"
                                        type="password"
                                        value={form.data.password}
                                        onChange={e => form.setData('password', e.target.value)}
                                        required={!editingUser}
                                        autoComplete="new-password"
                                    />
                                    <InputError message={form.errors.password} />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="modal-role">Role</Label>
                                    <Select value={form.data.role} onValueChange={val => form.setData('role', val as typeof form.data.role)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="admin">Admin</SelectItem>
                                            <SelectItem value="editor">Editor</SelectItem>
                                            <SelectItem value="company">Company</SelectItem>
                                            <SelectItem value="public">Public</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={form.errors.role} />
                                </div>
                            </div>
                        </div>

                        {/* Company Details — only when role is company */}
                        {form.data.role === 'company' && (
                            <>
                                <Separator />
                                <div>
                                    <p className="text-[11px] font-bold uppercase text-primary tracking-widest mb-3">Company Details</p>
                                    <div className="space-y-3">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="modal-company_name">Company Name</Label>
                                            <Input
                                                id="modal-company_name"
                                                value={form.data.company_name}
                                                onChange={e => form.setData('company_name', e.target.value)}
                                                required
                                            />
                                            <InputError message={form.errors.company_name} />
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label htmlFor="modal-company_registration_no">Registration Number</Label>
                                            <Input
                                                id="modal-company_registration_no"
                                                value={form.data.company_registration_no}
                                                onChange={e => form.setData('company_registration_no', e.target.value)}
                                                placeholder="e.g. 202001012345"
                                            />
                                            <InputError message={form.errors.company_registration_no} />
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label htmlFor="modal-company_address">Address</Label>
                                            <textarea
                                                id="modal-company_address"
                                                value={form.data.company_address}
                                                onChange={e => form.setData('company_address', e.target.value)}
                                                rows={3}
                                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            />
                                            <InputError message={form.errors.company_address} />
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label htmlFor="modal-company_phone">Phone</Label>
                                            <Input
                                                id="modal-company_phone"
                                                value={form.data.company_phone}
                                                onChange={e => form.setData('company_phone', e.target.value)}
                                                placeholder="e.g. 03-1234 5678"
                                            />
                                            <InputError message={form.errors.company_phone} />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        <DialogFooter className="gap-2 sm:gap-0 pt-2">
                            <Button type="button" variant="outline" onClick={closeForm}>Cancel</Button>
                            <Button type="submit" disabled={form.processing}>
                                {form.processing ? 'Saving…' : editingUser ? 'Update User' : 'Create User'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete confirmation dialog */}
            <Dialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                            <Trash2 className="w-5 h-5" /> Delete User
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong className="text-foreground">{deleteTarget?.name}</strong>? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete}>
                            <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
