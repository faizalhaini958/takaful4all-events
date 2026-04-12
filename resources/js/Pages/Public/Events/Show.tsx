import PublicLayout from '@/Layouts/PublicLayout';
import EventCard from '@/Components/EventCard';
import ShareButtons from '@/Components/ShareButtons';
import { Head, Link } from '@inertiajs/react';
import { Calendar, Clock, MapPin, ExternalLink, ChevronRight, Ticket, FolderOpen, Check } from 'lucide-react';
import { type Event, type EventTicket, type EventZone } from '@/types';
import { useTranslation } from '@/hooks/use-translation';

interface Props {
    event: Event;
    related: Event[];
    ogUrl: string;
}

const STATUS_CONFIG: Record<string, { labelKey: string; classes: string }> = {
    upcoming: { labelKey: 'event.badge_upcoming', classes: 'bg-emerald-100 text-emerald-800 border border-emerald-200' },
    past:     { labelKey: 'event.badge_past',     classes: 'bg-gray-100 text-gray-600 border border-gray-200' },
    draft:    { labelKey: 'event.badge_draft',     classes: 'bg-yellow-100 text-yellow-800 border border-yellow-200' },
};

export default function EventShow({ event, related, ogUrl }: Props) {
    const { t } = useTranslation();
    const startDate = new Date(event.start_at);
    const endDate   = event.end_at ? new Date(event.end_at) : null;

    const formatLongDate = (d: Date) =>
        d.toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    const formatShortDate = (d: Date) =>
        d.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' });

    const formatTime = (d: Date) =>
        d.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', hour12: true });

    const statusCfg = STATUS_CONFIG[event.status] ?? STATUS_CONFIG.draft;
    const location = [event.venue, event.city, event.state, event.country].filter(Boolean).join(', ');

    return (
        <PublicLayout>
            <Head>
                <title>{event.title}</title>
                <meta name="description" content={event.excerpt ?? `${event.title} — Takaful Events`} />
                <meta property="og:title" content={event.title} />
                <meta property="og:description" content={event.excerpt ?? `${event.title} — Takaful Events`} />
                <meta property="og:url" content={ogUrl} />
                <meta property="og:type" content="website" />
                {event.media && <meta property="og:image" content={event.media.url} />}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={event.title} />
                <meta name="twitter:description" content={event.excerpt ?? `${event.title} — Takaful Events`} />
                {event.media && <meta name="twitter:image" content={event.media.url} />}
            </Head>
            {/* ── Hero ── */}
            <div className="relative w-full bg-brand-navy overflow-hidden" style={{ minHeight: '170px' }}>
                <div className="absolute inset-0 bg-gradient-to-br from-brand-navy to-brand-dark opacity-90" />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col justify-end" style={{ minHeight: '170px' }}>
                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-1.5 text-xs text-brand-light/70 mb-6" aria-label="Breadcrumb">
                        <Link href="/" className="hover:text-brand-light transition-colors">{t('event.breadcrumb_home')}</Link>
                        <ChevronRight className="w-3 h-3 flex-shrink-0" />
                        <Link href="/events" className="hover:text-brand-light transition-colors">{t('event.breadcrumb_events')}</Link>
                        <ChevronRight className="w-3 h-3 flex-shrink-0" />
                        <span className="text-brand-light truncate max-w-xs">{event.title}</span>
                    </nav>

                    {/* Status badge */}
                    <span className={`self-start text-xs font-semibold px-3 py-1 rounded-full mb-4 ${statusCfg.classes}`}>
                        {t(statusCfg.labelKey)}
                    </span>

                    {/* Title */}
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-6 max-w-4xl">
                        {event.title}
                    </h1>

                    {/* Quick meta strip */}
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-brand-light/80">
                        <span className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-brand flex-shrink-0" />
                            {formatShortDate(startDate)}
                        </span>
                        {endDate && (
                            <span className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-brand flex-shrink-0" />
                                {formatTime(startDate)} – {formatTime(endDate)}
                            </span>
                        )}
                        {event.venue && (
                            <span className="flex items-center gap-1.5">
                                <MapPin className="w-4 h-4 text-brand flex-shrink-0" />
                                {event.venue}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Body ── */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
                <div className="flex flex-col lg:flex-row gap-10">

                    {/* ── Main content ── */}
                    <div className="flex-1 min-w-0">

                        {/* Event image (if exists) — featured image below hero on larger screens */}
                        {event.media && (
                            <div className="rounded-2xl overflow-hidden shadow-lg mb-8 aspect-video">
                                <img
                                    src={event.media.url}
                                    alt={event.media.alt ?? event.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}

                        {/* Venue / Seating Map */}
                        {event.venue_map && (
                            <div className="mb-8">
                                <h2 className="text-xl font-bold text-brand-navy mb-4 flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-brand" />
                                    {t('event.venue_seating_map')}
                                </h2>
                                <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                                    <img
                                        src={event.venue_map.url}
                                        alt="Venue seating map"
                                        className="w-full h-auto"
                                    />
                                    {event.zones && event.zones.length > 0 && (
                                        <div className="flex flex-wrap gap-2 px-4 py-3 bg-gray-50 border-t border-gray-100">
                                            {event.zones.map(zone => (
                                                <span
                                                    key={zone.id}
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                                                    style={{ backgroundColor: zone.color, color: zone.label_color }}
                                                >
                                                    {zone.name}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Tickets */}
                        {event.tickets && event.tickets.filter(t => t.is_on_sale).length > 0 && (
                            <div className="mb-8">
                                <h2 className="text-xl font-bold text-brand-navy mb-4 flex items-center gap-2">
                                    <Ticket className="w-5 h-5 text-brand" />
                                    {t('event.tickets')}
                                </h2>
                                <div className="space-y-3">
                                    {(() => {
                                        const onSaleTickets = event.tickets!.filter(t => t.is_on_sale);
                                        const zones = event.zones ?? [];

                                        if (zones.length > 0) {
                                            return (
                                                <>
                                                    {zones.map(zone => {
                                                        const zoneTickets = onSaleTickets.filter(t => t.event_zone_id === zone.id);
                                                        if (zoneTickets.length === 0) return null;
                                                        return (
                                                            <div key={zone.id} className="rounded-xl border-2 overflow-hidden" style={{ borderColor: zone.color + '60' }}>
                                                                <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: zone.color, color: zone.label_color }}>
                                                                    <span className="font-bold text-sm">{zone.name}</span>
                                                                    {zone.description && <span className="text-xs opacity-80">{zone.description}</span>}
                                                                </div>
                                                                <div className="p-3 space-y-2">
                                                                    {(zone.image_url || (zone.perks && zone.perks.length > 0)) && (
                                                                        <div className="flex gap-4 mb-2">
                                                                            {zone.image_url && (
                                                                                <img src={zone.image_url} alt={zone.name} className="w-28 h-20 rounded-lg object-cover flex-shrink-0" />
                                                                            )}
                                                                            {zone.perks && zone.perks.length > 0 && (
                                                                                <ul className="text-xs text-gray-600 space-y-1">
                                                                                    {zone.perks.map((perk, i) => (
                                                                                        <li key={i} className="flex items-start gap-1.5">
                                                                                            <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                                                                            {perk}
                                                                                        </li>
                                                                                    ))}
                                                                                </ul>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                    {zoneTickets.map(ticket => (
                                                                        <TicketCard key={ticket.id} ticket={ticket} />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                    {onSaleTickets.filter(t => !t.event_zone_id).map(ticket => (
                                                        <TicketCard key={ticket.id} ticket={ticket} />
                                                    ))}
                                                </>
                                            );
                                        }

                                        return onSaleTickets.map(ticket => (
                                            <TicketCard key={ticket.id} ticket={ticket} />
                                        ));
                                    })()}
                                </div>

                                {event.rsvp_enabled && event.is_registration_open && event.status === 'upcoming' && (
                                    <Link
                                        href={`/events/${event.slug}/register`}
                                        className="mt-4 inline-flex items-center justify-center gap-2 bg-brand text-white font-bold text-sm px-6 py-3 rounded-xl hover:bg-brand-dark active:scale-95 transition-all shadow-sm"
                                    >
                                        <Ticket className="w-4 h-4" /> {t('event.register_now')}
                                    </Link>
                                )}
                            </div>
                        )}

                        {/* Mobile: Register CTA */}
                        {event.rsvp_enabled && event.is_registration_open && event.status === 'upcoming' && (
                            <Link
                                href={`/events/${event.slug}/register`}
                                className="lg:hidden flex items-center justify-center gap-2 bg-brand text-white font-bold text-base px-6 py-4 rounded-xl hover:bg-brand-dark active:scale-95 transition-all mb-8 shadow-md"
                            >
                                <Ticket className="w-4 h-4" /> {t('event.register_now')}
                            </Link>
                        )}
                        {!event.rsvp_enabled && event.registration_url && event.status === 'upcoming' && (
                            <a
                                href={event.registration_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="lg:hidden flex items-center justify-center gap-2 bg-brand text-white font-bold text-base px-6 py-4 rounded-xl hover:bg-brand-dark active:scale-95 transition-all mb-8 shadow-md"
                            >
                                {t('event.register_now')}
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        )}

                        {/* Description */}
                        {event.excerpt && (
                            <p className="text-lg text-gray-600 leading-relaxed border-l-4 border-brand pl-5 mb-8 italic">
                                {event.excerpt}
                            </p>
                        )}

                        {/* Rich content */}
                        {event.content_html && (
                            <article
                                className="prose prose-lg prose-headings:text-brand-navy prose-a:text-brand prose-strong:text-gray-900 max-w-none"
                                dangerouslySetInnerHTML={{ __html: event.content_html }}
                            />
                        )}

                        {/* Google Drive Gallery */}
                        {event.gdrive_link && (
                            <div className="mt-8">
                                <a
                                    href={event.gdrive_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 bg-brand-light text-brand-navy font-semibold px-5 py-3 rounded-xl hover:bg-brand hover:text-white transition-colors"
                                >
                                    <FolderOpen className="w-5 h-5" />
                                    {t('event.view_full_gallery')}
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            </div>
                        )}

                        {/* Share row */}
                        <div className="mt-10 pt-8 border-t border-gray-200">
                            <ShareButtons url={ogUrl} title={event.title} />
                        </div>
                    </div>

                    {/* ── Sticky Sidebar ── */}
                    <aside className="w-full lg:w-80 flex-shrink-0">
                        <div className="lg:sticky lg:top-24 space-y-5">

                            {/* Event Info Card */}
                            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                                <div className="bg-brand-navy px-5 py-4">
                                    <p className="text-xs font-semibold uppercase tracking-widest text-brand-light/70">{t('event.venue_info')}</p>
                                </div>
                                <div className="px-5 py-5 space-y-4">
                                    {/* Date */}
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg bg-brand-light flex items-center justify-center">
                                            <Calendar className="w-4 h-4 text-brand" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-0.5">{t('event.date')}</p>
                                            <p className="text-sm font-semibold text-gray-900">{formatLongDate(startDate)}</p>
                                            {endDate && startDate.toDateString() !== endDate.toDateString() && (
                                                <p className="text-xs text-gray-500 mt-0.5">to {formatLongDate(endDate)}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Time */}
                                    {endDate && (
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg bg-brand-light flex items-center justify-center">
                                                <Clock className="w-4 h-4 text-brand" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-0.5">{t('event.time')}</p>
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {formatTime(startDate)} – {formatTime(endDate)}
                                                </p>
                                                <p className="text-xs text-gray-400">{t('event.timezone')}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Venue */}
                                    {event.venue && (
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg bg-brand-light flex items-center justify-center">
                                                <MapPin className="w-4 h-4 text-brand" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-0.5">{t('event.venue')}</p>
                                                <p className="text-sm font-semibold text-gray-900">{event.venue}</p>
                                                {(event.city || event.state) && (
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        {[event.city, event.state].filter(Boolean).join(', ')}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Register CTA */}
                                {event.rsvp_enabled && event.status === 'upcoming' ? (
                                    <div className="px-5 pb-5">
                                        {event.is_registration_open ? (
                                            <Link
                                                href={`/events/${event.slug}/register`}
                                                className="flex items-center justify-center gap-2 w-full font-bold text-sm px-4 py-3.5 rounded-xl transition-all shadow-sm bg-brand text-white hover:bg-brand-dark active:scale-95"
                                            >
                                                <Ticket className="w-4 h-4" /> {t('event.register_now')}
                                            </Link>
                                        ) : (
                                            <div className="w-full flex items-center justify-center text-sm font-semibold text-gray-400 bg-gray-50 border border-dashed border-gray-200 px-4 py-3.5 rounded-xl">
                                                {t('event.registration_closed')}
                                            </div>
                                        )}
                                    </div>
                                ) : event.registration_url ? (
                                    <div className="px-5 pb-5">
                                        <a
                                            href={event.registration_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`flex items-center justify-center gap-2 w-full font-bold text-sm px-4 py-3.5 rounded-xl transition-all shadow-sm ${
                                                event.status === 'upcoming'
                                                    ? 'bg-brand text-white hover:bg-brand-dark active:scale-95'
                                                    : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                            }`}
                                        >
                                            {event.status === 'upcoming' ? (
                                                <>{t('event.register_now')} <ExternalLink className="w-4 h-4" /></>
                                            ) : (
                                                t('event.registration_closed')
                                            )}
                                        </a>
                                    </div>
                                ) : event.status === 'upcoming' && (
                                    <div className="px-5 pb-5">
                                        <div className="w-full flex items-center justify-center text-sm font-semibold text-gray-400 bg-gray-50 border border-dashed border-gray-200 px-4 py-3.5 rounded-xl">
                                            {t('event.registration_coming_soon')}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Map embed */}
                            {location && (
                                <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                                    <iframe
                                        title="Event venue map"
                                        width="100%"
                                        height="220"
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                        src={`https://maps.google.com/maps?q=${encodeURIComponent(location)}&output=embed`}
                                        className="block w-full"
                                    />
                                    <div className="px-4 py-3 bg-white border-t border-gray-100">
                                        <a
                                            href={`https://maps.google.com/?q=${encodeURIComponent(location)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-brand font-semibold hover:underline flex items-center gap-1"
                                        >
                                            {t('event.get_directions')} <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </div>
                                </div>
                            )}

                            {/* Organised by */}
                            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm px-5 py-5">
                                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">{t('event.organized_by')}</p>
                                <div className="flex items-center gap-3">
                                    <img src="/images/logo.png" alt="Malaysian Takaful Association" className="h-10 w-auto" />
                                </div>
                                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                                    {t('event.organizer_name')}
                                </p>
                            </div>
                        </div>
                    </aside>
                </div>

                {/* ── Related Events ── */}
                {related.length > 0 && (
                    <div className="mt-16 pt-10 border-t border-gray-200">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-extrabold text-brand-navy">{t('event.more_events')}</h2>
                            <Link href="/events" className="text-sm font-semibold text-brand hover:underline flex items-center gap-1">
                                {t('event.view_all')} <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {related.map(e => <EventCard key={e.id} event={e} />)}
                        </div>
                    </div>
                )}
            </div>
        </PublicLayout>
    );
}

function TicketCard({ ticket }: { ticket: EventTicket }) {
    return (
        <div
            className="flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-white"
            style={ticket.color ? { borderLeftWidth: '4px', borderLeftColor: ticket.color } : undefined}
        >
            <div>
                <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">{ticket.name}</p>
                    {ticket.is_early_bird && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            <Clock className="w-3 h-3" /> Early Bird
                        </span>
                    )}
                </div>
                {ticket.description && <p className="text-sm text-gray-500 mt-0.5">{ticket.description}</p>}
                {ticket.available_count !== null && (
                    <p className="text-xs text-amber-600 mt-1">{ticket.available_count} spots left</p>
                )}
                {ticket.is_early_bird && ticket.early_bird_end_at && (
                    <p className="text-xs text-amber-700 mt-1">
                        Ends {new Date(ticket.early_bird_end_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                )}
            </div>
            <div className="text-right flex-shrink-0 ml-4">
                {ticket.type === 'free' ? (
                    <p className="font-bold text-lg text-emerald-600">Free</p>
                ) : ticket.is_early_bird ? (
                    <>
                        <p className="font-bold text-lg text-emerald-600">RM {Number(ticket.current_price).toFixed(2)}</p>
                        <p className="text-xs text-gray-400 line-through">RM {Number(ticket.price).toFixed(2)}</p>
                    </>
                ) : (
                    <p className="font-bold text-lg text-gray-900">RM {Number(ticket.current_price).toFixed(2)}</p>
                )}
            </div>
        </div>
    );
}
