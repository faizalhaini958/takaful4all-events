import AdminLayout from '@/Layouts/AdminLayout';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { type PaginatedData } from '@/types';
import { roleBadge } from '@/lib/status-colors';

interface UserRow {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'editor' | 'company' | 'public';
    company_name: string | null;
    created_at: string;
}

interface Props {
    users: PaginatedData<UserRow>;
    filters: {
        role: string;
        search: string;
    };
}

export default function UsersIndex({ users, filters }: Props) {
    const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
    const [search, setSearch] = useState(filters.search);

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

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-foreground">Users</h1>
                    <Button asChild className="bg-brand hover:bg-brand-dark">
                        <Link href="/admin/users/create">+ New User</Link>
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <form onSubmit={handleSearch} className="flex gap-2 flex-1">
                        <Input
                            placeholder="Search name, email, or company..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="max-w-sm"
                        />
                        <Button type="submit" variant="outline" size="sm">Search</Button>
                    </form>
                    <Select
                        value={filters.role || 'all'}
                        onValueChange={val => applyFilters({ role: val === 'all' ? '' : val })}
                    >
                        <SelectTrigger className="w-[160px]">
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
                </div>

                <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Company</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.data.map(user => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.name}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={roleBadge(user.role).variant}
                                            className={roleBadge(user.role).className}
                                        >
                                            {user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {user.company_name ?? '—'}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {new Date(user.created_at).toLocaleDateString('en-MY')}
                                    </TableCell>
                                    <TableCell className="text-right space-x-3">
                                        <Link
                                            href={`/admin/users/${user.id}/edit`}
                                            className="text-sm text-brand-navy hover:underline"
                                        >
                                            Edit
                                        </Link>
                                        <button
                                            onClick={() => setDeleteTarget(user)}
                                            className="text-sm text-red-600 hover:underline"
                                        >
                                            Delete
                                        </button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {users.data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        No users found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {users.last_page > 1 && (
                    <div className="flex justify-center gap-1">
                        {users.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url ?? '#'}
                                className={`px-3 py-1 rounded text-sm border ${
                                    link.active
                                        ? 'bg-brand text-white border-brand'
                                        : 'bg-card text-foreground border-border hover:bg-accent'
                                } ${!link.url ? 'opacity-50 pointer-events-none' : ''}`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Delete confirmation dialog */}
            <Dialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete User</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be undone.
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
