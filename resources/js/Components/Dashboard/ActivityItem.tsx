import { Link } from '@inertiajs/react';
import { type RecentRegistration } from '@/types';
import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<string, string> = {
    confirmed: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    attended: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20',
    pending: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
    awaiting_payment: 'text-orange-600 dark:text-orange-400 bg-orange-500/10 border-orange-500/20',
    cancelled: 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20',
    waitlisted: 'text-gray-600 dark:text-gray-400 bg-gray-500/10 border-gray-500/20',
};

function timeAgo(dateStr: string): string {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diffSec = Math.floor((now - then) / 1000);
    if (diffSec < 60) return 'just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 30) return `${diffDay}d ago`;
    return new Date(dateStr).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' });
}

interface Props {
    registration: RecentRegistration;
}

export default function ActivityItem({ registration }: Props) {
    const initial = registration.name.charAt(0).toUpperCase();
    const eventTitle = registration.event?.title ?? 'Unknown Event';

    return (
        <Link
            href={`/admin/registrations`}
            className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors group"
        >
            <div className="flex-shrink-0 w-9 h-9 rounded-full bg-brand/10 text-brand font-bold text-sm flex items-center justify-center">
                {initial}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{registration.name}</p>
                    <span className={cn(
                        'inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-semibold capitalize flex-shrink-0',
                        STATUS_STYLES[registration.status] ?? STATUS_STYLES.pending,
                    )}>
                        {registration.status.replace('_', ' ')}
                    </span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {eventTitle}
                    {registration.total_amount > 0 && (
                        <span className="ml-2 font-medium text-emerald-600 dark:text-emerald-400">
                            RM {Number(registration.total_amount).toFixed(2)}
                        </span>
                    )}
                </p>
            </div>
            <span className="text-[11px] text-muted-foreground flex-shrink-0">
                {timeAgo(registration.created_at)}
            </span>
        </Link>
    );
}
