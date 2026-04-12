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
import RichEditor from '@/Components/RichEditor';
import { Link, router, useForm } from '@inertiajs/react';
import { useState, type FormEventHandler } from 'react';
import { type Page, type PaginatedData } from '@/types';
import { FileText, Plus, MoreHorizontal, Pencil, Trash2, Eye, ExternalLink, ChevronLeft, ChevronRight, Globe, FileX } from 'lucide-react';

interface Props {
    pages: PaginatedData<Page>;
}

const EMPTY_FORM: {
    title: string;
    slug: string;
    content_html: string;
    is_published: string;
} = {
    title: '',
    slug: '',
    content_html: '',
    is_published: '1',
};

function generateSlug(value: string) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

export default function PagesIndex({ pages }: Props) {
    const [deleteTarget, setDeleteTarget] = useState<Page | null>(null);
    const [formOpen, setFormOpen] = useState(false);
    const [editingPage, setEditingPage] = useState<Page | null>(null);

    const form = useForm({ ...EMPTY_FORM });

    function openCreate() {
        setEditingPage(null);
        form.reset();
        form.clearErrors();
        setFormOpen(true);
    }

    function openEdit(page: Page) {
        setEditingPage(page);
        form.setData({
            title: page.title,
            slug: page.slug,
            content_html: page.content_html ?? '',
            is_published: page.is_published ? '1' : '0',
        });
        form.clearErrors();
        setFormOpen(true);
    }

    function closeForm() {
        setFormOpen(false);
        setEditingPage(null);
    }

    const handleFormSubmit: FormEventHandler = e => {
        e.preventDefault();
        if (editingPage) {
            form.put(`/admin/pages/${editingPage.slug}`, {
                onSuccess: () => closeForm(),
                preserveScroll: true,
            });
        } else {
            form.post('/admin/pages', {
                onSuccess: () => closeForm(),
                preserveScroll: true,
            });
        }
    };

    function confirmDelete() {
        if (!deleteTarget) return;
        router.delete(`/admin/pages/${deleteTarget.slug}`, {
            onFinish: () => setDeleteTarget(null),
        });
    }

    const publishedCount = pages.data.filter(p => p.is_published).length;
    const draftCount = pages.data.filter(p => !p.is_published).length;

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Pages</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">{pages.total} page{pages.total !== 1 && 's'} total</p>
                    </div>
                    <Button size="sm" onClick={openCreate}>
                        <Plus className="w-4 h-4 mr-1.5" /> New Page
                    </Button>
                </div>

                {/* Pages Table */}
                <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b border-border/60 bg-muted/40 hover:bg-muted/40">
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Page</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Slug</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Updated</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pages.data.map(page => (
                                <TableRow key={page.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 shrink-0">
                                                <FileText className="w-4 h-4 text-primary" />
                                            </div>
                                            <span className="font-medium text-foreground">{page.title}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <code className="text-xs font-mono text-muted-foreground bg-muted/60 px-2 py-0.5 rounded">/{page.slug}</code>
                                    </TableCell>
                                    <TableCell>
                                        {page.is_published ? (
                                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                                <Globe className="w-3 h-3" /> Published
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                                                Draft
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                        {new Date(page.updated_at).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-44">
                                                <DropdownMenuItem onClick={() => openEdit(page)} className="flex items-center gap-2">
                                                    <Pencil className="w-3.5 h-3.5" /> Edit
                                                </DropdownMenuItem>
                                                {page.is_published && (
                                                    <DropdownMenuItem asChild>
                                                        <a href={`/${page.slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                                                            <ExternalLink className="w-3.5 h-3.5" /> View Public Page
                                                        </a>
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                                                    onClick={() => setDeleteTarget(page)}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {pages.data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-16 text-muted-foreground">
                                        <FileX className="w-12 h-12 mx-auto mb-3 opacity-15" />
                                        <p className="font-medium">No pages yet.</p>
                                        <Button variant="link" size="sm" className="mt-2 text-primary" onClick={openCreate}>
                                            Create your first page
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    {/* Pagination Footer */}
                    {pages.last_page > 1 && (
                        <>
                            <Separator />
                            <div className="flex items-center justify-between px-4 py-3">
                                <p className="text-sm text-muted-foreground">
                                    Showing <span className="font-medium text-foreground">{pages.from}</span> to <span className="font-medium text-foreground">{pages.to}</span> of <span className="font-medium text-foreground">{pages.total}</span>
                                </p>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">
                                        Page {pages.current_page} of {pages.last_page}
                                    </span>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={pages.current_page <= 1} asChild={pages.current_page > 1}>
                                            {pages.current_page > 1 ? (
                                                <Link href={pages.links[0]?.url ?? '#'} preserveState preserveScroll><ChevronLeft className="w-4 h-4" /></Link>
                                            ) : (
                                                <span><ChevronLeft className="w-4 h-4" /></span>
                                            )}
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={pages.current_page >= pages.last_page} asChild={pages.current_page < pages.last_page}>
                                            {pages.current_page < pages.last_page ? (
                                                <Link href={pages.links[pages.links.length - 1]?.url ?? '#'} preserveState preserveScroll><ChevronRight className="w-4 h-4" /></Link>
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

            {/* Create / Edit Page Modal */}
            <Dialog open={formOpen} onOpenChange={open => { if (!open) closeForm(); }}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {editingPage ? <Pencil className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
                            {editingPage ? 'Edit Page' : 'New Page'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingPage ? `Update "${editingPage.title}"` : 'Create a new page for your site'}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleFormSubmit} className="space-y-5 mt-1">
                        <div>
                            <p className="text-[11px] font-bold uppercase text-primary tracking-widest mb-3">Page Details</p>
                            <div className="space-y-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="modal-title">Title</Label>
                                    <Input
                                        id="modal-title"
                                        value={form.data.title}
                                        onChange={e => {
                                            form.setData('title', e.target.value);
                                            if (!editingPage) {
                                                form.setData('slug', generateSlug(e.target.value));
                                            }
                                        }}
                                        required
                                    />
                                    <InputError message={form.errors.title} />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="modal-slug">Slug</Label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">/</span>
                                        <Input
                                            id="modal-slug"
                                            value={form.data.slug}
                                            onChange={e => form.setData('slug', e.target.value)}
                                            className="font-mono text-sm"
                                        />
                                    </div>
                                    <InputError message={form.errors.slug} />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="modal-status">Status</Label>
                                    <Select value={form.data.is_published} onValueChange={v => form.setData('is_published', v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">Published</SelectItem>
                                            <SelectItem value="0">Draft</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        <div>
                            <p className="text-[11px] font-bold uppercase text-primary tracking-widest mb-3">Content</p>
                            <RichEditor
                                value={form.data.content_html}
                                onChange={v => form.setData('content_html', v)}
                                placeholder="Write page content…"
                            />
                            <InputError message={form.errors.content_html} />
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0 pt-2">
                            <Button type="button" variant="outline" onClick={closeForm}>Cancel</Button>
                            <Button type="submit" disabled={form.processing}>
                                {form.processing ? 'Saving…' : editingPage ? 'Update Page' : 'Create Page'}
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
                            <Trash2 className="w-5 h-5" /> Delete Page
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong className="text-foreground">{deleteTarget?.title}</strong>? This action cannot be undone.
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
