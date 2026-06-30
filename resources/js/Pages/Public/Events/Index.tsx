import PublicLayout from '@/Layouts/PublicLayout';
import EventCard from '@/Components/EventCard';
import HeroCarousel from '@/Components/HeroCarousel';
import { Link, router, Head } from '@inertiajs/react';
import { CalendarDays, Mic, Wrench, Trophy, UtensilsCrossed, Music, Globe2, Sparkles } from 'lucide-react';
import { type Banner, type Event, type PaginatedData } from '@/types';
import { useTranslation } from '@/hooks/use-translation';

const POPPINS = "'Poppins', sans-serif";
const INTER   = "'Inter', sans-serif";

interface Props {
    events: PaginatedData<Event>;
    currentStatus: string;
    banners: Banner[];
    canonicalUrl: string;
}

const STATUS_FILTERS = [
    { value: 'all',      label: 'events.all' },
    { value: 'upcoming', label: 'events.upcoming' },
    { value: 'past',     label: 'events.past' },
];

const CATEGORY_LINKS = [
    { key: 'conference',    label: 'Conference',    Icon: Mic },
    { key: 'workshop',      label: 'Workshop',      Icon: Wrench },
    { key: 'sports',        label: 'Sports',        Icon: Trophy },
    { key: 'dinner',        label: 'Dinner',        Icon: UtensilsCrossed },
    { key: 'entertainment', label: 'Entertainment', Icon: Music },
    { key: 'exhibition',    label: 'Exhibition',    Icon: Globe2 },
];

export default function EventsIndex({ events, currentStatus, banners, canonicalUrl }: Props) {
    const { t } = useTranslation();
    const ogImage = banners[0]?.image_url ?? null;

    const handleFilter = (status: string) => {
        router.get('/events', status !== 'all' ? { status } : {}, { preserveScroll: false });
    };

    return (
        <PublicLayout>
            <Head>
                <title>Events | Takaful4All Events</title>
                <meta name="description" content="Browse all upcoming and past events by Takaful4All — conferences, webinars, workshops and more." />
                <link rel="canonical" href={canonicalUrl} />
                <meta property="og:type" content="website" />
                <meta property="og:url" content={canonicalUrl} />
                <meta property="og:title" content="Events | Takaful4All Events" />
                <meta property="og:description" content="Browse all upcoming and past events by Takaful4All — conferences, webinars, workshops and more." />
                <meta property="og:site_name" content="Takaful4All Events" />
                {ogImage ? <meta property="og:image" content={ogImage} /> : null}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Events | Takaful4All Events" />
                <meta name="twitter:description" content="Browse all upcoming and past events by Takaful4All — conferences, webinars, workshops and more." />
                {ogImage ? <meta name="twitter:image" content={ogImage} /> : null}
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
                    '@context': 'https://schema.org',
                    '@type': 'ItemList',
                    itemListElement: events.data.map((event, i) => ({
                        '@type': 'ListItem',
                        position: i + 1,
                        item: {
                            '@type': 'Event',
                            name: event.title,
                            url: `${window.location.origin}/events/${event.slug}`,
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
                        },
                    })),
                }) }} />
            </Head>

            {/* ── HERO ── */}
            <section className="relative overflow-hidden -mt-16" style={{ background: '#071B2A' }}>
                {/* Dot grid */}
                <div className="absolute inset-0 pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
                {/* Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[280px] rounded-full opacity-20 pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse at center, #18C8FF 0%, transparent 70%)' }} />
                <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 md:pb-28 text-center" style={{ paddingTop: '7rem' }}>
                    <h1 style={{ color: '#fff', fontFamily: POPPINS, fontSize: '2.25rem', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                        Browse Events
                    </h1>
                    <p className="mt-3" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: INTER, fontSize: '1.125rem' }}>
                        Explore takaful conferences, workshops, sports events and more — all in one place.
                    </p>
                </div>
            </section>

            {/* ── CONTENT ── */}
            <section
                className="relative z-10 -mt-10 py-14 rounded-t-3xl rounded-b-3xl overflow-hidden bg-gradient-to-b from-[#EBF5FA] dark:from-background to-[#ddeef6] dark:to-background"
            >
                {/* Subtle dot-grid depth */}
                <div className="absolute inset-0 pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(circle, rgba(0,159,187,0.05) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* ── Featured banners carousel ── */}
                    {banners.length > 0 && (
                        <div className="mb-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4" style={{ color: '#18C8FF' }} strokeWidth={2} />
                                    <span style={{ fontFamily: POPPINS, fontSize: '0.95rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', background: 'linear-gradient(90deg, #009FBB, #18C8FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                        Featured Highlights
                                    </span>
                                </div>
                            </div>
                            <div className="rounded-2xl overflow-hidden" style={{ boxShadow: '0 4px 32px rgba(0,159,187,0.12), 0 0 0 1.5px rgba(0,159,187,0.15)' }}>
                                <HeroCarousel banners={banners} contained />
                            </div>
                        </div>
                    )}

                    {/* ── Browse toolbar ── */}
                    <div className="mb-8">
                        {/* ── Events section label ── */}
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-[3px] h-7 rounded-full" style={{ background: 'linear-gradient(180deg, #18C8FF, #009FBB)' }} />
                            <span style={{ fontFamily: POPPINS, fontSize: '1.15rem', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase' }} className="text-[#071B2A] dark:text-foreground">
                                {currentStatus === 'upcoming' ? 'Upcoming Events' : currentStatus === 'past' ? 'Past Events' : 'All Events'}
                            </span>
                        </div>
                        {/* Status filters */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                            <div className="flex flex-wrap gap-2">
                                {STATUS_FILTERS.map(f => {
                                    const isActive = currentStatus === f.value;
                                    return (
                                        <button key={f.value}
                                            onClick={() => handleFilter(f.value)}
                                            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${!isActive ? 'bg-white/70 dark:bg-card text-[#071B2A]/60 dark:text-muted-foreground border border-white/90 dark:border-border' : ''}`}
                                            style={isActive
                                                ? { background: 'linear-gradient(90deg, #009FBB, #18C8FF)', color: '#fff', border: '1.5px solid transparent', boxShadow: '0 2px 10px rgba(0,159,187,0.28)', fontFamily: INTER }
                                                : { fontFamily: INTER }
                                            }>
                                            {t(f.label)}
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="text-sm font-medium dark:text-muted-foreground" style={{ fontFamily: INTER, whiteSpace: 'nowrap' }}>
                                <span className="font-bold text-[#071B2A] dark:text-foreground">{events.total}</span>
                                {' '}event{events.total !== 1 ? 's' : ''} found
                            </p>
                        </div>
                        {/* Category chips */}
                        <div className="flex flex-wrap gap-2">
                            {CATEGORY_LINKS.map(({ key, label, Icon }) => (
                                <Link key={key}
                                    href={`/events?category=${key}`}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all bg-white/60 dark:bg-card text-[#071B2A]/65 dark:text-muted-foreground border border-white/90 dark:border-border"
                                    style={{ fontFamily: INTER }}>
                                    <Icon className="w-3.5 h-3.5" style={{ color: '#009FBB' }} strokeWidth={2} />
                                    {label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Event grid */}
                    {events.data.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            {events.data.map(event => (
                                <EventCard key={event.id} event={event} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-24 flex flex-col items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                                style={{ background: 'rgba(0,159,187,0.10)', border: '1px solid rgba(0,159,187,0.2)' }}>
                                <CalendarDays className="w-8 h-8" style={{ color: '#009FBB' }} strokeWidth={1.5} />
                            </div>
                            <p className="text-base font-semibold text-[#071B2A] dark:text-foreground" style={{ fontFamily: POPPINS }}>
                                {t('events.no_events')}
                            </p>
                            <p className="text-sm dark:text-muted-foreground" style={{ fontFamily: INTER }}>
                                {t('events.try_filter')}
                            </p>
                        </div>
                    )}

                    {/* Pagination */}
                    {events.last_page > 1 && (
                        <div className="mt-12 flex items-center justify-center gap-1.5 flex-wrap">
                            {events.links.map((link, i) => (
                                <Link
                                    key={i}
                                    href={link.url ?? '#'}
                                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${!link.active && link.url ? 'bg-white dark:bg-card text-[#071B2A]/65 dark:text-muted-foreground border border-[#ddeef6] dark:border-border' : !link.active ? 'bg-transparent text-[#b8d5e2] dark:text-muted-foreground/40 border border-[#ddeef6] dark:border-border cursor-not-allowed' : ''}`}
                                    style={link.active
                                        ? { background: 'linear-gradient(90deg, #009FBB, #18C8FF)', color: '#fff', border: '1.5px solid transparent', boxShadow: '0 2px 10px rgba(0,159,187,0.28)', fontFamily: INTER }
                                        : { fontFamily: INTER }
                                    }
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


