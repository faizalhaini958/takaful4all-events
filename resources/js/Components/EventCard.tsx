import { Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { type Event } from '@/types';

interface Props {
    event: Event;
}

const STATUS_BADGE: Record<string, string> = {
    upcoming: 'bg-brand-light text-brand-dark',
    past:     'bg-gray-100 text-gray-600',
    draft:    'bg-yellow-100 text-yellow-800',
};

function useCountdown(target: Date) {
    const calc = () => {
        const diff = target.getTime() - Date.now();
        if (diff <= 0) return null;
        return {
            d: Math.floor(diff / 86_400_000),
            h: Math.floor((diff % 86_400_000) / 3_600_000),
            m: Math.floor((diff % 3_600_000) / 60_000),
            s: Math.floor((diff % 60_000) / 1_000),
        };
    };
    const [time, setTime] = useState(calc);
    useEffect(() => {
        const id = setInterval(() => setTime(calc()), 1000);
        return () => clearInterval(id);
    }, [target.getTime()]);
    return time;
}

function Countdown({ target }: { target: Date }) {
    const t = useCountdown(target);
    if (!t) return null;
    const parts = [
        { v: t.d, l: 'days' },
        { v: t.h, l: 'hrs' },
        { v: t.m, l: 'min' },
        { v: t.s, l: 'sec' },
    ];
    return (
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
            {parts.map(({ v, l }) => (
                <div key={l} className="text-center">
                    <span className="block text-sm font-bold text-brand tabular-nums leading-none">
                        {String(v).padStart(2, '0')}
                    </span>
                    <span className="block text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">{l}</span>
                </div>
            ))}
        </div>
    );
}

export default function EventCard({ event }: Props) {
    const startDate = new Date(event.start_at);

    return (
        <Link
            href={`/events/${event.slug}`}
            className="group block bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200"
        >
            {/* Image */}
            <div className="aspect-video bg-gray-100 overflow-hidden">
                {event.media ? (
                    <img
                        src={event.media.url}
                        alt={event.media.alt ?? event.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-brand-light">
                        <svg className="w-12 h-12 text-brand/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[event.status] ?? ''}`}>
                        {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                    </span>
                    <span className="text-xs text-gray-500">
                        {startDate.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                </div>

                <h3 className="font-semibold text-brand-navy line-clamp-2 group-hover:text-brand transition-colors">
                    {event.title}
                </h3>

                {event.excerpt && (
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">{event.excerpt}</p>
                )}

                {(event.city || event.venue) && (
                    <p className="mt-2 text-xs text-gray-400 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {event.venue ?? event.city}
                    </p>
                )}

                {event.status === 'upcoming' && <Countdown target={startDate} />}
            </div>
        </Link>
    );
}
