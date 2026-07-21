import { useState, useEffect, useCallback, useRef } from 'react';
import { router, usePage } from '@inertiajs/react';
import {
    Bell,
    MessageSquare,
    Calendar,
    Info,
    RefreshCw,
    Settings,
    Check,
    ExternalLink,
    PartyPopper,
    X,
    Megaphone,
} from 'lucide-react';
import { type DatabaseNotification } from '@/types';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/Components/ui/sheet';
import { Button } from '@/Components/ui/button';
import { Skeleton } from '@/Components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, React.ElementType> = {
    message: MessageSquare,
    event: Calendar,
    broadcast: Megaphone,
    default: Info,
};

const GROUP_LABELS: Record<string, string> = {
    today: 'Today',
    yesterday: 'Yesterday',
    thisWeek: 'This Week',
    older: 'Older',
};

function getGroupKey(dateStr: string): string {
    const d = new Date(dateStr);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday.getTime() - 86400000);
    const startOfWeek = new Date(startOfToday.getTime() - (startOfToday.getDay() || 7) * 86400000 + 86400000);

    if (d >= startOfToday) return 'today';
    if (d >= startOfYesterday) return 'yesterday';
    if (d >= startOfWeek) return 'thisWeek';
    return 'older';
}

function groupNotifications(items: DatabaseNotification[]) {
    const groups: Record<string, DatabaseNotification[]> = {};
    for (const item of items) {
        const key = getGroupKey(item.created_at);
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
    }
    return Object.keys(groups).map((key) => ({
        key,
        label: GROUP_LABELS[key] ?? key,
        items: groups[key],
    }));
}

type FilterTab = 'all' | 'unread';

function SkeletonItem() {
    return (
        <div className="flex items-start gap-3 px-4 py-3">
            <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
            <div className="flex-1 min-w-0 space-y-1.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/3" />
            </div>
        </div>
    );
}

interface NotificationContentProps {
    isMobile: boolean;
    onClose: () => void;
    isAdmin: boolean;
}

function NotificationContent({ isMobile, onClose, isAdmin }: NotificationContentProps) {
    const [notifications, setNotifications] = useState<DatabaseNotification[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState<FilterTab>('all');
    const prevUnreadRef = useRef(0);

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/notifications/fetch', {
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
            });
            const data = await res.json();
            setNotifications(data.notifications);
            prevUnreadRef.current = data.unread_count;
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const markAsRead = async (id: string) => {
        try {
            await fetch(`/notifications/${id}/read`, {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '',
                },
            });
            fetchNotifications();
        } catch {
            // silent
        }
    };

    const handleView = (id: string, actionUrl?: string) => {
        markAsRead(id);
        if (actionUrl) {
            onClose();
            router.visit(actionUrl);
        }
    };

    const handleDismiss = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        markAsRead(id);
    };

    const handleMarkAllRead = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await fetch('/notifications/read-all', {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '',
                },
            });
            fetchNotifications();
        } catch {
            // silent
        }
    };

    const filteredNotifications = filter === 'unread'
        ? notifications.filter((n) => !n.read_at)
        : notifications;

    const groups = groupNotifications(filteredNotifications);
    const totalFiltered = filteredNotifications.length;
    const unreadFiltered = filteredNotifications.filter((n) => !n.read_at).length;
    const currentUnread = notifications.filter((n) => !n.read_at).length;

    return (
        <div className="flex flex-col h-full">
            {/* ── Header ─────────────────────────────────────────── */}
            <div className={cn(
                'flex items-center justify-between shrink-0',
                isMobile ? 'px-4 py-3 border-b border-border' : 'px-4 py-3',
            )}>
                <div className="flex items-center gap-2">
                    {isMobile && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 -ml-2"
                            onClick={onClose}
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    )}
                    <span className={cn(
                        'font-semibold',
                        isMobile ? 'text-base' : 'text-base p-0',
                    )}>
                        Notifications
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                            e.stopPropagation();
                            fetchNotifications();
                        }}
                        title="Refresh"
                    >
                        <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
                    </Button>
                    {currentUnread > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-brand hover:text-brand-dark"
                            onClick={handleMarkAllRead}
                        >
                            Mark all read
                        </Button>
                    )}
                </div>
            </div>

            {!isMobile && <DropdownMenuSeparator className="m-0" />}

            {/* ── Tabs ───────────────────────────────────────────── */}
            <div className="flex border-b border-border shrink-0">
                <button
                    onClick={() => setFilter('all')}
                    className={cn(
                        'flex-1 text-sm py-2.5 font-medium transition-colors',
                        filter === 'all'
                            ? 'text-brand border-b-2 border-brand'
                            : 'text-muted-foreground hover:text-foreground',
                    )}
                >
                    All
                </button>
                <button
                    onClick={() => setFilter('unread')}
                    className={cn(
                        'flex-1 text-sm py-2.5 font-medium transition-colors',
                        filter === 'unread'
                            ? 'text-brand border-b-2 border-brand'
                            : 'text-muted-foreground hover:text-foreground',
                    )}
                >
                    Unread
                    {unreadFiltered > 0 && (
                        <span className="ml-1.5 inline-flex items-center justify-center min-w-[20px] h-5 rounded-full bg-brand/10 text-brand text-[11px] font-semibold px-1.5">
                            {unreadFiltered}
                        </span>
                    )}
                </button>
            </div>

            {/* ── Content ────────────────────────────────────────── */}
            <div className={cn(
                'flex-1 overflow-y-auto',
                !isMobile && 'max-h-[26rem]',
            )}>
                {loading ? (
                    <div>
                        {[1, 2, 3, 4, 5].map((i) => (
                            <SkeletonItem key={i} />
                        ))}
                    </div>
                ) : totalFiltered === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
                            {filter === 'unread' ? (
                                <Check className="w-7 h-7 text-muted-foreground" />
                            ) : (
                                <PartyPopper className="w-7 h-7 text-muted-foreground" />
                            )}
                        </div>
                        <p className="text-sm text-foreground font-medium">
                            {filter === 'unread'
                                ? 'No unread notifications'
                                : 'You\'re all caught up!'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {filter === 'unread'
                                ? 'Everything has been taken care of.'
                                : 'We\'ll let you know when something arrives.'}
                        </p>
                    </div>
                ) : (
                    <div>
                        {groups.map((group) => (
                            <div key={group.key}>
                                <div className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 bg-muted/30">
                                    {group.label}
                                </div>
                                {group.items.map((n) => {
                                    const Icon = ICON_MAP[n.data.icon] ?? ICON_MAP.default;
                                    const isUnread = !n.read_at;

                                    return (
                                        <div
                                            key={n.id}
                                            className={cn(
                                                'flex items-start gap-3 px-4 py-3.5 hover:bg-accent/40 transition-colors cursor-pointer',
                                                isUnread && 'bg-brand/[0.04]',
                                                isMobile && 'active:bg-accent/60',
                                            )}
                                            onClick={() => handleView(n.id, n.data.action_url)}
                                        >
                                            <div
                                                className={cn(
                                                    'flex-shrink-0 rounded-full flex items-center justify-center',
                                                    isMobile ? 'w-10 h-10' : 'w-8 h-8',
                                                    isUnread
                                                        ? 'bg-brand/10 text-brand'
                                                        : 'bg-gray-100 dark:bg-gray-800 text-muted-foreground',
                                                )}
                                            >
                                                <Icon className={cn(isMobile ? 'w-5 h-5' : 'w-4 h-4')} />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className={cn(
                                                        'font-medium leading-snug line-clamp-1',
                                                        isMobile ? 'text-[15px]' : 'text-sm',
                                                    )}>
                                                        {n.data.title}
                                                    </p>
                                                    {isUnread && (
                                                        <span className="flex-shrink-0 w-2 h-2 rounded-full bg-brand mt-1.5" />
                                                    )}
                                                </div>
                                                <p className={cn(
                                                    'text-muted-foreground mt-0.5 line-clamp-2',
                                                    isMobile ? 'text-[13px]' : 'text-xs',
                                                )}>
                                                    {n.data.body}
                                                </p>
                                                <span className={cn(
                                                    'text-muted-foreground/60 mt-1 inline-block',
                                                    isMobile ? 'text-[11px]' : 'text-[10px]',
                                                )}>
                                                    {n.created_ago}
                                                </span>
                                            </div>

                                            {/* ── Actions ────────────────── */}
                                            <div className={cn(
                                                'flex items-center gap-1 flex-shrink-0 -mr-1',
                                                isMobile ? 'flex' : 'hidden group-hover:flex',
                                            )}>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className={cn(
                                                        'rounded-full hover:bg-brand/10 hover:text-brand',
                                                        isMobile ? 'h-9 w-9' : 'h-7 w-7',
                                                    )}
                                                    title="View"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleView(n.id, n.data.action_url);
                                                    }}
                                                >
                                                    <ExternalLink className={cn(isMobile ? 'w-4 h-4' : 'w-3.5 h-3.5')} />
                                                </Button>
                                                {isUnread && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className={cn(
                                                            'rounded-full hover:bg-muted',
                                                            isMobile ? 'h-9 w-9' : 'h-7 w-7',
                                                        )}
                                                        title="Mark as read"
                                                        onClick={(e) => handleDismiss(e, n.id)}
                                                    >
                                                        <Check className={cn(isMobile ? 'w-4 h-4' : 'w-3.5 h-3.5')} />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Footer ─────────────────────────────────────────── */}
            {isAdmin && (
                <div className="mt-auto shrink-0">
                    {!isMobile && <DropdownMenuSeparator className="m-0" />}
                    <button
                        onClick={() => {
                            onClose();
                            router.visit('/admin/settings?tab=notifications');
                        }}
                        className={cn(
                            'w-full flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors',
                            isMobile ? 'px-4 py-3 border-t border-border' : 'px-4 py-2.5',
                        )}
                    >
                        <Settings className="w-3.5 h-3.5" />
                        Notification preferences
                    </button>
                </div>
            )}
        </div>
    );
}

export default function NotificationBell() {
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);
    const [badgeKey, setBadgeKey] = useState(0);
    const prevUnreadRef = useRef(0);
    const isMobile = useIsMobile();
    const { auth } = usePage().props as { auth: { user: { role: string } | null } };
    const isAdmin = auth?.user?.role === 'admin' || auth?.user?.role === 'checkin_staff';

    const fetchUnreadCount = useCallback(async () => {
        try {
            const res = await fetch('/notifications/fetch', {
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
            });
            const data = await res.json();

            if (data.unread_count > prevUnreadRef.current) {
                setBadgeKey((k) => k + 1);
            }
            setUnreadCount(data.unread_count);
            prevUnreadRef.current = data.unread_count;
        } catch {
            // silent
        }
    }, []);

    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, [fetchUnreadCount]);

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    return (
        <>
            {/* ── Bell trigger (shared) ───────────────────────────── */}
            <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={handleOpen}
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span
                        key={badgeKey}
                        className={cn(
                            'absolute -top-0.5 -right-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[9px] font-bold leading-none px-1',
                            badgeKey > 0 && 'animate-badge-pop',
                        )}
                    >
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </Button>

            {/* ── Mobile: bottom sheet ───────────────────────────── */}
            {isMobile && (
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetContent
                        side="bottom"
                        className="h-[90dvh] p-0 rounded-t-xl [&>button]:hidden"
                    >
                        <NotificationContent isMobile onClose={handleClose} isAdmin={isAdmin} />
                    </SheetContent>
                </Sheet>
            )}

            {/* ── Desktop: dropdown ────────────────────────────────── */}
            {!isMobile && (
                <DropdownMenu open={open} onOpenChange={setOpen}>
                    <DropdownMenuTrigger asChild>
                        <span />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        className="w-96 overflow-hidden flex flex-col p-0"
                    >
                        <NotificationContent isMobile={false} onClose={handleClose} isAdmin={isAdmin} />
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </>
    );
}
