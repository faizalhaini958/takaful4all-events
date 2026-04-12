import { useCallback, useState } from 'react';
import axios from 'axios';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Link } from '@inertiajs/react';
import { Eye } from 'lucide-react';
import RichEditor from '@/Components/RichEditor';
import ImageUpload from '@/Components/ImageUpload';
import { type Media } from '@/types';

export interface PostFormData {
    type:         'podcast' | 'webinar' | 'article' | 'agent360';
    title:        string;
    slug:         string;
    excerpt:      string;
    content_html: string;
    embed_url:    string;
    published_at: string;
    is_published: string;
    media_id:     string;
}

interface Props {
    data:         PostFormData;
    errors:       Partial<Record<keyof PostFormData, string>>;
    processing:   boolean;
    setData:      <K extends keyof PostFormData>(key: K, value: PostFormData[K]) => void;
    onSubmit:     (e: React.FormEvent) => void;
    submitLabel:  string;
    currentMedia?: Media | null;
    postSlug?:   string;
    onCancel?:   () => void;
}

function generateSlug(value: string) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

/** Convert any YouTube watch/share URL to an embeddable URL, leave others unchanged. */
export function toEmbedUrl(url: string): string {
    try {
        const u = new URL(url);
        // https://www.youtube.com/watch?v=ID or ?v=ID&...
        if ((u.hostname === 'www.youtube.com' || u.hostname === 'youtube.com') && u.pathname === '/watch') {
            const id = u.searchParams.get('v');
            if (id) return `https://www.youtube.com/embed/${id}`;
        }
        // https://youtu.be/ID
        if (u.hostname === 'youtu.be') {
            const id = u.pathname.slice(1);
            if (id) return `https://www.youtube.com/embed/${id}`;
        }
        // https://www.youtube.com/shorts/ID
        if ((u.hostname === 'www.youtube.com' || u.hostname === 'youtube.com') && u.pathname.startsWith('/shorts/')) {
            const id = u.pathname.split('/')[2];
            if (id) return `https://www.youtube.com/embed/${id}`;
        }
    } catch {
        // not a valid URL yet — return as-is
    }
    return url;
}

export default function PostForm({
    data,
    errors,
    processing,
    setData,
    onSubmit,
    submitLabel,
    currentMedia,
    postSlug,
    onCancel,
}: Props) {
    const [activeMedia, setActiveMedia]   = useState<Media | null | undefined>(currentMedia);
    const [fetchingThumb, setFetchingThumb] = useState(false);
    const [thumbError, setThumbError]       = useState('');

    function getYouTubeId(url: string): string | null {
        const m = url.match(/youtube\.com\/embed\/([^?&/]+)/);
        return m ? m[1] : null;
    }

    async function useYouTubeThumbnail() {
        const videoId = getYouTubeId(data.embed_url);
        if (!videoId) return;
        setFetchingThumb(true);
        setThumbError('');
        try {
            const thumbUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
            const { data: res } = await axios.post<{ media: Media }>('/admin/media/from-url', { url: thumbUrl });
            setData('media_id', String(res.media.id));
            setActiveMedia(res.media);
        } catch {
            setThumbError('Could not fetch thumbnail. Please upload manually.');
        } finally {
            setFetchingThumb(false);
        }
    }

    const handleTitleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setData('title', e.target.value);
            setData('slug', generateSlug(e.target.value));
        },
        [setData],
    );

    return (
        <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 items-start">

                {/* ── Left column ── */}
                <div className="space-y-6">

                    {/* Post Details */}
                    <Card>
                        <CardHeader><CardTitle>Post Details</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="type">Type *</Label>
                                <Select
                                    value={data.type}
                                    onValueChange={v => setData('type', v as PostFormData['type'])}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="podcast">🎙️ Podcast</SelectItem>
                                        <SelectItem value="webinar">🖥️ Webinar</SelectItem>
                                        <SelectItem value="article">📝 Article</SelectItem>
                                        <SelectItem value="agent360">🎯 Agent360</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.type && <p className="text-sm text-red-600 mt-1">{errors.type}</p>}
                            </div>

                            <div>
                                <Label htmlFor="title">Title *</Label>
                                <Input
                                    id="title"
                                    value={data.title}
                                    onChange={handleTitleChange}
                                    placeholder="eg. Episode 1: The Future of Takaful in Malaysia"
                                    className="mt-1"
                                />
                                {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title}</p>}
                            </div>

                            <div>
                                <Label htmlFor="slug">Slug *</Label>
                                <div className="mt-1 flex rounded-md overflow-hidden border border-input focus-within:ring-2 focus-within:ring-ring bg-white">
                                    <span className="px-3 flex items-center text-xs text-muted-foreground bg-muted border-r border-input whitespace-nowrap">
                                        /posts/
                                    </span>
                                    <input
                                        id="slug"
                                        value={data.slug}
                                        onChange={e => setData('slug', e.target.value)}
                                        className="flex-1 px-3 py-2 text-sm bg-white outline-none"
                                    />
                                </div>
                                {errors.slug && <p className="text-sm text-red-600 mt-1">{errors.slug}</p>}
                            </div>

                            <div>
                                <Label htmlFor="excerpt">Excerpt</Label>
                                <Textarea
                                    id="excerpt"
                                    value={data.excerpt}
                                    onChange={e => setData('excerpt', e.target.value)}
                                    rows={3}
                                    placeholder="Short summary shown on post cards…"
                                    className="mt-1 resize-none"
                                />
                                {errors.excerpt && <p className="text-sm text-red-600 mt-1">{errors.excerpt}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Embed URL — shown for podcast, webinar & agent360 */}
                    {(data.type === 'podcast' || data.type === 'webinar' || data.type === 'agent360') && (
                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    {data.type === 'podcast' ? '🎙️ Podcast Embed' : data.type === 'agent360' ? '🎯 Agent360 Embed' : '🖥️ Webinar Embed'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Label htmlFor="embed_url">Embed URL</Label>
                                <Input
                                    id="embed_url"
                                    type="url"
                                    value={data.embed_url}
                                    onChange={e => setData('embed_url', toEmbedUrl(e.target.value))}
                                    className="mt-1"
                                    placeholder="Paste a YouTube, Spotify or direct embed URL…"
                                />
                                {data.embed_url && data.embed_url.includes('youtube.com/embed/') && (
                                    <p className="text-xs text-green-600 mt-1">✓ YouTube URL converted to embed format</p>
                                )}
                                {errors.embed_url && <p className="text-sm text-red-600 mt-1">{errors.embed_url}</p>}
                                {data.embed_url && (
                                    <div className="mt-3 rounded-lg overflow-hidden border border-input">
                                        <iframe
                                            src={data.embed_url}
                                            title="Embed preview"
                                            className="w-full"
                                            height={data.type === 'podcast' ? 152 : 315}
                                            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                            loading="lazy"
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Content — rich editor */}
                    <Card>
                        <CardHeader><CardTitle>Content</CardTitle></CardHeader>
                        <CardContent>
                            <RichEditor
                                value={data.content_html}
                                onChange={html => setData('content_html', html)}
                                placeholder="Write post content here…"
                            />
                            {errors.content_html && <p className="text-sm text-red-600 mt-2">{errors.content_html}</p>}
                        </CardContent>
                    </Card>
                </div>

                {/* ── Right sidebar ── */}
                <div className="space-y-5">

                    {/* Publish */}
                    <Card>
                        <CardHeader><CardTitle>Publish</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="is_published">Status</Label>
                                <Select value={data.is_published} onValueChange={v => setData('is_published', v)}>
                                    <SelectTrigger className="mt-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">✅ Published</SelectItem>
                                        <SelectItem value="0">📝 Draft</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="published_at">Publish Date</Label>
                                <Input
                                    id="published_at"
                                    type="datetime-local"
                                    value={data.published_at}
                                    onChange={e => setData('published_at', e.target.value)}
                                    className="mt-1"
                                />
                            </div>

                            <div className="flex flex-col gap-2 pt-2">
                                <Button type="submit" disabled={processing} className="w-full bg-brand hover:bg-brand-dark">
                                    {processing ? 'Saving…' : submitLabel}
                                </Button>
                                {postSlug && (
                                    <a
                                        href={`/posts/${postSlug}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-brand transition-colors py-1"
                                    >
                                        <Eye className="w-3.5 h-3.5" /> View on site
                                    </a>
                                )}
                                {onCancel ? (
                                    <Button type="button" variant="outline" className="w-full" onClick={onCancel}>Cancel</Button>
                                ) : (
                                    <Button variant="outline" asChild className="w-full">
                                        <Link href="/admin/posts">Cancel</Link>
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Featured Image */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Featured Image</CardTitle>
                                {getYouTubeId(data.embed_url) && (
                                    <button
                                        type="button"
                                        onClick={useYouTubeThumbnail}
                                        disabled={fetchingThumb}
                                        className="text-xs font-medium text-brand hover:underline disabled:opacity-50"
                                    >
                                        {fetchingThumb ? 'Fetching…' : '▶ Use YouTube thumbnail'}
                                    </button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ImageUpload
                                key={data.media_id}
                                value={data.media_id}
                                currentMedia={activeMedia ?? currentMedia}
                                onChange={(id, media) => { setData('media_id', id); setActiveMedia(media as Media); }}
                                onClear={() => { setData('media_id', 'none'); setActiveMedia(null); }}
                            />
                            {thumbError && <p className="text-sm text-red-600 mt-2">{thumbError}</p>}
                            {errors.media_id && <p className="text-sm text-red-600 mt-2">{errors.media_id}</p>}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </form>
    );
}
