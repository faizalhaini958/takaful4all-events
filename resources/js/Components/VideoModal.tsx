import { useEffect } from 'react';
import { X } from 'lucide-react';
import { type Post } from '@/types';

interface Props {
    post: Post | null;
    onClose: () => void;
}

/** Convert any YouTube URL variant into an embed URL */
function toEmbedUrl(url: string): string {
    try {
        const u = new URL(url);
        // Already an embed URL
        if (u.pathname.startsWith('/embed/')) return url;
        // youtu.be/VIDEO_ID
        if (u.hostname === 'youtu.be') {
            return `https://www.youtube.com/embed${u.pathname}?autoplay=1&rel=0`;
        }
        // youtube.com/watch?v=VIDEO_ID
        const v = u.searchParams.get('v');
        if (v) return `https://www.youtube.com/embed/${v}?autoplay=1&rel=0`;
    } catch {
        // fallback — return as-is
    }
    return url;
}

export default function VideoModal({ post, onClose }: Props) {
    // Close on Escape
    useEffect(() => {
        if (!post) return;
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [post, onClose]);

    // Prevent body scroll while open
    useEffect(() => {
        document.body.style.overflow = post ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [post]);

    if (!post) return null;

    const embedUrl = post.embed_url ? toEmbedUrl(post.embed_url) : null;

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label={post.title}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="relative z-10 w-full max-w-4xl">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute -top-10 right-0 text-white/80 hover:text-white transition-colors"
                    aria-label="Close video"
                >
                    <X className="w-7 h-7" />
                </button>

                {/* Video container — 16:9 */}
                <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                    {embedUrl ? (
                        <iframe
                            className="absolute inset-0 w-full h-full rounded-t-xl"
                            src={embedUrl}
                            title={post.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-black rounded-t-xl text-white/50">
                            No video URL available.
                        </div>
                    )}
                </div>

                {/* Title & description */}
                <div className="bg-white rounded-b-xl px-5 py-4">
                    <h2 className="text-base font-bold text-gray-900 leading-snug">{post.title}</h2>
                    {post.excerpt && (
                        <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">{post.excerpt}</p>
                    )}
                </div>
            </div>
        </div>
    );
}
