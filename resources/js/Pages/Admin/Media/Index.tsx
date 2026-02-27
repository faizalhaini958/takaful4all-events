import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/Components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { router } from '@inertiajs/react';
import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { type Media, type PaginatedData } from '@/types';

interface Props {
    media: PaginatedData<Media>;
}

export default function MediaIndex({ media }: Props) {
    const [deleteTarget, setDeleteTarget] = useState<Media | null>(null);
    const [uploading, setUploading]       = useState(false);
    const [dragOver, setDragOver]         = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    function uploadFiles(files: FileList | null) {
        if (!files || files.length === 0) return;
        setUploading(true);

        const form = new FormData();
        Array.from(files).forEach(f => form.append('file', f));

        router.post('/admin/media', form, {
            forceFormData: true,
            onFinish: () => setUploading(false),
        });
    }

    function handleFileInput(e: ChangeEvent<HTMLInputElement>) {
        uploadFiles(e.target.files);
        e.target.value = '';
    }

    function handleDrop(e: DragEvent) {
        e.preventDefault();
        setDragOver(false);
        uploadFiles(e.dataTransfer.files);
    }

    function copyUrl(url: string) {
        navigator.clipboard.writeText(url);
    }

    function confirmDelete() {
        if (!deleteTarget) return;
        router.delete(`/admin/media/${deleteTarget.id}`, {
            onFinish: () => setDeleteTarget(null),
        });
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-foreground">Media Library</h1>
                    <Button
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                        className="bg-brand hover:bg-brand-dark"
                    >
                        {uploading ? 'Uploading…' : '+ Upload'}
                    </Button>
                    <input
                        ref={fileRef}
                        type="file"
                        className="hidden"
                        multiple
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleFileInput}
                    />
                </div>

                {/* Drop zone */}
                <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                        dragOver ? 'border-brand bg-brand-light/30' : 'border-border'
                    }`}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                >
                    <p className="text-muted-foreground">Drag & drop images here, or click <strong>+ Upload</strong></p>
                    <p className="text-xs text-muted-foreground mt-1">JPEG, PNG, WebP — max 5 MB each</p>
                </div>

                {/* Image grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {media.data.map(item => (
                        <div key={item.id} className="group relative rounded-lg overflow-hidden border border-border bg-card shadow-sm">
                            <img
                                src={item.url}
                                alt={item.alt ?? item.title ?? ''}
                                className="w-full aspect-square object-cover"
                            />
                            <div className="p-2 space-y-1">
                                <p className="text-xs text-muted-foreground truncate">{item.title ?? item.url.split('/').pop()}</p>
                                <p className="text-xs text-muted-foreground">{item.width}×{item.height}</p>
                            </div>
                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                                <button
                                    onClick={() => copyUrl(item.url)}
                                    className="w-full text-xs bg-card text-foreground rounded px-2 py-1 hover:bg-muted"
                                >
                                    Copy URL
                                </button>
                                <button
                                    onClick={() => setDeleteTarget(item)}
                                    className="w-full text-xs bg-red-600 text-white rounded px-2 py-1 hover:bg-red-700"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                    {media.data.length === 0 && (
                        <div className="col-span-full text-center py-12 text-muted-foreground">
                            No media files yet.
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {media.last_page > 1 && (
                    <div className="flex justify-center gap-1">
                        {media.links.map((link, i) => (
                            <a
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
                        <DialogTitle>Delete Media</DialogTitle>
                        <DialogDescription>
                            This will permanently delete the file from storage. Any content using this image
                            may break. Are you sure?
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
