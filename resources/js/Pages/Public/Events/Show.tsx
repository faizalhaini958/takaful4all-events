import PublicLayout from '@/Layouts/PublicLayout';
import EventCard from '@/Components/EventCard';
import { Link } from '@inertiajs/react';
import { Calendar, Clock, MapPin, ExternalLink, Share2, ChevronRight, Ticket } from 'lucide-react';
import { type Event } from '@/types';

interface Props {
    event: Event;
    related: Event[];
}

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
    upcoming: { label: 'Upcoming',     classes: 'bg-emerald-100 text-emerald-800 border border-emerald-200' },
    past:     { label: 'Past Event',   classes: 'bg-gray-100 text-gray-600 border border-gray-200' },
    draft:    { label: 'Draft',        classes: 'bg-yellow-100 text-yellow-800 border border-yellow-200' },
};

export default function EventShow({ event, related }: Props) {
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
            {/* ── Hero ── */}
            <div className="relative w-full bg-brand-navy overflow-hidden" style={{ minHeight: '170px' }}>
                <div className="absolute inset-0 bg-gradient-to-br from-brand-navy to-brand-dark opacity-90" />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col justify-end" style={{ minHeight: '170px' }}>
                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-1.5 text-xs text-brand-light/70 mb-6" aria-label="Breadcrumb">
                        <Link href="/" className="hover:text-brand-light transition-colors">Home</Link>
                        <ChevronRight className="w-3 h-3 flex-shrink-0" />
                        <Link href="/events" className="hover:text-brand-light transition-colors">Events</Link>
                        <ChevronRight className="w-3 h-3 flex-shrink-0" />
                        <span className="text-brand-light truncate max-w-xs">{event.title}</span>
                    </nav>

                    {/* Status badge */}
                    <span className={`self-start text-xs font-semibold px-3 py-1 rounded-full mb-4 ${statusCfg.classes}`}>
                        {statusCfg.label}
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

                        {/* Mobile: Register CTA */}
                        {event.rsvp_enabled && event.is_registration_open && event.status === 'upcoming' && (
                            <Link
                                href={`/events/${event.slug}/register`}
                                className="lg:hidden flex items-center justify-center gap-2 bg-brand text-white font-bold text-base px-6 py-4 rounded-xl hover:bg-brand-dark active:scale-95 transition-all mb-8 shadow-md"
                            >
                                <Ticket className="w-4 h-4" /> Register Now
                            </Link>
                        )}
                        {!event.rsvp_enabled && event.registration_url && event.status === 'upcoming' && (
                            <a
                                href={event.registration_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="lg:hidden flex items-center justify-center gap-2 bg-brand text-white font-bold text-base px-6 py-4 rounded-xl hover:bg-brand-dark active:scale-95 transition-all mb-8 shadow-md"
                            >
                                Register Now
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

                        {/* Share row */}
                        <div className="mt-10 pt-8 border-t border-gray-200 flex items-center gap-3">
                            <Share2 className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-500 font-medium">Share this event:</span>
                            <a
                                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                            >
                                Facebook
                            </a>
                            <a
                                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-semibold px-3 py-1.5 rounded-full bg-sky-100 text-sky-700 hover:bg-sky-200 transition-colors"
                            >
                                LinkedIn
                            </a>
                            <a
                                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(event.title)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                            >
                                X / Twitter
                            </a>
                        </div>
                    </div>

                    {/* ── Sticky Sidebar ── */}
                    <aside className="w-full lg:w-80 flex-shrink-0">
                        <div className="lg:sticky lg:top-24 space-y-5">

                            {/* Event Info Card */}
                            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                                <div className="bg-brand-navy px-5 py-4">
                                    <p className="text-xs font-semibold uppercase tracking-widest text-brand-light/70">Venue Info</p>
                                </div>
                                <div className="px-5 py-5 space-y-4">
                                    {/* Date */}
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg bg-brand-light flex items-center justify-center">
                                            <Calendar className="w-4 h-4 text-brand" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-0.5">Date</p>
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
                                                <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-0.5">Time</p>
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {formatTime(startDate)} – {formatTime(endDate)}
                                                </p>
                                                <p className="text-xs text-gray-400">(Asia/Kuala_Lumpur)</p>
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
                                                <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-0.5">Venue</p>
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
                                                <Ticket className="w-4 h-4" /> Register Now
                                            </Link>
                                        ) : (
                                            <div className="w-full flex items-center justify-center text-sm font-semibold text-gray-400 bg-gray-50 border border-dashed border-gray-200 px-4 py-3.5 rounded-xl">
                                                Registration Closed
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
                                                <>Register Now <ExternalLink className="w-4 h-4" /></>
                                            ) : (
                                                'Registration Closed'
                                            )}
                                        </a>
                                    </div>
                                ) : event.status === 'upcoming' && (
                                    <div className="px-5 pb-5">
                                        <div className="w-full flex items-center justify-center text-sm font-semibold text-gray-400 bg-gray-50 border border-dashed border-gray-200 px-4 py-3.5 rounded-xl">
                                            Registration link coming soon
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
                                            Get Directions <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </div>
                                </div>
                            )}

                            {/* Organised by */}
                            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm px-5 py-5">
                                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Organized by</p>
                                <div className="flex items-center gap-3">
                                    <img src="/images/logo.png" alt="Malaysian Takaful Association" className="h-10 w-auto" />
                                </div>
                                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                                    Malaysian Takaful Association (MTA)
                                </p>
                            </div>
                        </div>
                    </aside>
                </div>

                {/* ── Related Events ── */}
                {related.length > 0 && (
                    <div className="mt-16 pt-10 border-t border-gray-200">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-extrabold text-brand-navy">More Events</h2>
                            <Link href="/events" className="text-sm font-semibold text-brand hover:underline flex items-center gap-1">
                                View All <ChevronRight className="w-4 h-4" />
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
