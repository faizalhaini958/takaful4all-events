import AdminLayout from '@/Layouts/AdminLayout';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { type Page, type PaginatedData } from '@/types';

interface Props {
    pages: PaginatedData<Page>;
}

export default function PagesIndex({ pages }: Props) {
    const [deleteTarget, setDeleteTarget] = useState<Page | null>(null);

    function confirmDelete() {
        if (!deleteTarget) return;
        router.delete(`/admin/pages/${deleteTarget.slug}`, {
            onFinish: () => setDeleteTarget(null),
        });
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-foreground">Pages</h1>
                    <Button asChild className="bg-brand hover:bg-brand-dark">
                        <Link href="/admin/pages/create">+ New Page</Link>
                    </Button>
                </div>

                <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Slug</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Updated</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pages.data.map(page => (
                                <TableRow key={page.id}>
                                    <TableCell className="font-medium">{page.title}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground font-mono">{page.slug}</TableCell>
                                    <TableCell>
                                        <Badge variant={page.is_published ? 'default' : 'outline'}>
                                            {page.is_published ? 'Published' : 'Draft'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {new Date(page.updated_at).toLocaleDateString('en-MY')}
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Link
                                            href={`/admin/pages/${page.slug}/edit`}
                                            className="text-sm text-brand-navy hover:underline"
                                        >
                                            Edit
                                        </Link>
                                        <button
                                            onClick={() => setDeleteTarget(page)}
                                            className="text-sm text-red-600 hover:underline"
                                        >
                                            Delete
                                        </button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {pages.data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No pages found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {pages.last_page > 1 && (
                    <div className="flex justify-center gap-1">
                        {pages.links.map((link, i) => (
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

            <Dialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Page</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{deleteTarget?.title}"? This action cannot be undone.
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
