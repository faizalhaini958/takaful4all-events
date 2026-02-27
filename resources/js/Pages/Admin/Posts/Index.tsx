import AdminLayout from '@/Layouts/AdminLayout';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { type Post, type PaginatedData } from '@/types';

interface Props {
    posts:       PaginatedData<Post>;
    activeType:  string;
}

const TYPE_BADGE: Record<string, 'default' | 'secondary' | 'outline'> = {
    podcast:  'default',
    webinar:  'secondary',
    article:  'outline',
    agent360: 'secondary',
};

export default function PostsIndex({ posts, activeType }: Props) {
    const [deleteTarget, setDeleteTarget]   = useState<Post | null>(null);
    const [duplicating, setDuplicating]     = useState<string | null>(null);

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
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-foreground">Posts</h1>
                    <Button asChild className="bg-brand hover:bg-brand-dark">
                        <Link href="/admin/posts/create">+ New Post</Link>
                    </Button>
                </div>

                <Tabs value={activeType || 'all'} onValueChange={changeType}>
                    <TabsList>
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="podcast">Podcasts</TabsTrigger>
                        <TabsTrigger value="webinar">Webinars</TabsTrigger>
                        <TabsTrigger value="article">Articles</TabsTrigger>
                        <TabsTrigger value="agent360">Agent360</TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Published</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {posts.data.map(post => (
                                <TableRow key={post.id}>
                                    <TableCell className="font-medium max-w-xs truncate">{post.title}</TableCell>
                                    <TableCell>
                                        <Badge variant={TYPE_BADGE[post.type] ?? 'outline'}>
                                            {post.type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={post.is_published ? 'default' : 'outline'}>
                                            {post.is_published ? 'Published' : 'Draft'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {post.published_at ? new Date(post.published_at).toLocaleDateString('en-MY') : '—'}
                                    </TableCell>
                                    <TableCell className="text-right space-x-3">
                                        <Link
                                            href={`/admin/posts/${post.slug}/edit`}
                                            className="text-sm text-brand-navy hover:underline"
                                        >
                                            Edit
                                        </Link>
                                        <button
                                            onClick={() => duplicatePost(post)}
                                            disabled={duplicating === post.slug}
                                            className="text-sm text-amber-600 hover:underline disabled:opacity-50"
                                        >
                                            {duplicating === post.slug ? 'Duplicating…' : 'Duplicate'}
                                        </button>
                                        <button
                                            onClick={() => setDeleteTarget(post)}
                                            className="text-sm text-red-600 hover:underline"
                                        >
                                            Delete
                                        </button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {posts.data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No posts found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {posts.last_page > 1 && (
                    <div className="flex justify-center gap-1">
                        {posts.links.map((link, i) => (
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
                        <DialogTitle>Delete Post</DialogTitle>
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
