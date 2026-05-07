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
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/20">
            {parts.map(({ v, l }) => (
                <div key={l} className="text-center">
                    <span className="block text-sm font-bold text-white tabular-nums leading-none">
                        {String(v).padStart(2, '0')}
                    </span>
                    <span className="block text-[10px] text-white/60 uppercase tracking-wide mt-0.5">{l}</span>
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
            className="group block relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 aspect-[3/4] bg-gray-900"
        >
            {/* Background image — blurred fill */}
            {event.media && (
                <img
                    src={event.media.url}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-cover scale-110 blur-md opacity-60"
                />
            )}

            {/* Foreground image — full, unclipped */}
            {event.media ? (
                <img
                    src={event.media.url}
                    alt={event.media.alt ?? event.title}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                />
            ) : (
                <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-brand-light">
                    <svg className="w-16 h-16 text-brand/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
            )}

            {/* Gradient overlay — stronger at bottom */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

            {/* Top row: status badge + date */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm ${STATUS_BADGE[event.status] ?? 'bg-white/20 text-white'}`}>
                    {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                </span>
                <span className="text-xs font-medium text-white bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full">
                    {startDate.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
            </div>

            {/* Bottom content */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="font-bold text-white text-base leading-snug line-clamp-2 group-hover:text-brand-light transition-colors">
                    {event.title}
                </h3>

                {(event.city || event.venue) && (
                    <p className="mt-1.5 text-xs text-white/65 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="line-clamp-1">{event.venue ?? event.city}</span>
                    </p>
                )}

                {event.status === 'upcoming' && <Countdown target={startDate} />}
            </div>
        </Link>
    );
}
