import PublicLayout from '@/Layouts/PublicLayout';
import PostCard from '@/Components/PostCard';
import HeroCarousel from '@/Components/HeroCarousel';
import { Link, Head, router } from '@inertiajs/react';
import { Sparkles, Video } from 'lucide-react';
import { type ContentBanner, type Post, type PaginatedData } from '@/types';

const POPPINS = "'Poppins', sans-serif";
const INTER   = "'Inter', sans-serif";

const TABS = [
    { key: 'all',      label: 'All Videos' },
    { key: 'webinar',  label: 'Webinars' },
    { key: 'agent360', label: 'Agent360' },
    { key: 'podcast',  label: 'Podcasts' },
];

const TYPE_LABELS: Record<string, string> = {
    webinar:  'Webinars',
    agent360: 'Agent360 Sessions',
    podcast:  'Podcasts',
};

interface Props {
    posts:           PaginatedData<Post>;
    activeType:      string;
    banners:         ContentBanner[];
    canonicalUrl:    string;
    metaTitle:       string;
    metaDescription: string;
}

export default function ContentIndex({ posts, activeType, banners, canonicalUrl, metaTitle, metaDescription }: Props) {
    function switchTab(type: string) {
        router.get('/content', type === 'all' ? {} : { type }, { preserveScroll: false });
    }

    const heroTitle = activeType !== 'all' && TYPE_LABELS[activeType]
        ? TYPE_LABELS[activeType]
        : 'Watch & Learn';

    const heroSubtitle = activeType !== 'all' && TYPE_LABELS[activeType]
        ? `On-demand ${TYPE_LABELS[activeType].toLowerCase()} curated for takaful professionals.`
        : 'On-demand webinars, Agent360 sessions and podcasts curated for takaful professionals.';

    return (
        <PublicLayout>
            <Head>
                <title>{metaTitle}</title>
                <meta name="description" content={metaDescription} />
                <link rel="canonical" href={canonicalUrl} />
                <meta property="og:type" content="website" />
                <meta property="og:url" content={canonicalUrl} />
                <meta property="og:title" content={metaTitle} />
                <meta property="og:description" content={metaDescription} />
                <meta property="og:site_name" content="Takaful4All Events" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={metaTitle} />
                <meta name="twitter:description" content={metaDescription} />
            </Head>
            {/* ── Hero ── */}
            <section className="relative -mt-16 overflow-hidden" style={{ background: '#16324A' }}>
                {/* Dot grid */}
                <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
                {/* Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-20 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, #1C7C93 0%, transparent 70%)' }} />
                <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 md:pb-28 text-center" style={{ paddingTop: '7rem' }}>
                    <h1 style={{ fontFamily: POPPINS, color: 'white', fontSize: '2.25rem', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                        {heroTitle}
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontFamily: INTER, fontSize: '1.075rem', maxWidth: '480px', margin: '0 auto', textAlign: 'center' }}>
                        {heroSubtitle}
                    </p>
                </div>
            </section>

            {/* ── Content ── */}
            <section className="relative z-10 -mt-10 rounded-t-3xl rounded-b-3xl overflow-hidden bg-gradient-to-b from-[#EBF5FA] dark:from-background to-[#ddeef6] dark:to-background">
                {/* Dot grid */}
                <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgba(0,100,140,0.07) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20">

                    {/* ── Featured banners carousel ── */}
                    {banners.length > 0 && (
                        <div className="mb-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4" style={{ color: '#1C7C93' }} strokeWidth={2} />
                                    <span style={{ fontFamily: POPPINS, fontSize: '0.95rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', background: 'linear-gradient(90deg, #1C7C93, #1C7C93)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                        Featured Highlights
                                    </span>
                                </div>
                            </div>
                            <div className="rounded-2xl overflow-hidden" style={{ boxShadow: '0 4px 32px rgba(0,159,187,0.12), 0 0 0 1.5px rgba(0,159,187,0.15)' }}>
                                <HeroCarousel banners={banners} contained />
                            </div>
                        </div>
                    )}

                    {/* Tab filter */}
                    <div className="flex gap-2 flex-wrap mb-10">
                        {TABS.map(tab => {
                            const isActive = activeType === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => switchTab(tab.key)}
                                    className="px-5 py-2 rounded-full text-sm font-semibold transition-all"
                                    style={isActive
                                        ? { background: 'linear-gradient(135deg, #1C7C93 0%, #1C7C93 100%)', color: 'white', border: '1px solid transparent', boxShadow: '0 2px 10px rgba(28,124,147,0.3)' }
                                        : { background: 'white', border: '1px solid #b8d5e2', color: '#0f3a55' }}
                                >
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Grid */}
                    {posts.data.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {posts.data.map(post => (
                                <PostCard key={post.id} post={post} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-24 flex flex-col items-center gap-4">
                            <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(0,159,187,0.12)', border: '1px solid rgba(0,159,187,0.2)' }}>
                                <Video className="w-9 h-9" style={{ color: '#1C7C93' }} strokeWidth={1.5} />
                            </div>
                            <p style={{ fontFamily: POPPINS, color: '#071B2A', fontWeight: 700, fontSize: '1.125rem' }}>No content found.</p>
                            <p style={{ color: '#64748b', fontFamily: INTER, fontSize: '0.875rem' }}>Check back soon for new sessions.</p>
                        </div>
                    )}

                    {/* Pagination */}
                    {posts.last_page > 1 && (
                        <div className="mt-10 flex justify-center gap-1.5 flex-wrap">
                            {posts.links.map((link, i) => (
                                <Link
                                    key={i}
                                    href={link.url ?? '#'}
                                    className="px-3 py-1.5 rounded-full text-sm font-medium transition-all border"
                                    style={link.active
                                        ? { background: 'linear-gradient(135deg, #1C7C93 0%, #1C7C93 100%)', color: 'white', border: '1px solid transparent' }
                                        : link.url
                                            ? { background: 'white', border: '1px solid #b8d5e2', color: '#0f3a55' }
                                            : { background: 'white', border: '1px solid #d5e8f0', color: '#94a3b8', cursor: 'not-allowed' }}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    preserveScroll
                                />
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </PublicLayout>
    );
}
