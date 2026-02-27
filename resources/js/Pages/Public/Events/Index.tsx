import PublicLayout from '@/Layouts/PublicLayout';
import EventCard from '@/Components/EventCard';
import { Link, router } from '@inertiajs/react';
import { CalendarDays } from 'lucide-react';
import { type Event, type PaginatedData } from '@/types';

interface Props {
    events: PaginatedData<Event>;
    currentStatus: string;
}

const FILTERS = [
    { value: 'all',      label: 'All Events' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'past',     label: 'Past' },
];

export default function EventsIndex({ events, currentStatus }: Props) {
    const handleFilter = (status: string) => {
        router.get('/events', status !== 'all' ? { status } : {}, { preserveScroll: true });
    };

    return (
        <PublicLayout>
            {/* ── Hero ── */}
            <section className="relative bg-brand-light overflow-hidden">
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pb-36 md:py-20 md:pb-44">
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-brand-navy uppercase tracking-wide mb-3">
                        Events
                    </h1>
                    <p className="text-brand-navy/60 text-lg">
                        Browse all Takaful conferences, meet-ups, and networking events.
                    </p>
                </div>
                {/* Layered wave divider */}
                <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
                    <svg viewBox="0 0 1440 120" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-24 md:h-32">
                        <path d="M0,60 C240,100 480,20 720,60 C960,100 1200,20 1440,60 L1440,120 L0,120 Z" fill="#dff5f9" />
                        <path d="M0,75 C200,40 500,100 800,65 C1100,30 1300,90 1440,70 L1440,120 L0,120 Z" fill="#edfafc" />
                        <path d="M0,90 C300,70 600,110 900,85 C1150,65 1300,100 1440,88 L1440,120 L0,120 Z" fill="#f6fdfe" />
                        <path d="M0,105 C400,90 800,118 1200,100 C1320,94 1400,108 1440,105 L1440,120 L0,120 Z" fill="white" />
                    </svg>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Filter pills */}
                <div className="flex gap-2 mb-8 flex-wrap">
                    {FILTERS.map(f => (
                        <button
                            key={f.value}
                            onClick={() => handleFilter(f.value)}
                            className={`px-5 py-2 rounded-full text-sm font-medium transition-all border ${
                                currentStatus === f.value
                                    ? 'bg-brand text-white border-brand shadow-sm'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-brand hover:text-brand'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Grid */}
                {events.data.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {events.data.map(event => (
                            <EventCard key={event.id} event={event} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-24 text-gray-400 flex flex-col items-center gap-4">
                        <CalendarDays className="w-12 h-12 text-brand/30" strokeWidth={1.5} />
                        <p className="text-lg font-medium text-gray-500">No events found.</p>
                        <p className="text-sm text-gray-400">Try selecting a different filter above.</p>
                    </div>
                )}

                {/* Pagination */}
                {events.last_page > 1 && (
                    <div className="mt-10 flex justify-center gap-1 flex-wrap">
                        {events.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url ?? '#'}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                                    link.active
                                        ? 'bg-brand text-white border-brand'
                                        : link.url
                                            ? 'bg-white border-gray-200 text-gray-600 hover:border-brand hover:text-brand'
                                            : 'bg-white border-gray-100 text-gray-300 cursor-not-allowed'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                preserveScroll
                            />
                        ))}
                    </div>
                )}
            </div>
        </PublicLayout>
    );
}
