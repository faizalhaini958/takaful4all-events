import AdminLayout from '@/Layouts/AdminLayout';
import PostForm, { toEmbedUrl } from '@/Components/PostForm';
import { Button } from '@/Components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Separator } from '@/Components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/Components/ui/dropdown-menu';
import { Link, router, useForm } from '@inertiajs/react';
import { useState, type FormEventHandler } from 'react';
import { type Post, type PaginatedData, type Media } from '@/types';
import { Plus, MoreHorizontal, Pencil, Trash2, Copy, Eye, Globe, Mic, MonitorPlay, FileText, Target, ChevronLeft, ChevronRight, Newspaper } from 'lucide-react';
import type { PostFormData } from '@/Components/PostForm';

interface Props {
    posts: PaginatedData<Post>;
    activeType: string;
}

const TYPE_PILL: Record<string, { class: string; icon: typeof Mic; label: string }> = {
    podcast:  { class: 'bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30', icon: Mic,          label: 'Podcast' },
    webinar:  { class: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30',             icon: MonitorPlay,   label: 'Webinar' },
    article:  { class: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30', icon: FileText,  label: 'Article' },
    agent360: { class: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',     icon: Target,        label: 'Agent360' },
};

const TYPES = ['all', 'podcast', 'webinar', 'article', 'agent360'] as const;

const EMPTY_FORM: PostFormData = {
    type: 'podcast',
    title: '',
    slug: '',
    excerpt: '',
    content_html: '',
    embed_url: '',
    published_at: '',
    is_published: '1',
    media_id: '',
};

function toDatetimeLocal(val: string | null): string {
    if (!val) return '';
    return val.length > 16 ? val.slice(0, 16) : val;
}

export default function PostsIndex({ posts, activeType }: Props) {
    const [deleteTarget, setDeleteTarget] = useState<Post | null>(null);
    const [duplicating, setDuplicating] = useState<string | null>(null);
    const [formOpen, setFormOpen] = useState(false);
    const [editingPost, setEditingPost] = useState<Post | null>(null);

    const form = useForm<PostFormData>({ ...EMPTY_FORM });

    function openCreate() {
        setEditingPost(null);
        form.reset();
        form.clearErrors();
        setFormOpen(true);
    }

    function openEdit(post: Post) {
        setEditingPost(post);
        form.setData({
            type: post.type as PostFormData['type'],
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt ?? '',
            content_html: post.content_html ?? '',
            embed_url: toEmbedUrl(post.embed_url ?? ''),
            published_at: toDatetimeLocal(post.published_at),
            is_published: post.is_published ? '1' : '0',
            media_id: post.media_id ? String(post.media_id) : 'none',
        });
        form.clearErrors();
        setFormOpen(true);
    }

    function closeForm() {
        setFormOpen(false);
        setEditingPost(null);
    }

    const handleFormSubmit: FormEventHandler = e => {
        e.preventDefault();
        if (editingPost) {
            form.put(`/admin/posts/${editingPost.slug}`, {
                onSuccess: () => closeForm(),
                preserveScroll: true,
            });
        } else {
            form.post('/admin/posts', {
                onSuccess: () => closeForm(),
                preserveScroll: true,
            });
        }
    };

    function confirmDelete() {
        if (!deleteTarget) return;
        router.delete(`/admin/posts/${deleteTarget.slug}`, {
            onFinish: () => setDeleteTarget(null),
        });
    }

    function duplicatePost(post: Post) {
        setDuplicating(post.slug);
        router.post(`/admin/posts/${post.slug}/duplicate`, {}, {
            onFinish: () => setDuplicating(null),
        });
    }

    function changeType(type: string) {
        router.get('/admin/posts', type === 'all' ? {} : { type }, { preserveState: true, replace: true });
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Posts</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">{posts.total} post{posts.total !== 1 && 's'} total</p>
                    </div>
                    <Button size="sm" onClick={openCreate}>
                        <Plus className="w-4 h-4 mr-1.5" /> New Post
                    </Button>
                </div>

                {/* Type Tabs */}
                <div className="flex flex-wrap gap-2">
                    {TYPES.map(type => {
                        const isActive = (activeType || 'all') === type;
                        if (type === 'all') {
                            return (
                                <button
                                    key={type}
                                    onClick={() => changeType('all')}
                                    className={`inline-flex items-center rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${
                                        isActive
                                            ? 'border-primary bg-primary text-primary-foreground'
                                            : 'border-border/60 bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
                                    }`}
                                >
                                    All
                                </button>
                            );
                        }
                        const pill = TYPE_PILL[type];
                        const Icon = pill.icon;
                        return (
                            <button
                                key={type}
                                onClick={() => changeType(type)}
                                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${
                                    isActive
                                        ? `${pill.class} ring-2 ring-offset-1 ring-offset-background ring-current/20`
                                        : 'border-border/60 bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
                                }`}
                            >
                                <Icon className="w-3.5 h-3.5" /> {pill.label}
                            </button>
                        );
                    })}
                </div>

                {/* Posts Table */}
                <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b border-border/60 bg-muted/40 hover:bg-muted/40">
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Post</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Published</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {posts.data.map(post => {
                                const typePill = TYPE_PILL[post.type] ?? TYPE_PILL.article;
                                const TypeIcon = typePill.icon;
                                return (
                                    <TableRow key={post.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                {post.media ? (
                                                    <img src={post.media.thumbnail_url ?? post.media.url} alt={post.title} className="w-10 h-10 rounded-lg object-cover border border-border/40 shrink-0" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-lg bg-muted/60 flex items-center justify-center shrink-0">
                                                        <TypeIcon className="w-4 h-4 text-muted-foreground/50" />
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <p className="font-medium text-foreground truncate max-w-xs">{post.title}</p>
                                                    {post.excerpt && (
                                                        <p className="text-xs text-muted-foreground truncate max-w-xs mt-0.5">{post.excerpt}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${typePill.class}`}>
                                                <TypeIcon className="w-3 h-3" /> {typePill.label}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {post.is_published ? (
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
                                            {post.published_at
                                                ? new Date(post.published_at).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })
                                                : <span className="text-muted-foreground/40">—</span>}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-44">
                                                    <DropdownMenuItem onClick={() => openEdit(post)} className="flex items-center gap-2">
                                                        <Pencil className="w-3.5 h-3.5" /> Edit
                                                    </DropdownMenuItem>
                                                    {post.is_published && (
                                                        <DropdownMenuItem asChild>
                                                            <a href={`/posts/${post.slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                                                                <Eye className="w-3.5 h-3.5" /> View on Site
                                                            </a>
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem
                                                        onClick={() => duplicatePost(post)}
                                                        disabled={duplicating === post.slug}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <Copy className="w-3.5 h-3.5" /> {duplicating === post.slug ? 'Duplicating…' : 'Duplicate'}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                                                        onClick={() => setDeleteTarget(post)}
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {posts.data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-16 text-muted-foreground">
                                        <Newspaper className="w-12 h-12 mx-auto mb-3 opacity-15" />
                                        <p className="font-medium">No posts found.</p>
                                        <Button variant="link" size="sm" className="mt-2 text-primary" onClick={openCreate}>
                                            Create your first post
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    {/* Pagination Footer */}
                    {posts.last_page > 1 && (
                        <>
                            <Separator />
                            <div className="flex items-center justify-between px-4 py-3">
                                <p className="text-sm text-muted-foreground">
                                    Showing <span className="font-medium text-foreground">{posts.from}</span> to <span className="font-medium text-foreground">{posts.to}</span> of <span className="font-medium text-foreground">{posts.total}</span>
                                </p>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">
                                        Page {posts.current_page} of {posts.last_page}
                                    </span>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={posts.current_page <= 1} asChild={posts.current_page > 1}>
                                            {posts.current_page > 1 ? (
                                                <Link href={posts.links[0]?.url ?? '#'} preserveState preserveScroll><ChevronLeft className="w-4 h-4" /></Link>
                                            ) : (
                                                <span><ChevronLeft className="w-4 h-4" /></span>
                                            )}
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={posts.current_page >= posts.last_page} asChild={posts.current_page < posts.last_page}>
                                            {posts.current_page < posts.last_page ? (
                                                <Link href={posts.links[posts.links.length - 1]?.url ?? '#'} preserveState preserveScroll><ChevronRight className="w-4 h-4" /></Link>
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

            {/* Create / Edit Post Modal */}
            <Dialog open={formOpen} onOpenChange={open => { if (!open) closeForm(); }}>
                <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {editingPost ? <Pencil className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
                            {editingPost ? 'Edit Post' : 'New Post'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingPost ? `Update "${editingPost.title}"` : 'Create a new post'}
                        </DialogDescription>
                    </DialogHeader>

                    <PostForm
                        data={form.data}
                        errors={form.errors}
                        processing={form.processing}
                        setData={form.setData}
                        onSubmit={handleFormSubmit}
                        submitLabel={editingPost ? 'Update Post' : 'Create Post'}
                        currentMedia={editingPost?.media}
                        postSlug={editingPost?.slug}
                        onCancel={closeForm}
                    />
                </DialogContent>
            </Dialog>

            {/* Delete confirmation dialog */}
            <Dialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                            <Trash2 className="w-5 h-5" /> Delete Post
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
