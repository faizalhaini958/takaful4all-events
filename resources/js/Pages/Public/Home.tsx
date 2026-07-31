import PublicLayout from '@/Layouts/PublicLayout';
import EventCard from '@/Components/EventCard';
import VideoModal from '@/Components/VideoModal';
import { Link, Head } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import {
    ArrowRight, ArrowUp, MapPin, Globe2, Users,
    Mic, Lightbulb, TrendingUp, Heart, BookOpen,
    Trophy, Wrench, UtensilsCrossed, Music, LayoutGrid,
    ChevronLeft, ChevronRight,
} from 'lucide-react';
import { type Banner, type Event, type Page, type Post } from '@/types';
import { useTranslation } from '@/hooks/use-translation';

interface Props {
    banners: Banner[];
    slideshowEnabled: boolean;
    upcomingEvents: Event[];
    pastEvents: Event[];
    aboutPage: Page | null;
    podcasts: Post[];
    webinars: Post[];
    agent360: Post[];
    canonicalUrl: string;
}

const CATEGORY_LABELS: Record<string, string> = {
    all:           'All Events',
    conference:    'Conference',
    workshop:      'Workshop',
    sports:        'Sports',
    dinner:        'Dinner',
    entertainment: 'Entertainment',
    exhibition:    'Exhibition',
    general:       'General',
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
    conference:    Mic,
    workshop:      Wrench,
    sports:        Trophy,
    dinner:        UtensilsCrossed,
    entertainment: Music,
    exhibition:    Globe2,
    general:       LayoutGrid,
};

const POPPINS = "'Poppins', sans-serif";
const INTER   = "'Inter', sans-serif";

export default function Home({ upcomingEvents, pastEvents, podcasts, webinars, agent360, canonicalUrl }: Props) {
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [activePost, setActivePost] = useState<Post | null>(null);
    const [showTop, setShowTop] = useState(false);
    const [email, setEmail] = useState('');
    const [subscribed, setSubscribed] = useState(false);
    const [slideIndex, setSlideIndex] = useState(0);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
    const [heroSlide, setHeroSlide] = useState(0);
    const [heroFade, setHeroFade] = useState(true);
    const [mobileSlide, setMobileSlide] = useState(0);
    const [mobileFade, setMobileFade] = useState(true);
    const { t } = useTranslation();

    useEffect(() => {
        const onScroll = () => setShowTop(window.scrollY > 400);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Auto-rotate hero mosaic every 4 seconds
    useEffect(() => {
        if (upcomingEvents.length <= 3) return;
        const timer = setInterval(() => {
            setHeroFade(false);
            setTimeout(() => {
                setHeroSlide(prev => (prev + 1) % upcomingEvents.length);
                setHeroFade(true);
            }, 300);
        }, 4000);
        return () => clearInterval(timer);
    }, [upcomingEvents.length]);

    // Auto-rotate mobile hero card every 4 seconds
    const mobileSlideCount = Math.min(upcomingEvents.length, 6);
    useEffect(() => {
        if (mobileSlideCount <= 1) return;
        const timer = setInterval(() => {
            setMobileFade(false);
            setTimeout(() => {
                setMobileSlide(prev => (prev + 1) % mobileSlideCount);
                setMobileFade(true);
            }, 300);
        }, 4000);
        return () => clearInterval(timer);
    }, [mobileSlideCount]);

    const availableCategories = Array.from(
        new Set(upcomingEvents.map(e => e.event_category).filter(Boolean))
    ) as string[];

    const categories = ['all', ...availableCategories];

    const filteredEvents = upcomingEvents
        .filter(e => activeCategory === 'all' || e.event_category === activeCategory)
        .filter(e => !search.trim() || e.title.toLowerCase().includes(search.trim().toLowerCase()));

    const filteredPastEvents = pastEvents
        .filter(e => activeCategory === 'all' || e.event_category === activeCategory)
        .filter(e => !search.trim() || e.title.toLowerCase().includes(search.trim().toLowerCase()));

    const activeEvents = activeTab === 'upcoming' ? filteredEvents : filteredPastEvents;

    return (
        <PublicLayout>
            <Head>
                <title>Takaful4All Events | Conferences, Webinars &amp; Workshops</title>
                <meta name="description" content="Discover and register for upcoming conferences, webinars and workshops organised by Takaful4All. Your gateway to takaful industry events." />
                <link rel="canonical" href={canonicalUrl} />
                {upcomingEvents[0]?.media?.url ? <link rel="preload" as="image" href={upcomingEvents[0].media.url} fetchPriority="high" /> : null}
                <meta property="og:type" content="website" />
                <meta property="og:url" content={canonicalUrl} />
                <meta property="og:title" content="Takaful4All Events | Conferences, Webinars &amp; Workshops" />
                <meta property="og:description" content="Discover and register for upcoming conferences, webinars and workshops organised by Takaful4All. Your gateway to takaful industry events." />
                <meta property="og:site_name" content="Takaful4All Events" />
                {upcomingEvents[0]?.media?.url ? <meta property="og:image" content={upcomingEvents[0].media.url} /> : null}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Takaful4All Events | Conferences, Webinars &amp; Workshops" />
                <meta name="twitter:description" content="Discover and register for upcoming conferences, webinars and workshops organised by Takaful4All. Your gateway to takaful industry events." />
                {upcomingEvents[0]?.media?.url ? <meta name="twitter:image" content={upcomingEvents[0].media.url} /> : null}
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([
                    {
                        '@context': 'https://schema.org',
                        '@type': 'Organization',
                        name: 'Takaful4All Events',
                        alternateName: 'Takaful4All',
                        description: 'Official events platform of the Malaysian Takaful Association — discover and register for conferences, webinars, workshops, and industry events.',
                        url: canonicalUrl.replace(/\/$/, ''),
                        logo: {
                            '@type': 'ImageObject',
                            url: `${canonicalUrl.replace(/\/$/, '')}/images/logo.png`,
                        },
                        image: {
                            '@type': 'ImageObject',
                            url: `${canonicalUrl.replace(/\/$/, '')}/images/logo.png`,
                        },
                        sameAs: [
                            'https://www.malaysiantakaful.com.my',
                        ],
                        address: {
                            '@type': 'PostalAddress',
                            addressCountry: 'MY',
                        },
                    },
                    {
                        '@context': 'https://schema.org',
                        '@type': 'WebSite',
                        name: 'Takaful4All Events',
                        url: canonicalUrl.replace(/\/$/, ''),
                        potentialAction: {
                            '@type': 'SearchAction',
                            target: {
                                '@type': 'EntryPoint',
                                urlTemplate: `${canonicalUrl.replace(/\/$/, '')}/events?search={search_term_string}`,
                            },
                            'query-input': 'required name=search_term_string',
                        },
                    },
                    ...upcomingEvents.slice(0, 6).map((event, i) => ({
                        '@context': 'https://schema.org',
                        '@type': 'Event',
                        name: event.title,
                        url: `${canonicalUrl.replace(/\/$/, '')}/events/${event.slug}`,
                        startDate: event.start_at,
                        ...(event.end_at ? { endDate: event.end_at } : {}),
                        ...(event.media?.url ? { image: event.media.url } : {}),
                        location: event.venue ? {
                            '@type': 'Place',
                            name: event.venue,
                            address: {
                                '@type': 'PostalAddress',
                                addressLocality: event.city ?? '',
                                addressCountry: event.country ?? 'MY',
                            },
                        } : undefined,
                    })),
                ]) }} />
            </Head>
            <VideoModal post={activePost} onClose={() => setActivePost(null)} />

            {/* ─────────────────────────────────────────
                HERO — split layout
            ───────────────────────────────────────── */}
            <section
                className="relative overflow-hidden -mt-16 pb-10"
style={{ background: 'linear-gradient(145deg, #EAF8FB 0%, #DDF3F8 55%, #EAF8FB 100%)' }}
            >
                {/* Dot grid */}
                <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgba(28,124,147,0.10) 1px, transparent 1px)', backgroundSize: '36px 36px' }} />
                {/* Cyan glow top-left */}
                <div className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(28,124,147,0.13) 0%, transparent 60%)' }} />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-0 sm:pt-24 md:pt-32">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">

                        {/* ── Left: text ── */}
                        <div className="pb-8 md:pb-14">
                            {/* Badge */}
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-7 border"
                                style={{ borderColor: 'rgba(28,124,147,0.25)', backgroundColor: 'rgba(28,124,147,0.08)' }}>
                                <img src="/images/logo.png" alt="MTA" className="h-3.5 w-auto flex-shrink-0" />
                                <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#1C7C93', fontFamily: INTER }}>
                                    Malaysian Takaful Association
                                </span>
                            </div>

                            {/* Headline */}
                            <h1 className="text-[2rem] sm:text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold text-[#334155] leading-[1.1] mb-4 sm:mb-5"
                                style={{ fontFamily: POPPINS, letterSpacing: '-0.02em' }}>
                                Connect. Inspire.{' '}
                                <span className="block bg-gradient-to-r from-[#1B4F91] to-[#1C7C93] bg-clip-text text-transparent">
                                    Shape the Future.
                                </span>
                            </h1>

                            {/* Subtitle */}
                            <p className="text-sm sm:text-base mb-6 sm:mb-8 max-w-sm sm:max-w-md leading-relaxed"
                                style={{ color: '#475569', fontFamily: INTER }}>
                                Discover conferences, workshops &amp; webinars curated for takaful professionals across Malaysia.
                            </p>

                            {/* Quick link + stats */}
                            <div className="flex flex-wrap items-center gap-3 mt-6">
                                <Link href="/events"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white hover:opacity-90 transition-opacity shadow-md"
                                    style={{ backgroundColor: '#1C7C93', fontFamily: INTER }}>
                                    Browse all events <ArrowRight className="w-4 h-4" />
                                </Link>
                                {upcomingEvents.length > 0 && (
                                    <span className="text-xs" style={{ color: 'rgba(51,65,85,0.35)', fontFamily: INTER }}>
                                        · {upcomingEvents.length} upcoming event{upcomingEvents.length !== 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>

                            {/* ── Mobile auto-rotating event card (lg:hidden) ── */}
                            {upcomingEvents.length > 0 && (() => {
                                const ev = upcomingEvents[mobileSlide];
                                return (
                                    <div className="lg:hidden mt-7">
                                        {/* Card */}
                                        <Link href={`/events/${ev.slug}`}
                                            className="block relative rounded-2xl overflow-hidden w-full"
                                            style={{ height: 'clamp(300px, 55vh, 480px)', transition: 'opacity 0.3s ease', opacity: mobileFade ? 1 : 0 }}>
                                        {ev.media ? (
                                            <picture>
                                                {ev.mobile_media?.url && <source media="(max-width: 767px)" srcSet={ev.mobile_media.url} />}
                                                <img src={ev.media.url} alt={ev.title}
                                                    fetchPriority="high" loading="eager" width={ev.media.width ?? undefined} height={ev.media.height ?? undefined}
                                                    className="w-full h-full object-cover" />
                                            </picture>
                                        ) : (
                                                <div className="w-full h-full flex items-center justify-center"
                                                    style={{ background: 'linear-gradient(145deg, #0d3352, #071B2A)' }}>
                                                    <LayoutGrid className="w-10 h-10" style={{ color: 'rgba(28,124,147,0.3)' }} />
                                                </div>
                                            )}
                                            {/* Gradient overlay */}
                                            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(7,27,42,0.95) 0%, rgba(7,27,42,0.3) 50%, transparent 100%)' }} />
                                            {/* Badge */}
                                            <div className="absolute top-3 left-3">
                                                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                                                    style={{ background: 'linear-gradient(90deg, #1C7C93, #56B8C4)', color: '#071B2A', fontFamily: INTER }}>
                                                    Upcoming
                                                </span>
                                            </div>
                                            {/* Prev / Next arrows */}
                                            {mobileSlideCount > 1 && (
                                                <>
                                                    <button
                                                        onClick={e => { e.preventDefault(); setMobileFade(false); setTimeout(() => { setMobileSlide(p => (p - 1 + mobileSlideCount) % mobileSlideCount); setMobileFade(true); }, 300); }}
                                                        className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full"
                                                        style={{ width: 30, height: 30, background: 'rgba(7,27,42,0.55)', backdropFilter: 'blur(4px)' }}>
                                                        <ChevronLeft className="w-4 h-4 text-white" />
                                                    </button>
                                                    <button
                                                        onClick={e => { e.preventDefault(); setMobileFade(false); setTimeout(() => { setMobileSlide(p => (p + 1) % mobileSlideCount); setMobileFade(true); }, 300); }}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full"
                                                        style={{ width: 30, height: 30, background: 'rgba(7,27,42,0.55)', backdropFilter: 'blur(4px)' }}>
                                                        <ChevronRight className="w-4 h-4 text-white" />
                                                    </button>
                                                </>
                                            )}
                                            {/* Info */}
                                            <div className="absolute bottom-3 left-3 right-3">
                                                <p className="text-white font-bold text-sm leading-snug line-clamp-2 mb-1" style={{ fontFamily: POPPINS }}>
                                                    {ev.title}
                                                </p>
                                                <div className="flex items-center justify-between">
                                                    {ev.start_at && (
                                                        <p className="text-white/55 text-xs" style={{ fontFamily: INTER }}>
                                                            {new Date(ev.start_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </p>
                                                    )}
                                                    <span className="text-xs font-semibold flex items-center gap-1" style={{ color: '#1C7C93', fontFamily: INTER }}>
                                                        View <ArrowRight className="w-3 h-3" />
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                        {/* Dots + View All */}
                                        <div className="flex items-center justify-between mt-3 px-1">
                                            <div className="flex items-center gap-1.5">
                                                {Array.from({ length: mobileSlideCount }).map((_, i) => (
                                                    <button key={i}
                                                        onClick={() => { setMobileFade(false); setTimeout(() => { setMobileSlide(i); setMobileFade(true); }, 300); }}
                                                        className="rounded-full transition-all duration-300"
                                                        style={{
                                                            width: i === mobileSlide ? '20px' : '6px',
                                                            height: '6px',
                                                            background: i === mobileSlide ? '#1C7C93' : 'rgba(51,65,85,0.15)',
                                                        }} />
                                                ))}
                                            </div>
                                            <Link href="/events"
                                                className="text-xs font-semibold flex items-center gap-1 transition-opacity hover:opacity-75"
                                                style={{ color: '#1C7C93', fontFamily: INTER }}>
                                                View all <ArrowRight className="w-3 h-3" />
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* ── Right: event mosaic (auto-rotating) ── */}
                        <div className="hidden lg:flex items-center justify-center">
                            <div className="relative w-full" style={{ height: '460px' }}>

                                {/* Large card — left 60% */}
                                {(() => {
                                    const ev = upcomingEvents[heroSlide % upcomingEvents.length];
                                    return (
                                        <Link href={ev ? `/events/${ev.slug}` : '/events'}
                                            className="absolute left-0 top-6 bottom-6 rounded-2xl overflow-hidden shadow-2xl group"
                                            style={{ width: '60%', opacity: heroFade ? 1 : 0, transition: 'opacity 0.3s ease' }}>
                                            {ev?.media ? (
                                                <picture>
                                                    {ev.mobile_media?.url && <source media="(max-width: 767px)" srcSet={ev.mobile_media.url} />}
                                                    <img src={ev.media.url} alt={ev.title}
                                                        fetchPriority="high" loading="eager" width={ev.media.width ?? undefined} height={ev.media.height ?? undefined}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                </picture>
                                            ) : (
                                                <div className="w-full h-full" style={{ background: 'linear-gradient(145deg, #0d3352, #071B2A)' }} />
                                            )}
                                            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(7,27,42,0.9) 0%, transparent 55%)' }} />
                                            <div className="absolute bottom-5 left-5 right-5">
                                                <span className="inline-block text-[10px] font-bold px-2.5 py-1 rounded-full mb-2"
                                                    style={{ background: 'linear-gradient(90deg, #1C7C93, #56B8C4)', color: '#071B2A', fontFamily: INTER }}>
                                                    Upcoming
                                                </span>
                                                <p className="text-white font-bold text-sm leading-snug line-clamp-2" style={{ fontFamily: POPPINS }}>
                                                    {ev?.title}
                                                </p>
                                                {ev?.start_at && (
                                                    <p className="text-white/55 text-xs mt-1" style={{ fontFamily: INTER }}>
                                                        {new Date(ev.start_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </p>
                                                )}
                                            </div>
                                        </Link>
                                    );
                                })()}

                                {/* Two stacked smaller cards — right 37% */}
                                <div className="absolute right-0 top-0 bottom-0 flex flex-col gap-3" style={{ width: '37%', opacity: heroFade ? 1 : 0, transition: 'opacity 0.3s ease' }}>
                                    {[1, 2].map(offset => {
                                        const idx = (heroSlide + offset) % upcomingEvents.length;
                                        const ev = upcomingEvents[idx];
                                        return (
                                            <Link key={offset}
                                                href={ev ? `/events/${ev.slug}` : '/events'}
                                                className="flex-1 rounded-2xl overflow-hidden shadow-xl relative group">
                                                {ev?.media ? (
                                                    <picture>
                                                        {ev.mobile_media?.url && <source media="(max-width: 767px)" srcSet={ev.mobile_media.url} />}
                                                        <img src={ev.media.url} alt={ev.title}
                                                            loading="lazy" width={ev.media.width ?? undefined} height={ev.media.height ?? undefined}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                    </picture>
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center"
                                                        style={{ background: 'linear-gradient(145deg, #0d3352, #071B2A)' }}>
                                                        <LayoutGrid className="w-8 h-8" style={{ color: 'rgba(28,124,147,0.3)' }} />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(7,27,42,0.88) 0%, transparent 60%)' }} />
                                                <div className="absolute bottom-3 left-3 right-3">
                                                    <p className="text-white font-semibold text-xs line-clamp-1" style={{ fontFamily: POPPINS }}>
                                                        {ev?.title ?? 'More events →'}
                                                    </p>
                                                    {ev?.start_at && (
                                                        <p className="text-white/50 text-[10px] mt-0.5">
                                                            {new Date(ev.start_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}
                                                        </p>
                                                    )}
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>

                                {/* Floating event count badge */}
                                {upcomingEvents.length > 0 && (
                                    <div className="absolute top-3 left-[62%] z-10 px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg"
                                        style={{ background: 'linear-gradient(135deg, #1C7C93, #56B8C4)', color: '#071B2A', fontFamily: INTER }}>
                                        {upcomingEvents.length} Upcoming Event{upcomingEvents.length !== 1 ? 's' : ''}
                                    </div>
                                )}

                                {/* Dot indicators — centered below the large card */}
                                {upcomingEvents.length > 1 && (
                                    <div className="absolute bottom-0 flex items-center justify-center gap-1.5 z-10" style={{ width: '60%', left: 0 }}>
                                        {upcomingEvents.map((_, i) => (
                                            <button key={i} onClick={() => { setHeroFade(false); setTimeout(() => { setHeroSlide(i); setHeroFade(true); }, 300); }}
                                                className="rounded-full transition-all duration-300"
                                                style={{
                                                    width: i === heroSlide ? '20px' : '6px',
                                                    height: '6px',
                                                    background: i === heroSlide ? '#1C7C93' : 'rgba(51,65,85,0.20)',
                                                }} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─────────────────────────────────────────
                EVENTS (Upcoming + Past unified)
            ───────────────────────────────────────── */}
            {(upcomingEvents.length > 0 || pastEvents.length > 0) && (() => {
                const PAGE_SIZE = 4;
                const pageCount = Math.ceil(activeEvents.length / PAGE_SIZE);
                const pageEvents = activeEvents.slice(slideIndex * PAGE_SIZE, slideIndex * PAGE_SIZE + PAGE_SIZE);
                const canPrev = slideIndex > 0;
                const canNext = slideIndex < pageCount - 1;
                return (
                    <section
                        className="relative z-10 -mt-10 rounded-t-3xl overflow-hidden bg-white dark:bg-background"
                    >
                        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgba(0,159,187,0.05) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-0">
                            {/* Search bar */}
                            <div className="relative max-w-xl mb-5">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#1C7C93' }} />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={e => { setSearch(e.target.value); setSlideIndex(0); }}
                                    placeholder="Search events..."
                                    className="w-full pl-11 pr-4 py-3 rounded-xl text-sm outline-none bg-white dark:bg-card border border-[#dde8ef] dark:border-border text-[#071B2A] dark:text-foreground"
                                    style={{ fontFamily: INTER, boxShadow: '0 2px 8px rgba(0,159,187,0.08)' }}
                                />
                                {search && (
                                    <button onClick={() => setSearch('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-muted-foreground hover:text-gray-600 dark:hover:text-foreground text-lg leading-none">×</button>
                                )}
                            </div>

                            {/* Upcoming / Past tabs */}
                            <div className="flex items-center gap-1 p-1 rounded-xl w-fit mb-5 bg-[#dde8ef] dark:bg-muted">
                                {([
                                    { key: 'upcoming', label: 'Upcoming Events', count: filteredEvents.length },
                                    { key: 'past',     label: 'Past Events',     count: filteredPastEvents.length },
                                ] as const).map(({ key, label, count }) => (
                                    <button key={key}
                                        onClick={() => { setActiveTab(key); setSlideIndex(0); }}
                                        className="px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
                                        style={activeTab === key
                                            ? { boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }
                                            : {}
                                        }
                                    >
                                        <span className={activeTab === key ? 'text-[#071B2A] dark:text-foreground' : 'text-[#071B2A]/50 dark:text-muted-foreground'} style={{ fontFamily: INTER }}>
                                            {label}
                                        </span>
                                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === key ? 'bg-brand/10 dark:bg-brand/20 text-brand' : 'bg-[#071B2A]/8 dark:bg-muted text-[#071B2A]/40 dark:text-muted-foreground'}`} style={{ fontFamily: INTER }}>
                                            {count}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Category quick-tabs */}
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-2">
                            <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                {[
                                    { key: 'all',           label: 'All',           Icon: LayoutGrid },
                                    { key: 'conference',    label: 'Conference',    Icon: Mic },
                                    { key: 'workshop',      label: 'Workshop',      Icon: Wrench },
                                    { key: 'sports',        label: 'Sports',        Icon: Trophy },
                                    { key: 'dinner',        label: 'Dinner',        Icon: UtensilsCrossed },
                                    { key: 'entertainment', label: 'Entertainment', Icon: Music },
                                    { key: 'exhibition',    label: 'Exhibition',    Icon: Globe2 },
                                ].map(({ key, label, Icon }) => {
                                    const active = activeCategory === key;
                                    return (
                                        <button key={key}
                                            onClick={() => { setActiveCategory(key); setSlideIndex(0); }}
                                            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold flex-shrink-0 transition-all ${!active ? 'bg-white dark:bg-card text-[#071B2A]/60 dark:text-muted-foreground border border-[#dde8ef] dark:border-border' : ''}`}
                                            style={active
                                                ? { background: 'linear-gradient(90deg, #1C7C93, #1C7C93)', color: '#fff', border: '1.5px solid transparent', boxShadow: '0 4px 14px rgba(0,159,187,0.28)', fontFamily: INTER }
                                                : { fontFamily: INTER }
                                            }>
                                            <Icon className="w-4 h-4" strokeWidth={1.5} />
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-20">
                            {/* Header row */}
                            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5">
                                <div>
                                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[#071B2A] dark:text-foreground"
                                        style={{ fontFamily: POPPINS, letterSpacing: '-0.02em' }}>
                                        {activeTab === 'upcoming'
                                            ? (activeCategory === 'all' ? 'Upcoming Events' : (CATEGORY_LABELS[activeCategory] ?? activeCategory))
                                            : (activeCategory === 'all' ? 'Past Events' : `Past · ${CATEGORY_LABELS[activeCategory] ?? activeCategory}`)}
                                    </h2>
                                    <p className="mt-1 text-sm text-[#071B2A]/45 dark:text-muted-foreground" style={{ fontFamily: INTER }}>
                                        {activeEvents.length} event{activeEvents.length !== 1 ? 's' : ''} found
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 pb-0.5">
                                    {pageCount > 1 && (
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => setSlideIndex(i => Math.max(0, i - 1))} disabled={!canPrev}
                                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${canPrev ? 'text-brand dark:text-brand' : 'text-[#b8d5e2] dark:text-muted-foreground/30'}`}
                                                style={{ border: '1.5px solid', borderColor: canPrev ? '#1C7C93' : '#ddeef6', backgroundColor: canPrev ? 'rgba(0,159,187,0.06)' : 'transparent', cursor: canPrev ? 'pointer' : 'default' }}>
                                                <ChevronLeft className="w-4 h-4" />
                                            </button>
                                            <span className="text-xs font-semibold tabular-nums min-w-[32px] text-center text-[#071B2A]/45 dark:text-muted-foreground" style={{ fontFamily: INTER }}>
                                                {slideIndex + 1} / {pageCount}
                                            </span>
                                            <button onClick={() => setSlideIndex(i => Math.min(pageCount - 1, i + 1))} disabled={!canNext}
                                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${canNext ? 'text-brand dark:text-brand' : 'text-[#b8d5e2] dark:text-muted-foreground/30'}`}
                                                style={{ border: '1.5px solid', borderColor: canNext ? '#1C7C93' : '#ddeef6', backgroundColor: canNext ? 'rgba(0,159,187,0.06)' : 'transparent', cursor: canNext ? 'pointer' : 'default' }}>
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                    <Link href={activeTab === 'upcoming' ? '/events?status=upcoming' : '/events?status=past'}
                                        className="inline-flex items-center gap-1.5 text-sm font-semibold hover:opacity-70 transition-opacity"
                                        style={{ color: '#1C7C93', fontFamily: INTER }}>
                                        View All <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>

                            {/* Cards */}
                            {pageEvents.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                                    {pageEvents.map(event => (
                                        <EventCard key={event.id} event={event} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16 rounded-2xl border border-dashed border-[#e2e8f0] dark:border-border">
                                    <p className="text-sm text-[#071B2A]/35 dark:text-muted-foreground" style={{ fontFamily: INTER }}>No events found.</p>
                                </div>
                            )}
                        </div>
                    </section>
                );
            })()}

            {/* ─────────────────────────────────────────
                EXPLORE BY CATEGORY
            ───────────────────────────────────────── */}
            <section className="py-20 relative overflow-hidden" style={{ background: 'linear-gradient(145deg, #EAF8FB 0%, #DDF3F8 55%, #EAF8FB 100%)' }}>
                {/* Subtle dot grid overlay */}
                <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgba(28,124,147,0.07) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-6 sm:mb-10"
                        style={{ color: '#334155', fontFamily: POPPINS, letterSpacing: '-0.02em' }}>
                        Explore by Category
                    </h2>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3 sm:gap-4">
                        {[
                            { key: 'conference',    label: 'Conference',    Icon: Mic },
                            { key: 'workshop',      label: 'Workshop',      Icon: Wrench },
                            { key: 'sports',        label: 'Sports',        Icon: Trophy },
                            { key: 'dinner',        label: 'Dinner',        Icon: UtensilsCrossed },
                            { key: 'entertainment', label: 'Entertainment', Icon: Music },
                            { key: 'exhibition',    label: 'Exhibition',    Icon: Globe2 },
                            { key: '',              label: 'All Events',    Icon: LayoutGrid },
                        ].map(({ key, label, Icon }) => (
                            <Link
                                key={label}
                                href={key ? `/events?category=${key}` : '/events'}
                                className="group flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-5 rounded-xl sm:rounded-2xl text-center transition-all hover:-translate-y-1"
                                style={{ border: '1.5px solid rgba(51,65,85,0.10)', backgroundColor: 'rgba(51,65,85,0.03)' }}
                                onMouseEnter={e => {
                                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(28,124,147,0.5)';
                                    (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(28,124,147,0.10)';
                                }}
                                onMouseLeave={e => {
                                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(51,65,85,0.10)';
                                    (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(51,65,85,0.03)';
                                }}
                            >
                                <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center"
                                    style={{ backgroundColor: 'rgba(28,124,147,0.18)', border: '1px solid rgba(28,124,147,0.30)' }}>
                                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#1C7C93' }} strokeWidth={1.5} />
                                </div>
                                <span className="text-[11px] sm:text-xs font-semibold leading-tight" style={{ color: 'rgba(51,65,85,0.80)', fontFamily: INTER }}>{label}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─────────────────────────────────────────
                WHY JOIN
            ───────────────────────────────────────── */}
            <section className="py-16 sm:py-20 bg-white dark:bg-background">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8 sm:mb-12">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#071B2A] dark:text-foreground"
                            style={{ fontFamily: POPPINS, letterSpacing: '-0.02em' }}>
                            Why Join Takaful4All Events?
                        </h2>
                    </div>

                    {/* Cards grid — 2-col on mobile, 4-col on desktop */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        {[
                            { Icon: BookOpen,   title: t('home.aim_knowledge'),  desc: t('home.aim_knowledge_desc'),  num: '01', accent: '#1C7C93' },
                            { Icon: Users,      title: t('home.aim_networking'), desc: t('home.aim_networking_desc'), num: '02', accent: '#56B8C4' },
                            { Icon: TrendingUp, title: t('home.aim_leadership'), desc: t('home.aim_leadership_desc'), num: '03', accent: '#1C7C93' },
                            { Icon: Heart,      title: 'Make an Impact',         desc: 'Be part of positive change in the takaful industry.', num: '04', accent: '#1C7C93' },
                        ].map(({ Icon, title, desc, num, accent }) => (
                            <div key={title}
                                className="relative flex flex-col rounded-2xl sm:rounded-3xl p-4 sm:p-6 overflow-hidden bg-white dark:bg-card border border-[#071B2A]/6 dark:border-border"
                                style={{ boxShadow: '0 2px 16px rgba(7,27,42,0.07)' }}>
                                {/* Number badge */}
                                <span className="absolute top-3 right-4 text-[11px] font-black tracking-tight text-[#071B2A]/8 dark:text-foreground/10"
                                    style={{ fontFamily: POPPINS, fontSize: '28px', lineHeight: 1 }}>
                                    {num}
                                </span>
                                {/* Icon */}
                                <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 flex-shrink-0"
                                    style={{ background: `linear-gradient(135deg, ${accent}22, ${accent}11)`, border: `1px solid ${accent}33` }}>
                                    <Icon className="w-5 h-5 sm:w-7 sm:h-7" style={{ color: accent }} strokeWidth={1.5} />
                                </div>
                                {/* Text */}
                                <p className="font-bold text-sm sm:text-base leading-snug mb-1.5 sm:mb-2 pr-4 text-[#071B2A] dark:text-foreground"
                                    style={{ fontFamily: POPPINS }}>{title}</p>
                                <p className="text-xs sm:text-sm leading-relaxed text-[#071B2A]/50 dark:text-muted-foreground"
                                    style={{ fontFamily: INTER }}>{desc}</p>
                                {/* Bottom accent line */}
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-3xl"
                                    style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Back to top ── */}
            <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                aria-label="Back to top"
                className={`fixed bottom-6 right-5 z-50 w-11 h-11 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
                    showTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
                }`}
                style={{ background: 'linear-gradient(135deg, #1C7C93, #56B8C4)', color: '#071B2A' }}
            >
                <ArrowUp className="w-5 h-5" />
            </button>
        </PublicLayout>
    );
}
