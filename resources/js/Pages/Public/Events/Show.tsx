import PublicLayout from '@/Layouts/PublicLayout';
import EventCard from '@/Components/EventCard';
import ShareButtons from '@/Components/ShareButtons';
import { Head, Link } from '@inertiajs/react';
import { Calendar, Clock, MapPin, ExternalLink, ChevronRight, Ticket, FolderOpen, Info, HelpCircle, Map as MapIcon, ChevronDown, Users, Shirt, LayoutTemplate } from 'lucide-react';
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
    const [isStickyVisible, setIsStickyVisible] = useState(false);

    const startDate = new Date(event.start_at);
    const endDate = event.end_at ? new Date(event.end_at) : null;
    const location = [event.venue, event.city, event.state].filter(Boolean).join(', ');

    const faqs = (event.meta_json?.faqs as { question: string; answer: string }[]) ?? [];
    const sponsors = (event.meta_json?.sponsors as { name: string; role: string; logo_url: string }[]) ?? [];
    const tshirtImages = (event.meta_json?.tshirt_images as { id: number; url: string }[] | null) ?? [];
    const customTabs = (event.meta_json?.custom_tabs as { label: string; type: 'text' | 'image'; content_html: string; images: { id: number; url: string }[] }[] | null) ?? [];

    const formatLongDate = (d: Date) =>
        d.toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    const formatTime = (d: Date) =>
        d.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', hour12: true });

    // Build ordered list of visible tabs (content-driven)
    // Fixed order: tickets → details → tshirt → seating → faq → custom… → organiser → location
    const tabs = [
        { key: 'tickets',  label: 'Tickets',     icon: <Ticket className="w-4 h-4" />,      show: true },
        { key: 'details',  label: 'Details',      icon: <Info className="w-4 h-4" />,        show: !!event.content_html },
        { key: 'tshirt',   label: 'T-shirt',      icon: <Shirt className="w-4 h-4" />,       show: tshirtImages.length > 0 },
        { key: 'seating',  label: 'Seating Map',  icon: <MapIcon className="w-4 h-4" />,     show: !!event.venue_map },
        { key: 'faq',      label: 'FAQ',          icon: <HelpCircle className="w-4 h-4" />,  show: faqs.length > 0 },
        ...customTabs.filter(t => t.label.trim()).map((t, i) => ({
            key: `custom_${i}`,
            label: t.label,
            icon: t.type === 'image' ? <LayoutTemplate className="w-4 h-4" /> : <LayoutTemplate className="w-4 h-4" />,
            show: t.type === 'text' ? !!t.content_html : t.images.length > 0,
        })),
        { key: 'organiser',label: 'Organiser',    icon: <Users className="w-4 h-4" />,       show: true },
        { key: 'location', label: 'Location',     icon: <MapPin className="w-4 h-4" />,      show: !!location },
    ].filter(tab => tab.show);

    const [selectedTab, setSelectedTab] = useState(0);

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
            </Head>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Breadcrumb */}
                <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-4" aria-label="Breadcrumb">
                    <Link href="/" className="hover:text-brand transition-colors">Home</Link>
                    <ChevronRight className="w-3 h-3" />
                    <Link href="/events" className="hover:text-brand transition-colors">Events</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-gray-600 truncate max-w-[200px] sm:max-w-sm">{event.title}</span>
                </nav>

                {/* Event Title */}
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">{event.title}</h1>

                {/* Two-column: Image + Share left, Info card right */}
                <div className="grid lg:grid-cols-12 gap-8 mb-8">
                    {/* Left: Image + Share buttons */}
                    <div className="lg:col-span-7 space-y-3">
                        {event.media ? (
                            <div className="rounded-xl overflow-hidden border border-gray-200">
                                <img
                                    src={event.media.url}
                                    alt={event.media.alt ?? event.title}
                                    className="w-full aspect-[4/3] object-cover"
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
                    <Tab.List className="flex w-full border-b border-gray-200 mb-6 overflow-x-auto scrollbar-none">
                        {tabs.map(tab => (
                            <Tab key={tab.key} className={({ selected }) => classNames(
                                'flex flex-1 items-center justify-center gap-1.5 px-5 py-3 text-sm font-semibold whitespace-nowrap outline-none transition-all border-b-2 -mb-px min-w-0',
                                selected ? 'border-brand text-brand' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            )}>
                                {tab.icon} {tab.label}
                            </Tab>
                        ))}
                    </Tab.List>

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
                                                className="prose prose-lg prose-headings:text-brand-navy prose-a:text-brand prose-strong:text-gray-900 max-w-none"
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
                                {tab.key === 'location' && (
                                    <div className="w-full max-w-2xl">
                                        <div className="rounded-xl overflow-hidden border border-gray-200 mb-5" style={{ height: '400px' }}>
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
                                        <div className="flex items-start gap-3 mb-4">
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
                                            className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 font-semibold px-5 py-2.5 rounded-lg hover:bg-gray-50 transition-all text-sm"
                                        >
                                            Get Directions <ExternalLink className="w-4 h-4" />
                                        </a>
                                    </div>
                                )}
                                {tab.key === 'organiser' && (
                                    <div className="space-y-3 max-w-xl w-full">
                                        {sponsors.length > 0 ? (
                                            sponsors.map((sponsor, i) => (
                                                <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white">
                                                    <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center p-2 overflow-hidden flex-shrink-0">
                                                        {sponsor.logo_url ? (
                                                            <img src={sponsor.logo_url} alt={sponsor.name} className="max-w-full max-h-full object-contain" />
                                                        ) : (
                                                            <Users className="w-8 h-8 text-gray-300" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900">{sponsor.name}</p>
                                                        <p className="text-sm text-gray-500">{sponsor.role}</p>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white">
                                                <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center p-2 flex-shrink-0">
                                                    <img src="/images/logo.png" alt="MTA" className="max-w-full max-h-full object-contain" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">Malaysian Takaful Association</p>
                                                    <p className="text-sm text-gray-500">Official Organizer</p>
                                                    <p className="text-sm text-gray-500 italic mt-1">"Empowering the takaful industry through professional development and networking."</p>
                                                </div>
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
                                {tab.key === 'tshirt' && (
                                    <div className="space-y-6 max-w-2xl w-full">
                                        {tshirtImages.map((img, i) => (
                                            <img
                                                key={i}
                                                src={img.url}
                                                alt={tshirtImages.length > 1 ? `T-shirt size chart ${i + 1}` : 'T-shirt size chart'}
                                                className="w-full h-auto rounded-xl border border-gray-200"
                                            />
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
                                                className="prose prose-lg prose-headings:text-brand-navy prose-a:text-brand prose-strong:text-gray-900 max-w-none"
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

                {/* Related Events */}
                {related.length > 0 && (
                    <div className="mt-16 pt-12 border-t border-gray-200">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{t('event.more_events')}</h2>
                                <p className="text-sm text-gray-500 mt-0.5">Discover more exciting events curated for you.</p>
                            </div>
                            <Link href="/events" className="text-sm font-semibold text-brand hover:text-brand-dark flex items-center gap-1 transition-all">
                                {t('event.view_all')} <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {related.map(e => <EventCard key={e.id} event={e} />)}
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile Sticky Bottom CTA */}
            {isStickyVisible && event.status === 'upcoming' && (
                <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4 flex items-center justify-between z-50">
                    <div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Starting from</p>
                        <p className="text-lg font-bold text-brand-navy">
                            {minPrice !== null ? `RM ${minPrice.toFixed(2)}` : 'Free'}
                        </p>
                    </div>
                    {event.is_registration_open ? (
                        <Link
                            href={`/events/${event.slug}/register`}
                            className="bg-brand text-white px-6 py-3 rounded-lg font-bold text-sm active:scale-95 transition-all"
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

function EventInfoCard({ event, onSaleTickets, minPrice, startDate, endDate, formatLongDate, formatTime, t }: {
    event: Event;
    onSaleTickets: EventTicket[];
    minPrice: number | null;
    startDate: Date;
    endDate: Date | null;
    formatLongDate: (d: Date) => string;
    formatTime: (d: Date) => string;
    t: (key: string) => string;
}) {
    const statusCfg = STATUS_CONFIG[event.status] ?? STATUS_CONFIG.draft;

    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
            {/* Status bar */}
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${statusCfg.classes}`}>
                    {statusCfg.labelKey}
                </span>
                <span className="text-xs text-gray-400 font-medium">{formatLongDate(startDate).split(',')[0]}</span>
            </div>

            <div className="p-5 space-y-4 bg-white">
                {/* Date */}
                <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-brand mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="text-[11px] text-gray-400 uppercase font-semibold tracking-wide mb-0.5">Date</p>
                        <p className="text-sm font-semibold text-gray-900">{formatLongDate(startDate)}</p>
                    </div>
                </div>

                {/* Time */}
                <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-brand mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="text-[11px] text-gray-400 uppercase font-semibold tracking-wide mb-0.5">Time</p>
                        <p className="text-sm font-semibold text-gray-900">
                            {formatTime(startDate)}{endDate && ` – ${formatTime(endDate)}`}
                        </p>
                    </div>
                </div>

                {/* Venue */}
                {event.venue && (
                    <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-brand mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-[11px] text-gray-400 uppercase font-semibold tracking-wide mb-0.5">Venue</p>
                            <p className="text-sm font-semibold text-gray-900">{event.venue}</p>
                            {(event.city || event.state) && (
                                <p className="text-xs text-gray-500">{[event.city, event.state].filter(Boolean).join(', ')}</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Price */}
                {onSaleTickets.length > 0 && (
                    <div className="flex items-start gap-3">
                        <Ticket className="w-4 h-4 text-brand mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-[11px] text-gray-400 uppercase font-semibold tracking-wide mb-0.5">Price</p>
                            <p className="text-sm font-semibold text-gray-900">
                                {minPrice === 0 ? 'Free' : minPrice !== null ? `From RM ${minPrice.toFixed(2)}` : 'Free'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Register button */}
                <div className="pt-1">
                    {event.rsvp_enabled && event.is_registration_open && event.status === 'upcoming' ? (
                        <Link
                            href={`/events/${event.slug}/register`}
                            className="flex items-center justify-center gap-2 w-full bg-brand text-white font-bold px-5 py-3 rounded-lg hover:bg-brand-dark transition-all text-sm"
                        >
                            <Ticket className="w-4 h-4" /> {t('event.register_now')}
                        </Link>
                    ) : !event.rsvp_enabled && event.registration_url && event.status === 'upcoming' ? (
                        <a
                            href={event.registration_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full bg-brand text-white font-bold px-5 py-3 rounded-lg hover:bg-brand-dark transition-all text-sm"
                        >
                            {t('event.register_now')} <ExternalLink className="w-4 h-4" />
                        </a>
                    ) : (
                        <div className="flex items-center justify-center w-full bg-gray-50 text-gray-400 font-semibold px-5 py-3 rounded-lg border border-gray-200 text-sm">
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
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
                <h3 className="text-sm font-bold text-gray-900">🎟 Ticket Information</h3>
            </div>
            <div className="p-5">
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
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

                <div className="mt-6 pt-5 border-t border-gray-100">
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
                    <p className="text-center text-[10px] text-gray-400 mt-3 uppercase tracking-wider">
                        Secure & Instant Checkout
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
