import { Link } from '@inertiajs/react';
import {
    CalendarDays, MapPin, Users, Trophy, Presentation,
    GraduationCap, UtensilsCrossed, PartyPopper, Image as ImageIcon, Sparkles,
} from 'lucide-react';
import { type Event, type EventCategory } from '@/types';
import { cn } from '@/lib/utils';

interface Props {
    event: Event & { registrations_count?: number };
}

const CATEGORY_META: Record<EventCategory, { label: string; icon: typeof Trophy; badgeClass: string }> = {
    sports: { label: 'Sports', icon: Trophy, badgeClass: 'bg-brand/90 text-white' },
    conference: { label: 'Conference', icon: Presentation, badgeClass: 'bg-brand-navy/90 text-white' },
    workshop: { label: 'Workshop', icon: GraduationCap, badgeClass: 'bg-indigo-500/90 text-white' },
    dinner: { label: 'Dinner', icon: UtensilsCrossed, badgeClass: 'bg-amber-500/90 text-white' },
    entertainment: { label: 'Entertainment', icon: PartyPopper, badgeClass: 'bg-fuchsia-500/90 text-white' },
    exhibition: { label: 'Exhibition', icon: ImageIcon, badgeClass: 'bg-emerald-500/90 text-white' },
    general: { label: 'General', icon: Sparkles, badgeClass: 'bg-slate-500/90 text-white' },
};

export default function UpcomingEventCard({ event }: Props) {
    const progress = event.max_attendees && event.max_attendees > 0
        ? Math.min(((event.registrations_count ?? 0) / event.max_attendees) * 100, 100)
        : null;

    const date = new Date(event.start_at).toLocaleDateString('en-MY', {
        day: 'numeric',
        month: 'short',
    });

    const category = event.event_category ? CATEGORY_META[event.event_category] : null;
    const CategoryIcon = category?.icon;
    const isFillingFast = progress !== null && progress >= 80;
    const barColorClass = progress === null ? 'bg-brand' : progress >= 95 ? 'bg-red-500' : progress >= 80 ? 'bg-amber-500' : 'bg-brand';

    return (
        <Link
            href={`/admin/events/${event.slug}/edit`}
            className="group flex-shrink-0 w-[240px] sm:w-[260px] rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-all hover:-translate-y-0.5"
        >
            <div className="relative h-28 bg-gradient-to-br from-brand-navy via-brand to-brand-light overflow-hidden">
                {event.media?.url ? (
                    <img src={event.media.url} alt={event.title} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                    CategoryIcon && (
                        <CategoryIcon className="absolute inset-0 m-auto w-10 h-10 text-white/25" strokeWidth={1.5} />
                    )
                )}
                {/* Bottom gradient for badge legibility */}
                <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/55 to-transparent" />

                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-white/90 dark:bg-card/90 px-2 py-1 text-[11px] font-bold text-brand-navy shadow-sm">
                        <CalendarDays className="w-3 h-3" />
                        {date}
                    </span>
                </div>

                {isFillingFast && (
                    <div className="absolute top-2.5 right-2.5">
                        <span className={cn(
                            'inline-flex items-center rounded-lg px-2 py-1 text-[10px] font-bold shadow-sm',
                            progress! >= 95 ? 'bg-red-500 text-white' : 'bg-amber-500 text-white',
                        )}>
                            {progress! >= 95 ? 'Almost full' : 'Filling fast'}
                        </span>
                    </div>
                )}

                {category && (
                    <div className="absolute bottom-2 left-2.5">
                        <span className={cn('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold', category.badgeClass)}>
                            <category.icon className="w-2.5 h-2.5" />
                            {category.label}
                        </span>
                    </div>
                )}
            </div>
            <div className="p-3.5">
                <h4 className="font-semibold text-sm text-foreground line-clamp-2 leading-snug group-hover:text-brand transition-colors">
                    {event.title}
                </h4>
                {event.city && (
                    <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        {event.city}
                    </div>
                )}
                {progress !== null && (
                    <div className="mt-3">
                        <div className="flex items-center justify-between text-[10px] mb-1">
                            <span className="text-muted-foreground">
                                <Users className="w-3 h-3 inline mr-0.5" />
                                {event.registrations_count ?? 0} / {event.max_attendees}
                            </span>
                            <span className="font-semibold text-foreground">{progress.toFixed(0)}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                                className={cn('h-full rounded-full transition-all', barColorClass)}
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </Link>
    );
}
