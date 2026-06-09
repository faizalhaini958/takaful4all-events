import PublicLayout from '@/Layouts/PublicLayout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { type Post } from '@/types';

interface Props {
    post: Post;
    canonicalUrl: string;
}

export default function PostShow({ post, canonicalUrl }: Props) {
    return (
        <PublicLayout>
            <Head>
                <title>{post.title} | Takaful4All Events</title>
                <meta name="description" content={post.excerpt ?? 'Listen to this content on Takaful4All Events.'} />
                <link rel="canonical" href={canonicalUrl} />
                <meta property="og:type" content="article" />
                <meta property="og:url" content={canonicalUrl} />
                <meta property="og:title" content={`${post.title} | Takaful4All Events`} />
                <meta property="og:description" content={post.excerpt ?? 'Listen to this content on Takaful4All Events.'} />
                {post.media?.url && <meta property="og:image" content={post.media.url} />}
                {post.media?.url && <meta property="og:image:width" content="1200" />}
                {post.media?.url && <meta property="og:image:height" content="630" />}
                {post.media?.url && <meta name="twitter:image" content={post.media.url} />}
                {post.published_at && <meta property="article:published_time" content={new Date(post.published_at).toISOString()} />}
                {post.updated_at && <meta property="article:modified_time" content={new Date(post.updated_at).toISOString()} />}
                <meta name="twitter:title" content={`${post.title} | Takaful4All Events`} />
                <meta name="twitter:description" content={post.excerpt ?? 'Listen to this content on Takaful4All Events.'} />
                <meta name="twitter:card" content="summary_large_image" />
            </Head>

            <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex items-center gap-3 mb-8">
                    <Link
                        href="/content"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-dark"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to content
                    </Link>
                </div>

                <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                                {post.type}
                            </span>
                            <h1 className="text-3xl font-bold text-slate-900">{post.title}</h1>
                            {post.excerpt && <p className="text-sm text-slate-600">{post.excerpt}</p>}
                        </div>

                        {post.embed_url ? (
                            <div className="rounded-3xl overflow-hidden border border-slate-200">
                                <iframe
                                    src={post.embed_url}
                                    title={post.title}
                                    className="w-full"
                                    style={{ minHeight: post.type === 'podcast' ? 180 : 520 }}
                                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                    loading="lazy"
                                />
                            </div>
                        ) : (
                            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-500">
                                Embed content not available.
                            </div>
                        )}

                        {post.content_html && (
                            <article className="prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: post.content_html }} />
                        )}
                    </div>

                    <aside className="space-y-6">
                        {post.media?.url ? (
                            <img
                                src={post.media.url}
                                alt={post.media.alt ?? post.title}
                                className="w-full rounded-3xl object-cover"
                            />
                        ) : (
                            <div className="rounded-3xl bg-slate-100 p-10 text-center text-slate-400">
                                No featured image available.
                            </div>
                        )}
                    </aside>
                </div>
            </section>
        </PublicLayout>
    );
}
