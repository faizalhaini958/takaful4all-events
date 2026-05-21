import PublicLayout from '@/Layouts/PublicLayout';
import EventCard from '@/Components/EventCard';
import ShareButtons from '@/Components/ShareButtons';
import { Head, Link } from '@inertiajs/react';
import { Calendar, Clock, MapPin, ExternalLink, ChevronRight, ChevronLeft, Ticket, FolderOpen, Info, HelpCircle, Map as MapIcon, ChevronDown, LayoutTemplate, ChevronUp } from 'lucide-react';
import { type Event, type EventTicket, type EventZone } from '@/types';
import { useTranslation } from '@/hooks/use-translation';
import { useAnalytics } from '@/hooks/use-analytics';
import { useState, useEffect, useRef } from 'react';
import { Tab } from '@headlessui/react';

interface Props {
    event: Event;
    related: Event[];
    ogUrl: string;
}

const STATUS_CONFIG: Record<string, { labelKey: string; dotClass: string; textClass: string; bgClass: string }> = {
    upcoming: { labelKey: 'Upcoming',   dotClass: 'bg-emerald-400', textClass: 'text-emerald-700', bgClass: 'bg-emerald-50' },
    past:     { labelKey: 'Past Event', dotClass: 'bg-gray-400',    textClass: 'text-gray-500',    bgClass: 'bg-gray-50'    },
    draft:    { labelKey: 'Draft',      dotClass: 'bg-amber-400',   textClass: 'text-amber-700',   bgClass: 'bg-amber-50'   },
};

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ');
}

// ─── Related Events Carousel ──────────────────────────────────────────────────
const DESKTOP_PAGE_SIZE = 3;

function RelatedEventsCarousel({ related, t }: { related: Event[]; t: (k: string) => string }) {
    const [page, setPage] = useState(0);
    const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640);
    const mobileTrackRef = useRef<HTMLDivElement | null>(null);
    const pageSize = isMobile ? 1 : DESKTOP_PAGE_SIZE;
    const totalPages = Math.ceil(related.length / pageSize);
    const visible = related.slice(page * pageSize, page * pageSize + pageSize);
    const hasPrev = page > 0;
    const hasNext = page < totalPages - 1;

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 640);
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (page > totalPages - 1) {
            setPage(Math.max(0, totalPages - 1));
        }
    }, [page, totalPages]);

    useEffect(() => {
        if (!isMobile || !mobileTrackRef.current) return;
        const track = mobileTrackRef.current;
        track.scrollTo({ left: page * track.clientWidth, behavior: 'smooth' });
    }, [page, isMobile]);

    const handleMobileScroll = () => {
        if (!mobileTrackRef.current) return;
        const track = mobileTrackRef.current;
        const nextPage = Math.round(track.scrollLeft / track.clientWidth);
        if (nextPage !== page) setPage(nextPage);
    };

    return (
        <div className="mt-10 rounded-3xl px-6 sm:px-8 py-10" style={{ background: 'linear-gradient(145deg, #071B2A 0%, #0a3352 50%, #071B2A 100%)' }}>
            {/* Dot grid */}
            <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
            {/* Header */}
            <div className="flex items-end justify-between mb-8">
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#18C8FF' }}>Upcoming</p>
                    <h2 className="text-2xl font-extrabold text-white">{t('event.more_events')}</h2>
                    <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>Discover more exciting events curated for you.</p>
                </div>
                <Link
                    href="/events"
                    className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full transition-all"
                    style={{ color: '#18C8FF', border: '1px solid rgba(24,200,255,0.3)', background: 'rgba(24,200,255,0.08)' }}>
                    {t('event.view_all')} <ChevronRight className="w-3.5 h-3.5" />
                </Link>
            </div>

            {/* Cards + side arrows */}
            {isMobile ? (
                <div
                    ref={mobileTrackRef}
                    onScroll={handleMobileScroll}
                    className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                    {related.map(e => (
                        <div key={e.id} className="min-w-full snap-start">
                            <EventCard event={e} />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="relative px-0 sm:px-8">
                    {totalPages > 1 && (
                        <button
                            type="button"
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            disabled={!hasPrev}
                            className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full border shadow-md items-center justify-center transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                            style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)' }}>
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {visible.map(e => <EventCard key={e.id} event={e} />)}
                    </div>

                    {totalPages > 1 && (
                        <button
                            type="button"
                            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                            disabled={!hasNext}
                            className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full border shadow-md items-center justify-center transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                            style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)' }}>
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    )}
                </div>
            )}

            {/* Dot indicators + mobile View All */}
            <div className="flex items-center justify-between mt-6 sm:mt-8 px-0 sm:px-8">
                <Link
                    href="/events"
                    className="sm:hidden inline-flex items-center gap-1 text-sm font-semibold"
                    style={{ color: '#18C8FF' }}>
                    {t('event.view_all')} <ChevronRight className="w-3.5 h-3.5" />
                </Link>
                {totalPages > 1 ? (
                    <div className="flex items-center gap-2 mx-auto">
                        {Array.from({ length: totalPages }).map((_, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => setPage(i)}
                                className={`h-2.5 rounded-full transition-all duration-300 ${
                                    i === page
                                        ? 'w-7'
                                        : 'w-2.5 hover:bg-white/40'
                                }`}
                                style={{ background: i === page ? '#18C8FF' : 'rgba(255,255,255,0.2)' }}
                            />
                        ))}
                    </div>
                ) : <span />}
            </div>
        </div>
    );
}

export default function EventShow({ event, related, ogUrl }: Props) {
    const { t } = useTranslation();
    const { track } = useAnalytics();
    const [isStickyVisible, setIsStickyVisible] = useState(false);
    const POPPINS = "'Poppins', sans-serif";
    const INTER   = "'Inter', 'DM Sans', sans-serif";

    // Track genuine event detail view once on mount
    useEffect(() => {
        track('view', 'event_detail', event.slug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [event.slug]);
    const [isBackToTopVisible, setIsBackToTopVisible] = useState(false);
    const hasMobileStickyCta = isStickyVisible && event.status === 'upcoming';

    const startDate = new Date(event.start_at);
    const endDate = event.end_at ? new Date(event.end_at) : null;
    const location = [event.venue, event.city, event.state].filter(Boolean).join(', ');

    const faqs = (event.meta_json?.faqs as { question: string; answer: string }[]) ?? [];
    const sponsors = (event.meta_json?.sponsors as { name: string; role: string; logo_url: string; sort_order?: number }[]) ?? [];

    // Group sponsors by role, sorted by sort_order then insertion order
    const sponsorGroups = sponsors.reduce<{ role: string; sort_order: number; items: typeof sponsors }[]>((groups, sponsor) => {
        const existing = groups.find(g => g.role === sponsor.role);
        if (existing) {
            existing.items.push(sponsor);
        } else {
            groups.push({ role: sponsor.role, sort_order: sponsor.sort_order ?? 999, items: [sponsor] });
        }
        return groups;
    }, []).sort((a, b) => a.sort_order - b.sort_order);
    const customTabs = (event.meta_json?.custom_tabs as { label: string; type: 'text' | 'image'; content_html: string; images: { id: number; url: string }[] }[] | null) ?? [];

    const formatLongDate = (d: Date) =>
        d.toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    const formatTime = (d: Date) =>
        d.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', hour12: true });

    // Build ordered list of visible tabs (content-driven)
    // Fixed order: tickets → details → seating → faq → custom… → organiser → location
    const tabs = [
        { key: 'tickets',  label: 'Tickets',     icon: <Ticket className="w-4 h-4" />,      show: true },
        { key: 'details',  label: 'Details',      icon: <Info className="w-4 h-4" />,        show: !!event.content_html },
        { key: 'seating',  label: 'Seating Map',  icon: <MapIcon className="w-4 h-4" />,     show: !!event.venue_map },
        { key: 'faq',      label: 'FAQ',          icon: <HelpCircle className="w-4 h-4" />,  show: faqs.length > 0 },
        ...customTabs.filter(t => t.label.trim()).map((t, i) => ({
            key: `custom_${i}`,
            label: t.label,
            icon: t.type === 'image' ? <LayoutTemplate className="w-4 h-4" /> : <LayoutTemplate className="w-4 h-4" />,
            show: t.type === 'text' ? !!t.content_html : t.images.length > 0,
        })),
    ].filter(tab => tab.show);

    const [selectedTab, setSelectedTab] = useState(0);

    // Countdown timer
    const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });

    useEffect(() => {
        const calcCountdown = () => {
            const now = Date.now();
            const diff = startDate.getTime() - now;
            if (diff <= 0) {
                setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
                return;
            }
            setCountdown({
                days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((diff / (1000 * 60)) % 60),
                seconds: Math.floor((diff / 1000) % 60),
                expired: false,
            });
        };
        calcCountdown();
        const timer = setInterval(calcCountdown, 1000);
        return () => clearInterval(timer);
    }, [startDate]);

    // Scroll listener for mobile sticky bar
    useEffect(() => {
        const handleScroll = () => {
            setIsStickyVisible(window.scrollY > 400);
            setIsBackToTopVisible(window.scrollY > 500);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const onSaleTickets = event.tickets?.filter(t => t.is_on_sale) ?? [];
    const minPrice = onSaleTickets.length > 0 
        ? Math.min(...onSaleTickets.map(t => Number(t.current_price))) 
        : null;
    const maxPrice = onSaleTickets.length > 0
        ? Math.max(...onSaleTickets.map(t => Number(t.current_price)))
        : null;

    return (
        <PublicLayout>
            <Head>
                <title>{`${event.title} | Takaful4All Events`}</title>
                <meta name="description" content={event.excerpt ?? `Join us for ${event.title}. Register now on Takaful4All Events.`} />
                <link rel="canonical" href={ogUrl} />
                {/* Open Graph */}
                <meta property="og:type" content="website" />
                <meta property="og:url" content={ogUrl} />
                <meta property="og:title" content={`${event.title} | Takaful4All Events`} />
                <meta property="og:description" content={event.excerpt ?? `Join us for ${event.title}. Register now on Takaful4All Events.`} />
                {event.media?.url ? <meta property="og:image" content={event.media.url} /> : null}
                <meta property="og:site_name" content="Takaful4All Events" />
                {/* Twitter Card */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={`${event.title} | Takaful4All Events`} />
                <meta name="twitter:description" content={event.excerpt ?? `Join us for ${event.title}. Register now on Takaful4All Events.`} />
                {event.media?.url ? <meta name="twitter:image" content={event.media.url} /> : null}
                {/* Structured Data */}
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
                    '@context': 'https://schema.org',
                    '@type': 'Event',
                    name: event.title,
                    description: event.excerpt ?? `Join us for ${event.title}. Register now on Takaful4All Events.`,
                    startDate: event.start_at,
                    ...(event.end_at ? { endDate: event.end_at } : {}),
                    url: ogUrl,
                    ...(event.media?.url ? { image: event.media.url } : {}),
                    location: event.venue ? {
                        '@type': 'Place',
                        name: event.venue,
                        address: {
                            '@type': 'PostalAddress',
                            streetAddress: event.venue,
                            ...(event.city ? { addressLocality: event.city } : {}),
                            ...(event.state ? { addressRegion: event.state } : {}),
                            addressCountry: event.country ?? 'MY',
                        },
                    } : {
                        '@type': 'VirtualLocation',
                        url: ogUrl,
                    },
                    organizer: {
                        '@type': 'Organization',
                        name: 'Malaysian Takaful Association',
                        url: 'https://www.malaysiantakaful.com.my',
                    },
                    eventStatus: 'https://schema.org/EventScheduled',
                    eventAttendanceMode: event.venue
                        ? 'https://schema.org/OfflineEventAttendanceMode'
                        : 'https://schema.org/OnlineEventAttendanceMode',
                }) }} />
            </Head>

            <div className="relative z-10 rounded-t-3xl rounded-b-3xl overflow-hidden" style={{ background: 'linear-gradient(180deg, #EBF5FA 0%, #ddeef6 100%)' }}>
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgba(0,100,140,0.07) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
            <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">

                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-xs text-gray-400 mb-4" aria-label="Breadcrumb">
                    <Link href="/" className="hover:text-brand transition-colors py-1">Home</Link>
                    <ChevronRight className="w-3 h-3 flex-shrink-0" />
                    <Link href="/events" className="hover:text-brand transition-colors py-1">Events</Link>
                    <ChevronRight className="w-3 h-3 flex-shrink-0" />
                    <span className="text-gray-600 truncate max-w-[200px] sm:max-w-sm py-1">{event.title}</span>
                </nav>

                {/* Event Title */}
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">{event.title}</h1>

                {/* Two-column: Image + Share left, Info card right */}
                <div className="grid lg:grid-cols-12 gap-8 mb-8">
                    {/* Left: Image + Share buttons */}
                    <div className="lg:col-span-7 space-y-3">
                        {event.media ? (
                            <div className="rounded-xl overflow-hidden shadow-sm">
                                <img
                                    src={event.media.url}
                                    alt={event.media.alt ?? event.title}
                                    className="w-full h-auto block"
                                />
                            </div>
                        ) : (
                            <div className="rounded-xl bg-gray-100 border border-gray-200 aspect-[4/3] flex items-center justify-center">
                                <Ticket className="w-16 h-16 text-gray-300" />
                            </div>
                        )}
                        <ShareButtons url={ogUrl} title={event.title} />
                    </div>

                    {/* Right: Compact Event Info Card */}
                    <div className="lg:col-span-5">
                        <EventInfoCard
                            event={event}
                            onSaleTickets={onSaleTickets}
                            minPrice={minPrice}
                            maxPrice={maxPrice}
                            startDate={startDate}
                            endDate={endDate}
                            formatLongDate={formatLongDate}
                            formatTime={formatTime}
                            t={t}
                        />
                    </div>
                </div>

                {/* Tabs */}
                <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
                    <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm rounded-2xl mb-6 px-3 py-2 shadow-md" style={{ border: '1px solid rgba(0,159,187,0.15)' }}>
                        <Tab.List className="flex gap-1 sm:gap-2 overflow-x-auto scrollbar-none py-1">
                            {tabs.map(tab => (
                                <Tab key={tab.key} className={({ selected }) => classNames(
                                    'flex flex-shrink-0 items-center gap-1.5 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-sm sm:text-base font-semibold whitespace-nowrap outline-none transition-all',
                                    selected
                                        ? 'bg-brand text-white shadow-sm'
                                        : 'text-gray-500 hover:text-brand hover:bg-brand/5'
                                )}>
                                    {tab.icon} {tab.label}
                                </Tab>
                            ))}
                        </Tab.List>
                    </div>

                    <Tab.Panels>
                        {tabs.map(tab => (
                            <Tab.Panel key={tab.key} className="focus:outline-none">
                                <div className="flex flex-col items-center">
                                {tab.key === 'tickets' && (
                                    <div className="max-w-2xl w-full">
                                        <TicketPurchaseCard event={event} onSaleTickets={onSaleTickets} />
                                    </div>
                                )}
                                {tab.key === 'details' && (
                                    <div className="w-full max-w-3xl">
                                        {event.content_html ? (
                                            <article
                                                className="prose prose-base sm:prose-lg prose-headings:text-brand-navy prose-a:text-brand prose-strong:text-gray-900 max-w-none"
                                                dangerouslySetInnerHTML={{ __html: event.content_html }}
                                            />
                                        ) : (
                                            <p className="text-gray-400 italic py-8 text-center">No description available.</p>
                                        )}
                                        {event.gdrive_link && (
                                            <div className="mt-8">
                                                <a
                                                    href={event.gdrive_link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 font-semibold px-5 py-2.5 rounded-lg hover:bg-gray-50 transition-all text-sm"
                                                >
                                                    <FolderOpen className="w-4 h-4" />
                                                    {t('event.view_full_gallery')}
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {tab.key === 'seating' && event.venue_map && (
                                    <div className="rounded-xl overflow-hidden border border-gray-200 w-full max-w-2xl">
                                        <img src={event.venue_map.url} alt="Venue seating map" className="w-full h-auto" />
                                        {event.zones && event.zones.length > 0 && (
                                            <div className="flex flex-wrap gap-2 px-4 py-4 bg-gray-50 border-t border-gray-100">
                                                {event.zones.map(zone => (
                                                    <span
                                                        key={zone.id}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                                                        style={{ backgroundColor: zone.color, color: zone.label_color }}
                                                    >
                                                        {zone.name}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                                {tab.key === 'faq' && (
                                    <div className="space-y-2 max-w-2xl w-full">
                                        {faqs.map((faq, i) => (
                                            <details key={i} className="group p-4 rounded-xl border border-gray-200 bg-white open:border-brand/30 transition-all">
                                                <summary className="flex items-center justify-between font-semibold text-gray-900 cursor-pointer list-none">
                                                    {faq.question}
                                                    <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0 ml-4" />
                                                </summary>
                                                <p className="mt-3 text-gray-600 text-sm leading-relaxed">{faq.answer}</p>
                                            </details>
                                        ))}
                                    </div>
                                )}
                                {tab.key.startsWith('custom_') && (() => {
                                    const idx = parseInt(tab.key.replace('custom_', ''), 10);
                                    const ct = customTabs[idx];
                                    if (!ct) return null;
                                    if (ct.type === 'text') return (
                                        <div className="w-full max-w-3xl">
                                            <article
                                                className="prose prose-base sm:prose-lg prose-headings:text-brand-navy prose-a:text-brand prose-strong:text-gray-900 max-w-none"
                                                dangerouslySetInnerHTML={{ __html: ct.content_html }}
                                            />
                                        </div>
                                    );
                                    return (
                                        <div className="space-y-6 max-w-2xl w-full">
                                            {ct.images.map((img, i) => (
                                                <img
                                                    key={i}
                                                    src={img.url}
                                                    alt={`${ct.label} ${ct.images.length > 1 ? i + 1 : ''}`}
                                                    className="w-full h-auto rounded-xl border border-gray-200"
                                                />
                                            ))}
                                        </div>
                                    );
                                })()}
                                </div>
                            </Tab.Panel>
                        ))}
                    </Tab.Panels>
                </Tab.Group>

                {/* Event Organizer */}
                <div className="mt-8 rounded-xl overflow-hidden bg-white shadow-md" style={{ border: '1px solid rgba(0,159,187,0.12)' }}>
                    <div className="px-5 py-4 bg-gray-50" style={{ borderBottom: '1px solid rgba(0,159,187,0.1)' }}>
                        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Event Organizer</h2>
                    </div>
                    <div className="p-6 space-y-6">
                        {sponsorGroups.length > 0 ? (
                            sponsorGroups.map((group) => (
                                <div key={group.role}>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 text-center">{group.role}</p>
                                    <div className="flex flex-wrap justify-center gap-6">
                                        {group.items.map((sponsor, i) => (
                                            <div key={i} className="flex flex-col items-center gap-3 text-center">
                                                <div className="w-28 h-28 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center p-3 overflow-hidden">
                                                    {sponsor.logo_url ? (
                                                        <img src={sponsor.logo_url} alt={sponsor.name} className="max-w-full max-h-full object-contain" />
                                                    ) : (
                                                        <div className="w-full h-full border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-gray-400 text-xs font-semibold tracking-widest">LOGO</div>
                                                    )}
                                                </div>
                                                <p className="font-bold text-gray-900 text-sm">{sponsor.name}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center gap-3 text-center">
                                <div className="w-28 h-28 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center p-3 overflow-hidden">
                                    <img src="/images/logo.png" alt="MTA" className="max-w-full max-h-full object-contain" />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 text-sm">Malaysian Takaful Association</p>
                                    <p className="text-xs text-gray-500">Official Organizer</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Location */}
                {location && (
                    <div className="mt-8 rounded-xl overflow-hidden bg-white shadow-md" style={{ border: '1px solid rgba(0,159,187,0.12)' }}>
                        <div className="px-5 py-4 bg-gray-50" style={{ borderBottom: '1px solid rgba(0,159,187,0.1)' }}>
                            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Location</h2>
                        </div>
                        <div className="p-4 space-y-4">
                        <div className="rounded-xl overflow-hidden border border-gray-200 h-[250px] sm:h-[380px]">
                            <iframe
                                title="Event venue map"
                                width="100%"
                                height="100%"
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                src={`https://maps.google.com/maps?q=${encodeURIComponent(location)}&output=embed`}
                                className="w-full h-full border-0"
                            />
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-brand mt-0.5 flex-shrink-0" />
                                <div>
                                    {event.venue && <p className="font-semibold text-gray-900">{event.venue}</p>}
                                    <p className="text-sm text-gray-500">{[event.city, event.state].filter(Boolean).join(', ')}</p>
                                </div>
                            </div>
                            <a
                                href={`https://maps.google.com/?q=${encodeURIComponent(location)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 border border-gray-200 text-gray-700 font-semibold px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-all text-sm w-full sm:w-auto sm:flex-shrink-0"
                            >
                                Get Directions <ExternalLink className="w-4 h-4" />
                            </a>
                        </div>
                        </div>
                    </div>
                )}

                {/* Related Events */}
                {related.length > 0 && (
                    <RelatedEventsCarousel related={related} t={t} />
                )}
            </div>
            </div>

            {/* Back To Top */}
            {isBackToTopVisible && (
                <button
                    type="button"
                    onClick={scrollToTop}
                    aria-label="Back to top"
                    className={`fixed right-4 sm:right-6 lg:right-8 ${hasMobileStickyCta ? 'bottom-24' : 'bottom-4'} sm:bottom-6 z-40 inline-flex items-center justify-center rounded-full bg-brand text-white shadow-lg shadow-brand/30 w-10 h-10 sm:w-auto sm:h-auto sm:px-4 sm:py-2.5 text-sm font-semibold hover:bg-brand-dark transition-all`}
                >
                    <ChevronUp className="w-4 h-4" />
                    <span className="hidden sm:inline">Back to Top</span>
                </button>
            )}

            {/* Mobile Sticky Bottom CTA */}
            {isStickyVisible && event.status === 'upcoming' && (
                <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4 flex items-center justify-between z-50">
                    <div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Price</p>
                        <p className="text-lg font-bold text-brand-navy">
                            {minPrice === null ? 'Free'
                                : minPrice === 0 ? 'Free'
                                : (maxPrice !== null && maxPrice > minPrice)
                                    ? `RM ${minPrice.toFixed(2)} – RM ${maxPrice.toFixed(2)}`
                                    : `RM ${minPrice.toFixed(2)}`}
                        </p>
                    </div>
                    {event.is_registration_open ? (
                        <Link
                            href={`/events/${event.slug}/register`}
                            className="bg-brand text-white px-6 py-3 rounded-lg font-bold text-sm active:scale-95 transition-all"
                            onClick={() => track('click', 'register_button', event.slug)}
                        >
                            {t('event.register_now')}
                        </Link>
                    ) : (
                        <div className="text-gray-400 font-semibold text-sm bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
                            {t('event.closed')}
                        </div>
                    )}
                </div>
            )}
        </PublicLayout>
    );
}

function EventInfoCard({ event, onSaleTickets, minPrice, maxPrice, startDate, endDate, formatLongDate, formatTime, t }: {
    event: Event;
    onSaleTickets: EventTicket[];
    minPrice: number | null;
    maxPrice: number | null;
    startDate: Date;
    endDate: Date | null;
    formatLongDate: (d: Date) => string;
    formatTime: (d: Date) => string;
    t: (key: string) => string;
}) {
    const statusCfg = STATUS_CONFIG[event.status] ?? STATUS_CONFIG.draft;
    const dayOfWeek = startDate.toLocaleDateString('en-MY', { weekday: 'long' });
    const { track } = useAnalytics();

    const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });

    useEffect(() => {
        const calc = () => {
            const diff = startDate.getTime() - Date.now();
            if (diff <= 0) {
                setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
                return;
            }
            setCountdown({
                days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((diff / (1000 * 60)) % 60),
                seconds: Math.floor((diff / 1000) % 60),
                expired: false,
            });
        };
        calc();
        const timer = setInterval(calc, 1000);
        return () => clearInterval(timer);
    }, [startDate]);

    return (
        <div className="rounded-2xl overflow-hidden bg-white shadow-lg" style={{ border: '1px solid rgba(0,159,187,0.15)' }}>
            {/* Card top header */}
            <div className="px-5 py-4 flex items-center justify-between gap-3 bg-gray-50" style={{ borderBottom: '1px solid rgba(0,159,187,0.1)' }}>
                {/* Pulsing status badge */}
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${statusCfg.bgClass} ${statusCfg.textClass}`}>
                    {event.status === 'upcoming' ? (
                        <span className="relative flex h-2 w-2">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${statusCfg.dotClass}`} />
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${statusCfg.dotClass}`} />
                        </span>
                    ) : (
                        <span className={`inline-flex rounded-full h-2 w-2 ${statusCfg.dotClass}`} />
                    )}
                    {statusCfg.labelKey}
                </span>

                {/* Calendar tear-off chip */}
                <div className="flex-shrink-0 rounded-xl overflow-hidden shadow-sm text-center w-12" style={{ border: '1px solid rgba(0,159,187,0.2)' }}>
                    <div className="bg-brand px-1 py-0.5">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-white leading-none">
                            {startDate.toLocaleDateString('en-MY', { month: 'short' })}
                        </p>
                    </div>
                    <div className="bg-white px-1 py-1">
                        <p className="text-lg font-extrabold leading-none text-gray-900">
                            {startDate.getDate()}
                        </p>
                        <p className="text-[9px] text-gray-400 font-semibold leading-none mt-0.5">
                            {startDate.toLocaleDateString('en-MY', { weekday: 'short' })}
                        </p>
                    </div>
                </div>
            </div>

            {/* Countdown */}
            {event.status === 'upcoming' && !countdown.expired && (
                <div className="px-5 py-5" style={{ background: 'rgba(0,159,187,0.04)', borderBottom: '1px solid rgba(0,159,187,0.1)' }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-center mb-3" style={{ color: 'rgba(0,100,140,0.55)' }}>Event starts in</p>
                    <div className="grid grid-cols-4 gap-2">
                        {[
                            { value: countdown.days, label: 'Days' },
                            { value: countdown.hours, label: 'Hours' },
                            { value: countdown.minutes, label: 'Mins' },
                            { value: countdown.seconds, label: 'Secs' },
                        ].map((unit) => (
                            <div key={unit.label} className="flex flex-col items-center bg-white rounded-xl py-3 shadow-sm" style={{ border: '1px solid rgba(0,159,187,0.15)' }}>
                                <span className="text-2xl font-extrabold tabular-nums leading-none text-brand">
                                    {String(unit.value).padStart(2, '0')}
                                </span>
                                <span className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 mt-1">
                                    {unit.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="divide-y divide-gray-100">
                {/* Date */}
                <div className="group flex items-center gap-3 px-5 py-4 border-l-2 border-transparent hover:border-brand hover:bg-brand/[0.02] transition-all">
                    <div className="w-9 h-9 rounded-xl bg-brand/10 group-hover:bg-brand/15 flex items-center justify-center flex-shrink-0 transition-colors">
                        <Calendar className="w-4 h-4 text-brand" />
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-0.5">Date</p>
                        <p className="text-sm font-semibold text-gray-900">{formatLongDate(startDate)}</p>
                    </div>
                </div>

                {/* Time */}
                <div className="group flex items-center gap-3 px-5 py-4 border-l-2 border-transparent hover:border-brand hover:bg-brand/[0.02] transition-all">
                    <div className="w-9 h-9 rounded-xl bg-brand/10 group-hover:bg-brand/15 flex items-center justify-center flex-shrink-0 transition-colors">
                        <Clock className="w-4 h-4 text-brand" />
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-0.5">Time</p>
                        <p className="text-sm font-semibold text-gray-900">
                            {formatTime(startDate)}{endDate && ` – ${formatTime(endDate)}`}
                        </p>
                    </div>
                </div>

                {/* Venue */}
                {event.venue && (
                    <div className="group flex items-center gap-3 px-5 py-4 border-l-2 border-transparent hover:border-brand hover:bg-brand/[0.02] transition-all">
                        <div className="w-9 h-9 rounded-xl bg-brand/10 group-hover:bg-brand/15 flex items-center justify-center flex-shrink-0 transition-colors">
                            <MapPin className="w-4 h-4 text-brand" />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-0.5">Venue</p>
                            <p className="text-sm font-semibold text-gray-900">{event.venue}</p>
                            {(event.city || event.state) && (
                                <p className="text-xs text-brand/70">{[event.city, event.state].filter(Boolean).join(', ')}</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Price */}
                {onSaleTickets.length > 0 && (
                    <div className="group flex items-center gap-3 px-5 py-4 border-l-2 border-transparent hover:border-brand hover:bg-brand/[0.02] transition-all">
                        <div className="w-9 h-9 rounded-xl bg-brand/10 group-hover:bg-brand/15 flex items-center justify-center flex-shrink-0 transition-colors">
                            <Ticket className="w-4 h-4 text-brand" />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-0.5">Price</p>
                            <p className="text-sm font-semibold text-gray-900">
                                {minPrice === 0 ? 'Free' : minPrice !== null
                                    ? (maxPrice !== null && maxPrice > minPrice
                                        ? `RM ${minPrice.toFixed(2)} – RM ${maxPrice.toFixed(2)}`
                                        : `RM ${minPrice.toFixed(2)}`)
                                    : 'Free'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Register button */}
                <div className="px-5 py-4">
                    {event.rsvp_enabled && event.is_registration_open && event.status === 'upcoming' ? (
                        <Link
                            href={`/events/${event.slug}/register`}
                            className="flex items-center justify-center gap-2 w-full bg-brand text-white font-bold px-5 py-3 rounded-xl hover:bg-brand-dark transition-all text-sm"
                            onClick={() => track('click', 'register_button', event.slug)}
                        >
                            <Ticket className="w-4 h-4" /> {t('event.register_now')}
                        </Link>
                    ) : !event.rsvp_enabled && event.registration_url && event.status === 'upcoming' ? (
                        <a
                            href={event.registration_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full bg-brand text-white font-bold px-5 py-3 rounded-xl hover:bg-brand-dark transition-all text-sm"
                            onClick={() => track('click', 'register_button', event.slug)}
                        >
                            {t('event.register_now')} <ExternalLink className="w-4 h-4" />
                        </a>
                    ) : (
                        <div className="flex items-center justify-center w-full bg-gray-50 text-gray-400 font-semibold px-5 py-3 rounded-xl border border-gray-200 text-sm">
                            {event.status === 'past' ? t('event.registration_closed') : t('event.registration_coming_soon')}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function TicketPurchaseCard({ event, onSaleTickets }: { event: Event; onSaleTickets: EventTicket[] }) {
    const { t } = useTranslation();
    const zones = event.zones ?? [];

    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-md">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
                <h3 className="text-sm font-bold text-gray-900">🎟 Ticket Information</h3>
            </div>
            <div className="p-5">
                <div className="space-y-4 pr-2">
                    {onSaleTickets.length > 0 && event.status !== 'past' ? (
                        <>
                            {zones.length > 0 ? (
                                <div className="space-y-6">
                                    {zones.map(zone => {
                                        const zoneTickets = onSaleTickets.filter(t => t.event_zone_id === zone.id);
                                        if (zoneTickets.length === 0) return null;
                                        return (
                                            <div key={zone.id} className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-4 rounded-full" style={{ backgroundColor: zone.color }} />
                                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{zone.name}</span>
                                                </div>
                                                {zoneTickets.map(ticket => (
                                                    <TicketCardItem key={ticket.id} ticket={ticket} />
                                                ))}
                                            </div>
                                        );
                                    })}
                                    {/* Unzoned tickets */}
                                    {onSaleTickets.filter(t => !t.event_zone_id).length > 0 && (
                                        <div className="space-y-3 pt-2">
                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{t('event.general_tickets')}</span>
                                            {onSaleTickets.filter(t => !t.event_zone_id).map(ticket => (
                                                <TicketCardItem key={ticket.id} ticket={ticket} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                onSaleTickets.map(ticket => (
                                    <TicketCardItem key={ticket.id} ticket={ticket} />
                                ))
                            )}
                        </>
                    ) : event.status !== 'past' ? (
                        <div className="text-center py-8">
                            <Ticket className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                            <p className="text-gray-500 font-medium">{t('event.no_tickets_available')}</p>
                        </div>
                    ) : null}
                </div>


            </div>
        </div>
    );
}

function TicketCardItem({ ticket }: { ticket: EventTicket }) {
    const isSoldOut = ticket.available_count !== null && ticket.available_count <= 0;
    const isLowStock = !isSoldOut && ticket.available_count !== null && ticket.available_count <= 10;
    const savings = ticket.is_early_bird && ticket.price && ticket.early_bird_price
        ? Number(ticket.price) - Number(ticket.early_bird_price)
        : 0;

    const DESCRIPTION_THRESHOLD = 100;
    const isLongDescription = ticket.description && ticket.description.length > DESCRIPTION_THRESHOLD;
    const [descExpanded, setDescExpanded] = useState(false);

    return (
        <div className={classNames(
            "rounded-2xl border-2 transition-all group overflow-hidden",
            isSoldOut ? "border-gray-100 bg-gray-50 opacity-60" : "border-gray-100 hover:border-brand/40 bg-white"
        )}>
            {/* Main content */}
            <div className="p-4">
                {/* Name row */}
                <div className="flex items-center gap-2 flex-wrap mb-2">
                    <p className={classNames(
                        "font-bold text-base transition-colors",
                        isSoldOut ? "text-gray-400" : "text-gray-900 group-hover:text-brand"
                    )}>{ticket.name}</p>
                    {ticket.is_early_bird && (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0">
                            Early Bird
                        </span>
                    )}
                    {isSoldOut && (
                        <span className="bg-red-100 text-red-600 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0">
                            Sold Out
                        </span>
                    )}
                    {isLowStock && (
                        <span className="bg-orange-100 text-orange-600 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0 animate-pulse">
                            Only {ticket.available_count} left
                        </span>
                    )}
                </div>

                {/* Description with collapse */}
                {ticket.description && (
                    <div>
                        <p className="text-sm text-gray-500 leading-relaxed">
                            {isLongDescription && !descExpanded
                                ? `${ticket.description.slice(0, DESCRIPTION_THRESHOLD)}…`
                                : ticket.description}
                        </p>
                        {isLongDescription && (
                            <button
                                onClick={() => setDescExpanded(prev => !prev)}
                                className="mt-1 text-xs font-semibold text-brand hover:text-brand-dark transition-colors"
                            >
                                {descExpanded ? 'Show less' : 'Show more'}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Price footer bar */}
            <div className={classNames(
                "px-4 py-3 border-t flex items-center justify-between",
                isSoldOut ? "bg-gray-50 border-gray-100" : "bg-brand/5 border-brand/10"
            )}>
                <div>
                    {ticket.type === 'free' ? (
                        <p className="text-lg font-extrabold text-emerald-600">FREE</p>
                    ) : (
                        <div className="flex items-baseline gap-2">
                            <p className={classNames(
                                "text-lg font-extrabold",
                                isSoldOut ? "text-gray-400" : "text-brand-navy"
                            )}>
                                RM {Number(ticket.current_price).toFixed(2)}
                            </p>
                            {ticket.is_early_bird && ticket.price > ticket.current_price && (
                                <p className="text-xs text-gray-400 line-through">RM {Number(ticket.price).toFixed(2)}</p>
                            )}
                        </div>
                    )}
                    {savings > 0 && (
                        <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Save RM {savings.toFixed(2)}</p>
                    )}
                </div>
                {!isSoldOut && (
                    <span className={classNames(
                        "inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full",
                        isLowStock
                            ? "bg-orange-100 text-orange-600"
                            : "bg-emerald-100 text-emerald-700"
                    )}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />
                        {isLowStock ? 'Low Stock' : 'Available'}
                    </span>
                )}
            </div>
        </div>
    );
}
