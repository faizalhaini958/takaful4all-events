import PublicLayout from '@/Layouts/PublicLayout';
import ShareButtons from '@/Components/ShareButtons';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Calendar, User, Clock, Tag, ChevronRight } from 'lucide-react';
import { type Post } from '@/types';

const POPPINS = "'Poppins', sans-serif";
const INTER   = "'Inter', sans-serif";

interface Props {
    post: Post;
    canonicalUrl: string;
}

function safeStr(v: unknown): string | null {
    return typeof v === 'string' && v.trim() ? v : null;
}

function formatDate(d: string | null): string | null {
    if (!d) return null;
    return new Date(d).toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function PostShow({ post, canonicalUrl }: Props) {
    const meta = (post.meta_json ?? {}) as Record<string, unknown>;

    const speaker   = safeStr(meta.speaker);
    const duration  = safeStr(meta.duration);
    const language  = safeStr(meta.language);
    const category  = safeStr(meta.category);
    const eventDate = safeStr(meta.event_date) ?? safeStr(meta.eventDate);

    const publishDate = formatDate(post.published_at);
    const displayDate = formatDate(eventDate) ?? publishDate;
    const hasVideo    = !!post.embed_url;
    const typeLabel   = post.type.charAt(0).toUpperCase() + post.type.slice(1);

    return (
        <PublicLayout>
            <Head>
                <title>{`${post.title} | Takaful4All Events`}</title>
                <meta name="description" content={post.excerpt ?? `Listen to this content on Takaful4All Events.`} />
                <link rel="canonical" href={canonicalUrl} />
                <meta property="og:type" content="article" />
                <meta property="og:url" content={canonicalUrl} />
                <meta property="og:title" content={`${post.title} | Takaful4All Events`} />
                <meta property="og:description" content={post.excerpt ?? `Listen to this content on Takaful4All Events.`} />
                <meta property="og:site_name" content="Takaful4All Events" />
                {post.media?.url && <meta property="og:image" content={post.media.url} />}
                {post.media?.url && <meta property="og:image:width" content="1200" />}
                {post.media?.url && <meta property="og:image:height" content="630" />}
                {post.media?.url && <meta name="twitter:image" content={post.media.url} />}
                {post.published_at && <meta property="article:published_time" content={new Date(post.published_at).toISOString()} />}
                {post.updated_at && <meta property="article:modified_time" content={new Date(post.updated_at).toISOString()} />}
                <meta name="twitter:title" content={`${post.title} | Takaful4All Events`} />
                <meta name="twitter:description" content={post.excerpt ?? `Listen to this content on Takaful4All Events.`} />
                <meta name="twitter:card" content="summary_large_image" />
            </Head>

            {/* ── Hero ── */}
            <section className="relative -mt-16 overflow-hidden" style={{ background: '#071B2A' }}>
                {/* Dot grid */}
                <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
                {/* Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[280px] rounded-full opacity-20 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, #18C8FF 0%, transparent 70%)' }} />
                <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 md:pb-28 text-center" style={{ paddingTop: '7rem' }}>
                    <h1 style={{ fontFamily: POPPINS, color: 'white', fontSize: '2.25rem', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                        {post.title}
                    </h1>
                    {post.excerpt && (
                        <p className="mt-3" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: INTER, fontSize: '1.125rem' }}>
                            {post.excerpt}
                        </p>
                    )}
                </div>
            </section>

            {/* ── Content ── */}
            <section className="relative z-10 -mt-10 rounded-t-3xl rounded-b-3xl overflow-hidden bg-gradient-to-b from-[#EBF5FA] dark:from-background to-[#ddeef6] dark:to-background">
                <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgba(0,100,140,0.07) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
                <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-20">

                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-2 text-xs text-gray-400 mb-6" aria-label="Breadcrumb">
                        <Link href="/" className="hover:text-brand transition-colors py-1">Home</Link>
                        <ChevronRight className="w-3 h-3 flex-shrink-0" />
                        <Link href="/content" className="hover:text-brand transition-colors py-1">Content</Link>
                        <ChevronRight className="w-3 h-3 flex-shrink-0" />
                        <span className="text-gray-600 dark:text-foreground truncate max-w-[200px] sm:max-w-sm py-1">{post.title}</span>
                    </nav>

                    {/* Meta bar */}
                    <div className="flex flex-wrap items-center gap-3 mb-8">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/60 dark:bg-card/60 border px-3 py-1 text-xs font-semibold text-slate-600 dark:text-foreground" style={{ borderColor: '#c8dfe8' }}>
                            <Tag className="w-3 h-3" style={{ color: '#009FBB' }} />
                            {typeLabel}
                        </span>
                        {displayDate && (
                            <span className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-muted-foreground" style={{ fontFamily: INTER }}>
                                <Calendar className="w-3.5 h-3.5" />
                                {displayDate}
                            </span>
                        )}
                        {speaker && (
                            <span className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-muted-foreground" style={{ fontFamily: INTER }}>
                                <User className="w-3.5 h-3.5" />
                                {speaker}
                            </span>
                        )}
                        {duration && (
                            <span className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-muted-foreground" style={{ fontFamily: INTER }}>
                                <Clock className="w-3.5 h-3.5" />
                                {duration}
                            </span>
                        )}
                    </div>

                    {/* Video / Image */}
                    <div className="mb-12">
                        {hasVideo ? (
                            <div className="rounded-2xl overflow-hidden shadow-sm" style={{ border: '1px solid #c8dfe8' }}>
                                <div className="aspect-video bg-black">
                                    <iframe
                                        src={post.embed_url!}
                                        title={post.title}
                                        className="w-full h-full"
                                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                        loading="lazy"
                                    />
                                </div>
                            </div>
                        ) : post.media?.url ? (
                            <div className="rounded-2xl overflow-hidden shadow-sm" style={{ border: '1px solid #c8dfe8' }}>
                                <img
                                    src={post.media.url}
                                    alt={post.media.alt ?? post.title}
                                    className="w-full object-cover max-h-96"
                                />
                            </div>
                        ) : null}
                    </div>

                    {/* Two-column: Article + Sidebar */}
                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Article */}
                        <div className="lg:col-span-2">
                            {post.content_html ? (
                                <article
                                    className="prose prose-lg max-w-none text-gray-600 dark:text-foreground"
                                    dangerouslySetInnerHTML={{ __html: post.content_html }}
                                />
                            ) : (
                                <div className="text-center py-16 text-slate-400">
                                    <p>No content available.</p>
                                </div>
                            )}

                            {/* Share — mobile */}
                            <div className="lg:hidden mt-8 pt-6 border-t" style={{ borderColor: '#c8dfe8' }}>
                                <ShareButtons url={canonicalUrl} title={post.title} />
                            </div>
                        </div>

                        {/* Sidebar */}
                        <aside className="space-y-5">
                            {/* Speaker card */}
                            {speaker && (
                                <div className="bg-white/60 dark:bg-card/60 rounded-2xl p-6 text-center hover:shadow-md transition-shadow" style={{ border: '1px solid #c8dfe8' }}>
                                    <div className="flex justify-center mb-4">
                                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #e6f6fb 0%, #d0eef8 100%)', border: '1px solid #b8d5e2' }}>
                                            <User className="w-7 h-7" style={{ color: '#009FBB' }} strokeWidth={1.5} />
                                        </div>
                                    </div>
                                    <h3 style={{ fontFamily: POPPINS, color: '#071B2A', fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.25rem' }} className="dark:text-foreground">Speaker</h3>
                                    <p className="text-sm text-gray-500 dark:text-muted-foreground leading-relaxed">{speaker}</p>
                                </div>
                            )}

                            {/* Details card */}
                            <div className="bg-white/60 dark:bg-card/60 rounded-2xl p-6 hover:shadow-md transition-shadow" style={{ border: '1px solid #c8dfe8' }}>
                                <h3 style={{ fontFamily: POPPINS, color: '#071B2A', fontWeight: 700, fontSize: '1.05rem', marginBottom: '1rem' }} className="dark:text-foreground">Details</h3>
                                <div className="space-y-3 text-sm" style={{ fontFamily: INTER }}>
                                    <DetailRow label="Type" value={typeLabel} />
                                    {duration && <DetailRow label="Duration" value={duration} />}
                                    {language && <DetailRow label="Language" value={language} />}
                                    {category && <DetailRow label="Category" value={category} />}
                                    {displayDate && (
                                        <DetailRow label={eventDate ? 'Event date' : 'Published'} value={displayDate} />
                                    )}
                                    {!displayDate && publishDate && (
                                        <DetailRow label="Published" value={publishDate} />
                                    )}
                                </div>
                            </div>

                            {/* Share — desktop */}
                            <div className="hidden lg:block bg-white/60 dark:bg-card/60 rounded-2xl p-6 hover:shadow-md transition-shadow" style={{ border: '1px solid #c8dfe8' }}>
                                <h3 style={{ fontFamily: POPPINS, color: '#071B2A', fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.75rem' }} className="dark:text-foreground">Share</h3>
                                <ShareButtons url={canonicalUrl} title={post.title} />
                            </div>
                        </aside>
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
}

function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-slate-500">{label}</span>
            <span className="text-slate-700 font-medium">{value}</span>
        </div>
    );
}
