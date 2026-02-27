import { useRef, useState, useCallback } from 'react';
import axios from 'axios';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { type Media } from '@/types';

interface Props {
    /** Currently selected media (from DB) — shown as initial preview */
    value: string;           // media_id as string, '' or 'none' = unset
    currentMedia?: Media | null;
    onChange: (mediaId: string, media: Pick<Media, 'id' | 'url' | 'title'>) => void;
    onClear: () => void;
}

export default function ImageUpload({ value, currentMedia, onChange, onClear }: Props) {
    const inputRef  = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(currentMedia?.url ?? null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);

    const upload = useCallback(async (file: File) => {
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError('File must be smaller than 5 MB.');
            return;
        }

        setError(null);
        setUploading(true);

        // Optimistic local preview
        const reader = new FileReader();
        reader.onload = e => setPreview(e.target?.result as string);
        reader.readAsDataURL(file);

        try {
            const form = new FormData();
            form.append('file', file);

            const { data } = await axios.post<{ media: Pick<Media, 'id' | 'url' | 'title'> }>(
                '/admin/media',
                form,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );

            setPreview(data.media.url);
            onChange(String(data.media.id), data.media);
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })
                ?.response?.data?.message ?? 'Upload failed. Please try again.';
            setError(msg);
            setPreview(currentMedia?.url ?? null);
        } finally {
            setUploading(false);
        }
    }, [currentMedia, onChange]);

    const handleFile = (files: FileList | null) => {
        if (files?.[0]) upload(files[0]);
    };

    const clear = () => {
        setPreview(null);
        setError(null);
        if (inputRef.current) inputRef.current.value = '';
        onClear();
    };

    return (
        <div className="space-y-2">
            {preview ? (
                /* ── Preview ── */
                <div className="relative group rounded-xl overflow-hidden border border-input bg-gray-50" style={{ aspectRatio: '16/9' }}>
                    <img src={preview} alt="Featured" className="w-full h-full object-cover" />
                    {uploading && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                        </div>
                    )}
                    {!uploading && (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                            <button
                                type="button"
                                onClick={() => inputRef.current?.click()}
                                className="bg-white text-gray-900 font-semibold text-xs px-3 py-1.5 rounded-lg shadow hover:bg-gray-50 transition-colors"
                            >
                                Change
                            </button>
                            <button
                                type="button"
                                onClick={clear}
                                className="bg-white text-red-600 font-semibold text-xs px-3 py-1.5 rounded-lg shadow hover:bg-red-50 transition-colors flex items-center gap-1"
                            >
                                <X className="w-3.5 h-3.5" /> Remove
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                /* ── Drop zone ── */
                <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files); }}
                    onClick={() => inputRef.current?.click()}
                    className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-colors flex flex-col items-center justify-center gap-3 py-10 ${
                        dragOver
                            ? 'border-brand bg-brand-light/30'
                            : 'border-gray-300 hover:border-brand bg-gray-50 hover:bg-brand-light/10'
                    }`}
                >
                    {uploading ? (
                        <Loader2 className="w-8 h-8 text-brand animate-spin" />
                    ) : (
                        <>
                            <div className="w-12 h-12 rounded-full bg-brand-light flex items-center justify-center">
                                <ImageIcon className="w-6 h-6 text-brand" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-semibold text-gray-700">
                                    <span className="text-brand">Click to upload</span> or drag &amp; drop
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">PNG, JPG, WebP — max 5 MB</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Upload className="w-4 h-4 text-gray-400" />
                                <span className="text-xs text-gray-400">Recommended: 1920 × 1080 px</span>
                            </div>
                        </>
                    )}
                </div>
            )}

            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => handleFile(e.target.files)}
            />

            {error && (
                <p className="text-sm text-red-600 flex items-center gap-1.5">
                    <X className="w-3.5 h-3.5 flex-shrink-0" /> {error}
                </p>
            )}
        </div>
    );
}
