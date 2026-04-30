import PublicLayout from '@/Layouts/PublicLayout';
import EventCard from '@/Components/EventCard';
import ShareButtons from '@/Components/ShareButtons';
import { Head, Link } from '@inertiajs/react';
import { Calendar, Clock, MapPin, ExternalLink, ChevronRight, Ticket, FolderOpen, Check, Star, Info, HelpCircle, Map as MapIcon, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { type Event, type EventTicket, type EventZone } from '@/types';
import { useTranslation } from '@/hooks/use-translation';
import { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';

interface Props {
    event: Event;
    related: Event[];
    ogUrl: string;
}

const STATUS_CONFIG: Record<string, { labelKey: string; classes: string }> = {
    upcoming: { labelKey: 'Upcoming', classes: 'bg-emerald-100 text-emerald-800 border border-emerald-200' },
    past:     { labelKey: 'Past Event',     classes: 'bg-gray-100 text-gray-600 border border-gray-200' },
    draft:    { labelKey: 'Draft',     classes: 'bg-yellow-100 text-yellow-800 border border-yellow-200' },
};

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ');
}

export default function EventShow({ event, related, ogUrl }: Props) {
    const { t } = useTranslation();
    const [selectedTab, setSelectedTab] = useState(0);
    const [isStickyVisible, setIsStickyVisible] = useState(false);

    const startDate = new Date(event.start_at);
    const endDate = event.end_at ? new Date(event.end_at) : null;
    const location = [event.venue, event.city, event.state].filter(Boolean).join(', ');

    const faqs = (event.meta_json?.faqs as { question: string; answer: string }[]) ?? [];
    const sponsors = (event.meta_json?.sponsors as { name: string; role: string; logo_url: string }[]) ?? [];

    const formatLongDate = (d: Date) =>
        d.toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    const formatShortDate = (d: Date) =>
        d.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' });

    const formatTime = (d: Date) =>
        d.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', hour12: true });

    const statusCfg = STATUS_CONFIG[event.status] ?? STATUS_CONFIG.draft;

    // Scroll listener for mobile sticky bar
    useEffect(() => {
        const handleScroll = () => {
            setIsStickyVisible(window.scrollY > 400);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const onSaleTickets = event.tickets?.filter(t => t.is_on_sale) ?? [];
    const minPrice = onSaleTickets.length > 0 
        ? Math.min(...onSaleTickets.map(t => Number(t.current_price))) 
        : null;

    return (
        <PublicLayout>
            <Head>
                <title>{event.title}</title>
                <meta name="description" content={event.excerpt ?? `${event.title} — Takaful Events`} />
                {/* ... existing meta tags ... */}
            </Head>

            {/* ── Hero Section (Conversion Focused) ── */}
            <div className="relative bg-brand-navy pt-8 pb-12 lg:pt-16 lg:pb-24 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-navy via-brand-dark to-black opacity-90" />
                
                {/* Abstract background elements for premium feel */}
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-brand/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-72 h-72 bg-brand-light/5 rounded-full blur-3xl" />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-1.5 text-xs text-brand-light/60 mb-8" aria-label="Breadcrumb">
                        <Link href="/" className="hover:text-brand-light transition-colors">Home</Link>
                        <ChevronRight className="w-3 h-3" />
                        <Link href="/events" className="hover:text-brand-light transition-colors">Events</Link>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-brand-light truncate max-w-[150px] sm:max-w-xs">{event.title}</span>
                    </nav>

                    <div className="grid lg:grid-cols-12 gap-12 items-start">
                        {/* Left: Event Info */}
                        <div className="lg:col-span-7 xl:col-span-8">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/20 border border-brand/30 text-brand-light text-xs font-bold mb-6 uppercase tracking-wider">
                                <Star className="w-3 h-3 fill-brand" />
                                {statusCfg.labelKey}
                            </div>

                            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
                                {event.title}
                            </h1>

                            <div className="grid sm:grid-cols-2 gap-6 mb-8 text-brand-light/90">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 border border-white/10">
                                        <Calendar className="w-5 h-5 text-brand" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-brand-light/50 font-medium uppercase tracking-wider">Date</p>
                                        <p className="font-semibold">{formatLongDate(startDate)}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 border border-white/10">
                                        <Clock className="w-5 h-5 text-brand" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-brand-light/50 font-medium uppercase tracking-wider">Time</p>
                                        <p className="font-semibold">{formatTime(startDate)} {endDate && `– ${formatTime(endDate)}`}</p>
                                    </div>
                                </div>
                                {event.venue && (
                                    <div className="flex items-start gap-3 sm:col-span-2">
                                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 border border-white/10">
                                            <MapPin className="w-5 h-5 text-brand" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-brand-light/50 font-medium uppercase tracking-wider">Location</p>
                                            <p className="font-semibold">{event.venue}</p>
                                            <p className="text-xs text-brand-light/60">{[event.city, event.state].filter(Boolean).join(', ')}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {event.excerpt && (
                                <p className="text-lg text-brand-light/80 leading-relaxed max-w-2xl border-l-4 border-brand pl-6">
                                    {event.excerpt}
                                </p>
                            )}
                        </div>

                        {/* Right: Ticket Card (Desktop Sticky) */}
                        <div className="hidden lg:block lg:col-span-5 xl:col-span-4 lg:sticky lg:top-24">
                            <TicketPurchaseCard event={event} onSaleTickets={onSaleTickets} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Ticket Section (Shown only on mobile, below hero) */}
            <div className="lg:hidden bg-white px-4 py-8 -mt-6 rounded-t-3xl relative z-10 shadow-2xl">
                <TicketPurchaseCard event={event} onSaleTickets={onSaleTickets} />
            </div>

            {/* ── Main Content Area ── */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid lg:grid-cols-12 gap-12">
                    <div className="lg:col-span-7 xl:col-span-8">
                        
                        {/* Event Featured Image */}
                        {event.media && (
                            <div className="mb-12 rounded-3xl overflow-hidden shadow-2xl ring-1 ring-black/5">
                                <img
                                    src={event.media.url}
                                    alt={event.media.alt ?? event.title}
                                    className="w-full aspect-[16/9] object-cover"
                                />
                            </div>
                        )}


                        {/* Tabs for Secondary Info */}
                        <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
                            <Tab.List className="flex space-x-1 rounded-2xl bg-gray-100 p-1 mb-8 overflow-x-auto">
                                <Tab className={({ selected }) => classNames(
                                    'w-full min-w-[120px] rounded-xl py-3 text-sm font-bold leading-5 transition-all outline-none',
                                    selected ? 'bg-white text-brand shadow-sm' : 'text-gray-500 hover:bg-white/40 hover:text-gray-700'
                                )}>
                                    <div className="flex items-center justify-center gap-2">
                                        <Info className="w-4 h-4" /> Overview
                                    </div>
                                </Tab>
                                {event.venue_map && (
                                    <Tab className={({ selected }) => classNames(
                                        'w-full min-w-[120px] rounded-xl py-3 text-sm font-bold leading-5 transition-all outline-none',
                                        selected ? 'bg-white text-brand shadow-sm' : 'text-gray-500 hover:bg-white/40 hover:text-gray-700'
                                    )}>
                                        <div className="flex items-center justify-center gap-2">
                                            <MapIcon className="w-4 h-4" /> View Seating
                                        </div>
                                    </Tab>
                                )}
                                {faqs.length > 0 && (
                                    <Tab className={({ selected }) => classNames(
                                        'w-full min-w-[120px] rounded-xl py-3 text-sm font-bold leading-5 transition-all outline-none',
                                        selected ? 'bg-white text-brand shadow-sm' : 'text-gray-500 hover:bg-white/40 hover:text-gray-700'
                                    )}>
                                        <div className="flex items-center justify-center gap-2">
                                            <HelpCircle className="w-4 h-4" /> FAQ
                                        </div>
                                    </Tab>
                                )}
                            </Tab.List>

                            <Tab.Panels>
                                <Tab.Panel className="focus:outline-none">
                                    {event.content_html && (
                                        <article
                                            className="prose prose-lg prose-headings:text-brand-navy prose-a:text-brand prose-strong:text-gray-900 max-w-none bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm"
                                            dangerouslySetInnerHTML={{ __html: event.content_html }}
                                        />
                                    )}
                                    {event.gdrive_link && (
                                        <div className="mt-8">
                                            <a
                                                href={event.gdrive_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-3 bg-brand-navy text-white font-bold px-6 py-4 rounded-2xl hover:bg-brand transition-all shadow-lg hover:shadow-brand/20 active:scale-95"
                                            >
                                                <FolderOpen className="w-5 h-5" />
                                                {t('event.view_full_gallery')}
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                        </div>
                                    )}
                                </Tab.Panel>

                                {event.venue_map && (
                                    <Tab.Panel className="focus:outline-none">
                                        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm">
                                            <h3 className="text-xl font-bold text-brand-navy mb-6">{t('event.venue_seating_map')}</h3>
                                            <div className="rounded-2xl overflow-hidden border border-gray-200">
                                                <img
                                                    src={event.venue_map.url}
                                                    alt="Venue seating map"
                                                    className="w-full h-auto"
                                                />
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
                                        </div>
                                    </Tab.Panel>
                                )}

                                {faqs.length > 0 && (
                                    <Tab.Panel className="focus:outline-none">
                                        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                                            <h3 className="text-xl font-bold text-brand-navy mb-2">Frequently Asked Questions</h3>
                                            <div className="space-y-4">
                                                {faqs.map((faq, i) => (
                                                    <details key={i} className="group p-4 rounded-2xl border border-gray-100 bg-gray-50/50 open:bg-white open:border-brand/20 transition-all">
                                                        <summary className="flex items-center justify-between font-bold text-gray-900 cursor-pointer list-none">
                                                            {faq.question}
                                                            <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
                                                        </summary>
                                                        <p className="mt-3 text-gray-600 text-sm leading-relaxed">
                                                            {faq.answer}
                                                        </p>
                                                    </details>
                                                ))}
                                            </div>
                                        </div>
                                    </Tab.Panel>
                                )}
                            </Tab.Panels>
                        </Tab.Group>

                        {/* Share Row */}
                        <div className="mt-16 pt-10 border-t border-gray-200">
                            <ShareButtons url={ogUrl} title={event.title} />
                        </div>
                    </div>

                    {/* Right Column (Secondary Sidebar Items) */}
                    <aside className="lg:col-span-5 xl:col-span-4 space-y-8">
                        {/* Map Embed Card */}
                        {location && (
                            <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-xl ring-1 ring-black/5">
                                <div className="h-64 relative">
                                    <iframe
                                        title="Event venue map"
                                        width="100%"
                                        height="100%"
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                        src={`https://maps.google.com/maps?q=${encodeURIComponent(location)}&output=embed`}
                                        className="absolute inset-0"
                                    />
                                </div>
                                <div className="p-6">
                                    <p className="text-sm font-bold text-gray-900 mb-2">{event.venue}</p>
                                    <p className="text-xs text-gray-500 mb-4">{location}</p>
                                    <a
                                        href={`https://maps.google.com/?q=${encodeURIComponent(location)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center w-full gap-2 bg-brand-light text-brand font-bold px-4 py-3 rounded-xl hover:bg-brand hover:text-white transition-all text-sm"
                                    >
                                        Get Directions <ExternalLink className="w-4 h-4" />
                                    </a>
                                </div>
                            </div>
                        )}

                        {/* Sponsors & Organizers Card */}
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl ring-1 ring-black/5">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Partners &amp; Organizers</h3>
                            
                            <div className="space-y-8">
                                {sponsors.length > 0 ? (
                                    sponsors.map((sponsor, i) => (
                                        <div key={i} className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center p-2 overflow-hidden">
                                                {sponsor.logo_url ? (
                                                    <img src={sponsor.logo_url} alt={sponsor.name} className="max-w-full max-h-full object-contain" />
                                                ) : (
                                                    <Users className="w-8 h-8 text-gray-200" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-brand-navy leading-tight">{sponsor.name}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">{sponsor.role}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    /* Fallback to default organizer if none specified */
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center p-2">
                                            <img src="/images/logo.png" alt="MTA" className="max-w-full max-h-full object-contain" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-brand-navy">Malaysian Takaful Association</p>
                                            <p className="text-xs text-gray-500">Official Organizer</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {!sponsors.length && (
                                <p className="text-sm text-gray-600 leading-relaxed italic mt-6 pt-6 border-t border-gray-100">
                                    "Empowering the takaful industry through professional development and networking."
                                </p>
                            )}
                        </div>
                    </aside>
                </div>

                {/* Related Events */}
                {related.length > 0 && (
                    <div className="mt-24 pt-16 border-t border-gray-200">
                        <div className="flex items-end justify-between mb-10">
                            <div>
                                <h2 className="text-3xl font-extrabold text-brand-navy mb-2">{t('event.more_events')}</h2>
                                <p className="text-gray-500">Discover more exciting events curated for you.</p>
                            </div>
                            <Link href="/events" className="group text-sm font-bold text-brand hover:text-brand-dark flex items-center gap-2 transition-all">
                                {t('event.view_all')} 
                                <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center group-hover:translate-x-1 transition-transform">
                                    <ChevronRight className="w-4 h-4" />
                                </div>
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {related.map(e => <EventCard key={e.id} event={e} />)}
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile Sticky Bottom CTA */}
            {isStickyVisible && event.status === 'upcoming' && (
                <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4 flex items-center justify-between z-50 animate-in slide-in-from-bottom duration-300">
                    <div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Starting from</p>
                        <p className="text-lg font-extrabold text-brand-navy">
                            {minPrice !== null ? `RM ${minPrice.toFixed(2)}` : 'Free'}
                        </p>
                    </div>
                    {event.is_registration_open ? (
                        <Link
                            href={`/events/${event.slug}/register`}
                            className="bg-brand text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-brand/20 active:scale-95 transition-all"
                        >
                            {t('event.register_now')}
                        </Link>
                    ) : (
                        <div className="text-gray-400 font-bold text-sm bg-gray-50 px-4 py-2 rounded-lg border border-dashed border-gray-200">
                            {t('event.closed')}
                        </div>
                    )}
                </div>
            )}
        </PublicLayout>
    );
}

function TicketPurchaseCard({ event, onSaleTickets }: { event: Event; onSaleTickets: EventTicket[] }) {
    const { t } = useTranslation();
    const zones = event.zones ?? [];

    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl overflow-hidden ring-1 ring-black/5">
            <div className="bg-brand-navy px-6 py-6 text-white">
                <h3 className="text-lg font-bold mb-1">Get Your Tickets</h3>
                <p className="text-brand-light/60 text-xs">Secure & Instant Checkout</p>
            </div>
            
            <div className="p-6">
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                    {onSaleTickets.length > 0 ? (
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
                    ) : (
                        <div className="text-center py-8">
                            <Ticket className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                            <p className="text-gray-500 font-medium">{t('event.no_tickets_available')}</p>
                        </div>
                    )}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100">
                    {event.rsvp_enabled && event.is_registration_open && event.status === 'upcoming' ? (
                        <Link
                            href={`/events/${event.slug}/register`}
                            className="flex items-center justify-center gap-2 w-full bg-brand text-white font-bold text-base px-6 py-4 rounded-2xl hover:bg-brand-dark transition-all shadow-xl shadow-brand/20 active:scale-[0.98]"
                        >
                            <Ticket className="w-5 h-5" /> {t('event.register_now')}
                        </Link>
                    ) : !event.rsvp_enabled && event.registration_url && event.status === 'upcoming' ? (
                        <a
                            href={event.registration_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full bg-brand text-white font-bold text-base px-6 py-4 rounded-2xl hover:bg-brand-dark transition-all shadow-xl shadow-brand/20 active:scale-[0.98]"
                        >
                            {t('event.register_now')}
                            <ExternalLink className="w-5 h-5" />
                        </a>
                    ) : (
                        <div className="flex items-center justify-center w-full bg-gray-50 text-gray-400 font-bold text-base px-6 py-4 rounded-2xl border border-dashed border-gray-200">
                            {event.status === 'past' ? t('event.registration_closed') : t('event.registration_coming_soon')}
                        </div>
                    )}
                    <p className="text-center text-[10px] text-gray-400 mt-4 flex items-center justify-center gap-1.5 uppercase tracking-tighter">
                        <Star className="w-3 h-3" /> Best Price Guaranteed • Limited Seats Available
                    </p>
                </div>
            </div>
        </div>
    );
}

function TicketCardItem({ ticket }: { ticket: EventTicket }) {
    const isSoldOut = ticket.available_count !== null && ticket.available_count <= 0;
    const savings = ticket.is_early_bird && ticket.price && ticket.early_bird_price 
        ? Number(ticket.price) - Number(ticket.early_bird_price) 
        : 0;

    return (
        <div className={classNames(
            "p-4 rounded-2xl border-2 transition-all group",
            isSoldOut ? "border-gray-100 bg-gray-50 opacity-60" : "border-gray-100 hover:border-brand/30 hover:bg-brand/5"
        )}>
            <div className="flex justify-between items-start mb-2">
                <div>
                    <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-900 group-hover:text-brand transition-colors">{ticket.name}</p>
                        {ticket.is_early_bird && (
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Early Bird
                            </span>
                        )}
                    </div>
                    {ticket.description && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{ticket.description}</p>}
                </div>
                <div className="text-right">
                    {ticket.type === 'free' ? (
                        <p className="font-extrabold text-emerald-600">FREE</p>
                    ) : (
                        <div>
                            <p className="font-extrabold text-gray-900">RM {Number(ticket.current_price).toFixed(2)}</p>
                            {ticket.is_early_bird && ticket.price > ticket.current_price && (
                                <p className="text-[10px] text-gray-400 line-through">RM {Number(ticket.price).toFixed(2)}</p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-between mt-3">
                <div className="flex flex-col gap-1">
                    {ticket.available_count !== null && ticket.available_count > 0 && ticket.available_count <= 10 && (
                        <p className="text-[10px] text-orange-600 font-bold flex items-center gap-1 animate-pulse">
                            <Info className="w-3 h-3" /> Only {ticket.available_count} left!
                        </p>
                    )}
                    {savings > 0 && (
                        <p className="text-[10px] text-emerald-600 font-bold">
                            Save RM {savings.toFixed(2)} with Early Bird
                        </p>
                    )}
                    {isSoldOut && (
                        <p className="text-[10px] text-red-600 font-bold">Sold Out</p>
                    )}
                </div>
            </div>
        </div>
    );
}
