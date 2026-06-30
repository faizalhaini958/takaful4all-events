import UserDashboardLayout from '@/Layouts/UserDashboardLayout';
import { Link, usePage } from '@inertiajs/react';
import { Ticket, ShoppingBag, Calendar, MapPin, Clock, ArrowRight, Wallet } from 'lucide-react';
import { useState, useEffect } from 'react';
import { type EventRegistration, type PageProps } from '@/types';
import { getRegistrationStatusLabel } from '@/lib/status-colors';

interface DashboardStats {
    totalTickets: number;
    upcomingEvents: number;
    totalOrders: number;
    totalSpent: number;
}

interface Props {
    upcomingRegistrations: EventRegistration[];
    recentOrders: EventRegistration[];
}

function getDaysUntil(dateStr: string): number | null {
    const d = new Date(dateStr);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    return Math.round((d.getTime() - now.getTime()) / 86400000);
}

function getTimeOfDay(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
}

// Stable colour from a string (for avatar initials)
function strColor(str: string): string {
    const palette = ['#009FBB','#003366','#10b981','#8b5cf6','#f59e0b','#ef4444','#06b6d4','#ec4899'];
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return palette[Math.abs(hash) % palette.length];
}

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

function MiniCountdown({ target }: { target: Date }) {
    const t = useCountdown(target);
    if (!t) return null;
    return (
        <div className="flex items-center gap-3 mt-2 pt-2 border-t border-white/20">
            {[{ v: t.d, l: 'days' }, { v: t.h, l: 'hrs' }, { v: t.m, l: 'min' }, { v: t.s, l: 'sec' }].map(({ v, l }) => (
                <div key={l} className="text-center">
                    <span className="block text-xs font-bold text-white tabular-nums leading-none">{String(v).padStart(2, '0')}</span>
                    <span className="block text-[9px] text-white/60 uppercase tracking-wide mt-0.5">{l}</span>
                </div>
            ))}
        </div>
    );
}

function MiniCountdownLight({ target }: { target: Date }) {
    const t = useCountdown(target);
    if (!t) return null;
    return (
        <div className="flex items-center gap-1.5">
            {[{ v: t.d, l: 'days' }, { v: t.h, l: 'hrs' }, { v: t.m, l: 'min' }, { v: t.s, l: 'sec' }].map(({ v, l }) => (
                <div key={l} className="text-center bg-gray-50 dark:bg-muted rounded-lg px-1.5 py-1 min-w-[30px]">
                    <span className="block text-sm font-black text-brand-navy dark:text-brand tabular-nums leading-none">{String(v).padStart(2, '0')}</span>
                    <span className="block text-[9px] text-gray-400 dark:text-muted-foreground uppercase tracking-wide mt-0.5">{l}</span>
                </div>
            ))}
        </div>
    );
}

export default function Dashboard({ upcomingRegistrations, recentOrders }: Props) {
    const { auth } = usePage<PageProps>().props;
    const user = auth.user;
    const firstName = user?.name?.split(' ')[0] ?? 'there';
    const nextEvent = upcomingRegistrations[0] ?? null;
    const upcoming = upcomingRegistrations
        .filter((r) => r.event?.id !== nextEvent?.event?.id)
        .slice(0, 6);

    return (
        <UserDashboardLayout title="My Dashboard">
            <div className="space-y-6">

                {/* ── Hero greeting banner ── */}
                <div className="rounded-2xl overflow-hidden shadow-md" style={{ background: 'linear-gradient(135deg, #001830 0%, #003366 50%, #006e88 100%)' }}>
                    <div className="relative px-5 py-5 sm:px-7 sm:py-6 flex items-center justify-between">
                        {/* left: greeting + name */}
                        <div className="relative z-10 min-w-0 pr-3">
                            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight truncate">{firstName} 👋</h1>
                            <p className="text-sm mt-1" style={{ color: 'rgba(200,244,249,0.6)' }}>Welcome back to your dashboard</p>
                        </div>
                        {/* right: avatar initial */}
                        <div className="relative z-10 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border-2 flex items-center justify-center text-xl sm:text-2xl font-black text-white flex-shrink-0 shadow-lg"
                            style={{ background: 'linear-gradient(135deg, #009FBB 0%, #003366 100%)', borderColor: 'rgba(255,255,255,0.2)' }}>
                            {user?.name?.charAt(0).toUpperCase() ?? '?'}
                        </div>
                    </div>
                </div>

                {/* ── Two-column body ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* ── Left (2/3): events ── */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* ── Ongoing / Next Event — side by side layout ── */}
                        <div className="bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between px-5 pt-5 pb-4">
                                <h2 className="text-base font-bold text-gray-900 dark:text-foreground">Ongoing Event</h2>
                                <Link href="/dashboard/tickets" className="text-xs font-semibold text-brand hover:underline flex items-center gap-1">
                                    View all <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>

                            {nextEvent ? (() => {
                                const startDate = nextEvent.event?.start_at ? new Date(nextEvent.event.start_at) : null;
                                const mediaUrl  = nextEvent.event?.media?.url ?? null;
                                const days      = startDate ? getDaysUntil(nextEvent.event!.start_at!) : null;
                                return (
                                    <div className="flex gap-0 px-5 pb-5">
                                        {/* ── Left: poster ── */}
                                        <div className="relative flex-shrink-0 w-28 sm:w-36 rounded-xl overflow-hidden bg-gray-900 self-stretch min-h-[200px]">
                                            {mediaUrl ? (<>
                                                <img src={mediaUrl} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover scale-110 blur-md opacity-50" />
                                                <img src={mediaUrl} alt={nextEvent.event?.title ?? ''} className="absolute inset-0 w-full h-full object-contain" />
                                            </>) : (
                                                <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#002244 0%,#009FBB 100%)' }}>
                                                    <Calendar className="w-10 h-10 text-white/20" />
                                                </div>
                                            )}
                                            {/* status badge */}
                                            <div className="absolute top-2 left-0 right-0 flex justify-center">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                    nextEvent.status === 'confirmed' ? 'bg-emerald-500 text-white' :
                                                    nextEvent.status === 'pending'   ? 'bg-amber-500 text-white'   :
                                                    nextEvent.status === 'awaiting_payment' ? 'bg-orange-500 text-white' :
                                                    'bg-gray-500 text-white'
                                                }`}>{getRegistrationStatusLabel(nextEvent.status, nextEvent.payment_status)}</span>
                                            </div>
                                        </div>

                                        {/* ── Right: details ── */}
                                        <div className="flex-1 min-w-0 pl-4 flex flex-col justify-between">
                                            <div>
                                                {/* days badge */}
                                                {days === 0 && (
                                                    <span className="inline-flex text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-600 mb-2 animate-pulse">Today!</span>
                                                )}
                                                {days !== null && days > 0 && (
                                                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand/10 text-brand mb-2">
                                                        <Clock className="w-3 h-3" />In {days} days
                                                    </span>
                                                )}
                                                <h3 className="font-bold text-gray-900 dark:text-foreground text-sm leading-snug line-clamp-3 mt-0.5">
                                                    {nextEvent.event?.title}
                                                </h3>
                                                {startDate && (
                                                    <p className="text-gray-500 dark:text-muted-foreground text-xs mt-2 flex items-center gap-1">
                                                        <Calendar className="w-3 h-3 flex-shrink-0 text-brand" />
                                                        {startDate.toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </p>
                                                )}
                                                {nextEvent.event?.venue && (
                                                    <p className="text-gray-500 dark:text-muted-foreground text-xs mt-1 flex items-center gap-1">
                                                        <MapPin className="w-3 h-3 flex-shrink-0 text-brand" />
                                                        <span className="line-clamp-1">{nextEvent.event.venue}{nextEvent.event.city ? `, ${nextEvent.event.city}` : ''}</span>
                                                    </p>
                                                )}
                                                {/* countdown */}
                                                {startDate && (
                                                    <div className="mt-3">
                                                        <MiniCountdownLight target={startDate} />
                                                    </div>
                                                )}
                                            </div>

                                            {/* ref + CTA */}
                                            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-border flex items-center justify-between">
                                                <span className="text-[10px] font-mono text-gray-400 dark:text-muted-foreground">{nextEvent.reference_no}</span>
                                                <Link href="/dashboard/tickets" className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-brand hover:bg-brand-dark px-3 py-1.5 rounded-xl transition-colors">
                                                    <Ticket className="w-3 h-3" /> View Ticket
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })() : (
                                <div className="mx-5 mb-5 rounded-2xl border-2 border-dashed border-gray-200 dark:border-border py-12 flex flex-col items-center text-center">
                                    <Calendar className="w-8 h-8 text-gray-200 dark:text-muted mb-2" />
                                    <p className="text-sm font-semibold text-gray-400 dark:text-muted-foreground">No ongoing events</p>
                                    <Link href="/events" className="mt-3 text-xs font-bold text-brand hover:underline">Browse Events →</Link>
                                </div>
                            )}
                        </div>

                        {/* Upcoming Event — date-badge cards like reference */}
                        {upcoming.length > 0 && (
                            <div className="bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border shadow-sm overflow-hidden">
                                <div className="flex items-center justify-between px-5 pt-5 pb-4">
                                    <h2 className="text-base font-bold text-gray-900 dark:text-foreground">Upcoming Event</h2>
                                    <Link href="/dashboard/tickets" className="text-xs font-semibold text-brand hover:underline flex items-center gap-1">
                                        View all <ArrowRight className="w-3.5 h-3.5" />
                                    </Link>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 px-5 pb-5">
                                    {upcoming.map((reg) => {
                                        const startDate = reg.event?.start_at ? new Date(reg.event.start_at) : null;
                                        const mediaUrl = reg.event?.media?.url ?? null;
                                        return (
                                            <Link
                                                key={reg.id}
                                                href="/dashboard/tickets"
                                                className="group relative block rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 aspect-[3/4] bg-gray-900"
                                            >
                                                {/* Blurred background fill */}
                                                {mediaUrl && (
                                                    <img src={mediaUrl} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover scale-110 blur-md opacity-60" />
                                                )}
                                                {/* Foreground image */}
                                                {mediaUrl ? (
                                                    <img src={mediaUrl} alt={reg.event?.title ?? ''} className="absolute inset-0 w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
                                                ) : (
                                                    <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-brand-light">
                                                        <Calendar className="w-10 h-10 text-brand/30" />
                                                    </div>
                                                )}
                                                {/* Gradient overlay */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                                                {/* Top row: status + date */}
                                                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm ${
                                                        reg.status === 'confirmed' ? 'bg-brand-light text-brand-dark' : 'bg-white/20 text-white'
                                                    }`}>
                                                        {reg.status.charAt(0).toUpperCase() + reg.status.slice(1)}
                                                    </span>
                                                    {startDate && (
                                                        <span className="text-[10px] font-medium text-white bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full">
                                                            {startDate.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </span>
                                                    )}
                                                </div>
                                                {/* Bottom content */}
                                                <div className="absolute bottom-0 left-0 right-0 p-3">
                                                    <h3 className="font-bold text-white text-xs leading-snug line-clamp-2 group-hover:text-brand-light transition-colors">
                                                        {reg.event?.title}
                                                    </h3>
                                                    {(reg.event?.venue || reg.event?.city) && (
                                                        <p className="mt-1 text-[10px] text-white/65 flex items-center gap-1">
                                                            <MapPin className="w-3 h-3 flex-shrink-0" />
                                                            <span className="line-clamp-1">{reg.event.venue ?? reg.event.city}</span>
                                                        </p>
                                                    )}
                                                    {startDate && <MiniCountdown target={startDate} />}
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                    </div>

                    {/* ── Right (1/3): Recent Orders as activity feed ── */}
                    <div className="bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border shadow-sm overflow-hidden self-start">
                        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-50 dark:border-border">
                            <h2 className="text-base font-bold text-gray-900 dark:text-foreground">Recent Orders</h2>
                            <Link href="/dashboard/orders" className="text-xs font-semibold text-brand hover:underline">View all</Link>
                        </div>

                        {recentOrders.length === 0 ? (
                            <div className="py-12 flex flex-col items-center text-center">
                                <ShoppingBag className="w-8 h-8 text-gray-200 dark:text-muted mb-2" />
                                <p className="text-sm text-gray-400 dark:text-muted-foreground">No orders yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50 dark:divide-border">
                                {recentOrders.slice(0, 8).map((order) => {
                                    const initial = order.event?.title?.charAt(0)?.toUpperCase() ?? 'E';
                                    const color = strColor(order.event?.title ?? order.id.toString());
                                    return (
                                        <div key={order.id} className="px-5 py-3.5 hover:bg-gray-50/60 dark:hover:bg-muted/40 transition-colors">
                                            <div className="flex items-start gap-3">
                                                {/* Event initial avatar */}
                                                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-black flex-shrink-0 mt-0.5" style={{ background: color }}>
                                                    {initial}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-foreground leading-snug line-clamp-2">{order.event?.title ?? 'Order'}</p>
                                                    <p className="text-xs font-mono text-gray-400 dark:text-muted-foreground mt-0.5">{order.reference_no}</p>
                                                    <div className="flex items-center justify-between mt-1.5">
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                            order.payment_status === 'paid'     ? 'bg-emerald-100 text-emerald-700' :
                                                            order.payment_status === 'pending'  ? 'bg-amber-100 text-amber-700'   :
                                                            order.payment_status === 'refunded' ? 'bg-red-100 text-red-700'       :
                                                            'bg-gray-100 dark:bg-muted text-gray-500 dark:text-muted-foreground'
                                                        }`}>{order.payment_status === 'na' ? 'Free' : order.payment_status}</span>
                                                        <span className="text-xs font-bold text-brand-navy">
                                                            {Number(order.total_amount) > 0 ? `RM ${Number(order.total_amount).toFixed(2)}` : 'Free'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Discover CTA inside the panel bottom */}
                        <div className="mx-4 mb-4 mt-2 rounded-xl p-4" style={{ background: 'linear-gradient(135deg,#002244 0%,#009FBB 100%)' }}>
                            <p className="text-white font-bold text-sm">Discover more events</p>
                            <p className="text-white/60 text-xs mt-0.5">Meetups, conferences & workshops</p>
                            <Link href="/events" className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold bg-white dark:bg-card text-brand-navy dark:text-foreground px-3 py-1.5 rounded-lg hover:bg-brand-light dark:hover:bg-muted transition-colors">
                                Browse <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>
                    </div>

                </div>

            </div>
        </UserDashboardLayout>
    );
}
