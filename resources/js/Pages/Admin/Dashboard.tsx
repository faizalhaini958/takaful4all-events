import AdminLayout from '@/Layouts/AdminLayout';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import {
    AreaChart, Area, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
    CalendarDays, Users, PenSquare, DollarSign,
    Eye, MousePointerClick, Activity, TrendingUp, ArrowUpRight,
    ChevronRight, BarChart3, PlusCircle, Sparkles, Globe, LayoutDashboard,
} from 'lucide-react';
import StatCard from '@/Components/Dashboard/StatCard';
import ChartCard from '@/Components/Dashboard/ChartCard';
import UpcomingEventCard from '@/Components/Dashboard/UpcomingEventCard';
import ActivityItem from '@/Components/Dashboard/ActivityItem';
import {
    type DashboardData,
    type TrendPoint,
    type RevenuePoint,
    type CategoryBreakdown,
    type StatusBreakdown,
    type RecentRegistration,
    type Event,
} from '@/types';
import { cn } from '@/lib/utils';

interface Props extends DashboardData {}

type Tab = 'overview' | 'analytics' | 'activity';

const CATEGORY_LABELS: Record<string, string> = {
    conference: 'Conference',
    workshop: 'Workshop',
    sports: 'Sports',
    dinner: 'Dinner',
    entertainment: 'Entertainment',
    exhibition: 'Exhibition',
    general: 'General',
};

const CATEGORY_COLORS: string[] = [
    '#1C7C93', '#16324A', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
];

const STATUS_COLORS: Record<string, string> = {
    confirmed: '#10b981',
    attended: '#3b82f6',
    pending: '#f59e0b',
    awaiting_payment: '#f97316',
    cancelled: '#ef4444',
    waitlisted: '#6b7280',
};

const STATUS_LABELS: Record<string, string> = {
    confirmed: 'Confirmed',
    attended: 'Attended',
    pending: 'Pending',
    awaiting_payment: 'Awaiting Payment',
    cancelled: 'Cancelled',
    waitlisted: 'Waitlisted',
};

function shortDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' });
}

function formatCurrency(n: number): string {
    return Number(n).toLocaleString('en-MY', { minimumFractionDigits: 2 });
}

function fmtNumber(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return String(n);
}

const CHART_TOOLTIP_STYLE: React.CSSProperties = {
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
    fontSize: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
};

export default function Dashboard(props: Props) {
    const { auth } = usePage().props;
    const user = auth.user;
    const firstName = user?.name?.split(' ')[0] ?? 'Admin';

    const [tab, setTab] = useState<Tab>('overview');
    const [activityFilter, setActivityFilter] = useState<string>('all');

    const {
        stats,
        monthOverMonth,
        registrationTrend,
        revenueTrend,
        eventCategoryBreakdown,
        registrationStatusBreakdown,
        recentRegistrations,
        recentEvents,
        analyticsSnapshot,
    } = props;

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    const today = new Date().toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    const upcomingEvents = (recentEvents as (Event & { registrations_count?: number })[]).filter(
        e => e.status === 'upcoming'
    );

    const regTrendData = (registrationTrend as TrendPoint[]).map(p => ({
        date: shortDate(p.date),
        Registrations: p.count,
    }));
    const regTrendHasActivity = regTrendData.some(p => p.Registrations > 0);

    const revTrendData = (revenueTrend as RevenuePoint[]).map(p => ({
        date: shortDate(p.date),
        Revenue: Number(p.amount),
    }));
    const revTrendHasActivity = revTrendData.some(p => p.Revenue > 0);

    // With ~31 daily points, showing every tick overlaps. Pick ~6 tick labels
    // spaced across the range; Recharts still hovers-tooltips every point.
    const trendTickInterval = regTrendData.length > 12 ? Math.ceil(regTrendData.length / 6) - 1 : 0;

    const categoryData = (eventCategoryBreakdown as CategoryBreakdown[]).map((c, i) => ({
        name: CATEGORY_LABELS[c.event_category] ?? c.event_category,
        value: c.count,
        color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
    }));

    const statusData = (registrationStatusBreakdown as StatusBreakdown[]).map(s => ({
        name: STATUS_LABELS[s.status] ?? s.status,
        value: s.count,
        color: STATUS_COLORS[s.status] ?? '#6b7280',
    }));

    const visitorsChartData = (analyticsSnapshot.daily_visitors as { date: string; sessions: number }[]).map(v => ({
        date: shortDate(v.date),
        Visitors: v.sessions,
    }));

    const filteredRegistrations = (recentRegistrations as RecentRegistration[]).filter(r =>
        activityFilter === 'all' ? true : r.status === activityFilter
    );

    const tabs: { key: Tab; label: string; icon: typeof LayoutDashboard; activeClass: string; iconActiveClass: string }[] = [
        { key: 'overview', label: 'Overview', icon: LayoutDashboard, activeClass: 'bg-brand/10 text-brand-navy', iconActiveClass: 'text-brand' },
        { key: 'analytics', label: 'Analytics', icon: TrendingUp, activeClass: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300', iconActiveClass: 'text-indigo-600 dark:text-indigo-400' },
        { key: 'activity', label: 'Activity', icon: Activity, activeClass: 'bg-slate-500/10 text-slate-700 dark:text-slate-300', iconActiveClass: 'text-slate-600 dark:text-slate-400' },
    ];

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* ── Option B — Hero Banner Header ── */}
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-brand-navy via-brand-royal to-brand shadow-lg">
                    {/* Decorative background dots */}
                    <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{
                        backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
                        backgroundSize: '20px 20px',
                    }} />

                    <div className="relative px-5 py-6 sm:px-8 sm:py-8">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
                            {/* Left — Avatar + Identity + Greeting */}
                            <div className="flex items-start gap-4 min-w-0">
                                {/* Avatar */}
                                <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-2xl font-extrabold shadow-xl"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05))',
                                        border: '2px solid rgba(255,255,255,0.25)',
                                        color: '#fff',
                                    }}>
                                    {firstName.charAt(0).toUpperCase()}
                                </div>

                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                                            {user?.name ?? 'Admin'}
                                        </h1>
                                        {user?.role && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase"
                                                style={{
                                                    background: 'rgba(255,255,255,0.12)',
                                                    color: 'rgba(200,244,249,0.95)',
                                                    border: '1px solid rgba(255,255,255,0.15)',
                                                }}>
                                                <Sparkles className="w-3 h-3" />
                                                {user.role.replace('_', ' ')}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm sm:text-base mt-1.5" style={{ color: 'rgba(200,244,249,0.9)' }}>
                                        {greeting}!{' '}
                                        {upcomingEvents.length > 0
                                            ? `You have ${upcomingEvents.length} upcoming event${upcomingEvents.length > 1 ? 's' : ''} to manage.`
                                            : `Here's what's happening today.`
                                        }
                                    </p>
                                    <p className="text-xs mt-1" style={{ color: 'rgba(200,244,249,0.55)' }}>{today}</p>
                                </div>
                            </div>

                            {/* Right — Action Buttons */}
                            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                                <Link
                                    href="/admin/events/create"
                                    className="inline-flex items-center gap-2 rounded-xl bg-white hover:bg-white/90 text-brand-navy px-5 py-2.5 text-sm font-semibold shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                                >
                                    <PlusCircle className="w-4 h-4" />
                                    New Event
                                </Link>
                                <Link
                                    href="/admin/posts/create"
                                    className="inline-flex items-center gap-2 rounded-xl border border-white/25 text-white hover:bg-white/10 px-4 py-2.5 text-sm font-medium transition-all duration-200"
                                >
                                    <PenSquare className="w-4 h-4" />
                                    New Post
                                </Link>
                                <a
                                    href="/"
                                    target="_blank"
                                    className="inline-flex items-center gap-2 rounded-xl border border-white/20 text-white/70 hover:text-white hover:bg-white/10 px-4 py-2.5 text-sm font-medium transition-all duration-200"
                                >
                                    <Globe className="w-4 h-4" />
                                    <span className="hidden sm:inline">View Site</span>
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Subtle bottom shimmer */}
                    <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)' }} />
                </div>

                {/* ── Tab Bar ── */}
                <div className="flex items-center gap-1 p-1.5 rounded-xl w-full bg-muted/60 border border-border">
                    {tabs.map(t => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={cn(
                                'flex-1 inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 text-center',
                                tab === t.key
                                    ? cn(t.activeClass, 'shadow-sm')
                                    : 'text-muted-foreground hover:text-foreground hover:bg-card/60',
                            )}
                        >
                            <t.icon className={cn('w-4 h-4', tab === t.key ? t.iconActiveClass : 'text-muted-foreground')} />
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* ════════════════════════════════════════════════════════════
                    TAB 1 — OVERVIEW
                ════════════════════════════════════════════════════════════ */}
                {tab === 'overview' && (
                    <div className="space-y-6">
                        {/* Stat Cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                            <StatCard
                                icon={CalendarDays}
                                label="Events"
                                value={String(stats.events.total)}
                                href="/admin/events"
                                trend={{
                                    comparison: monthOverMonth.events,
                                    label: 'new vs prior 30 days',
                                    pctBaselineMin: 5,
                                }}
                                colorClass="bg-[#16324A]/10 text-[#16324A] dark:text-brand-light"
                                gradientClass="bg-gradient-to-r from-brand-navy via-brand-navy to-brand"
                            />
                            <StatCard
                                icon={Users}
                                label="Registrations"
                                value={String(stats.registrations.total)}
                                href="/admin/registrations"
                                trend={{
                                    comparison: monthOverMonth.registrations,
                                    label: 'new vs prior 30 days',
                                    pctBaselineMin: 10,
                                }}
                                colorClass="bg-brand/10 text-brand"
                                gradientClass="bg-gradient-to-r from-brand via-brand to-brand-light"
                            />
                            <StatCard
                                icon={DollarSign}
                                label="Revenue"
                                value={`RM ${formatCurrency(stats.registrations.revenue)}`}
                                href="/admin/orders"
                                trend={{
                                    comparison: monthOverMonth.revenue,
                                    label: 'vs prior 30 days',
                                    pctBaselineMin: 500,
                                    formatDelta: (n) => `RM ${formatCurrency(n)}`,
                                }}
                                colorClass="bg-[#1B4F91]/10 text-[#1B4F91] dark:text-[#56B8C4]"
                                gradientClass="bg-gradient-to-r from-brand-royal via-brand-royal to-brand"
                            />
                            <StatCard
                                icon={PenSquare}
                                label="Posts"
                                value={String(stats.posts.total)}
                                href="/admin/posts"
                                colorClass="bg-slate-500/10 text-slate-600 dark:text-slate-400"
                                gradientClass="bg-gradient-to-r from-slate-500 via-slate-400 to-slate-300"
                            />
                        </div>

                        {/* Charts Row 1 — Trends */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                            <ChartCard title="Registration Trend · Last 30 Days" gradientClass="bg-gradient-to-r from-brand-navy via-brand to-brand-light">
                                {!regTrendHasActivity ? (
                                    <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">
                                        No registrations in the last 30 days
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height={220}>
                                        <AreaChart data={regTrendData} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
                                            <defs>
                                                <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#1C7C93" stopOpacity={0.25} />
                                                    <stop offset="100%" stopColor="#1C7C93" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                            <XAxis dataKey="date" interval={trendTickInterval} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                                            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                                            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} cursor={{ stroke: '#1C7C93', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                            <Area type="monotone" dataKey="Registrations" stroke="#1C7C93" strokeWidth={2.5} fill="url(#regGrad)" dot={false} activeDot={{ r: 4, fill: '#1C7C93', strokeWidth: 0 }} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                )}
                            </ChartCard>

                            <ChartCard title="Revenue Trend · Last 30 Days" gradientClass="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300">
                                {!revTrendHasActivity ? (
                                    <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">
                                        No revenue in the last 30 days
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height={220}>
                                        <AreaChart data={revTrendData} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
                                            <defs>
                                                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.25} />
                                                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                            <XAxis dataKey="date" interval={trendTickInterval} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                                            <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `RM${v}`} />
                                            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} cursor={{ stroke: '#f59e0b', strokeWidth: 1, strokeDasharray: '4 4' }} formatter={(value) => [`RM ${formatCurrency(Number(value ?? 0))}`, 'Revenue']} />
                                            <Area type="monotone" dataKey="Revenue" stroke="#f59e0b" strokeWidth={2.5} fill="url(#revGrad)" dot={false} activeDot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                )}
                            </ChartCard>
                        </div>

                        {/* Charts Row 2 — Donuts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                            <ChartCard title="Events by Category" gradientClass="bg-gradient-to-r from-brand-navy via-brand to-brand-light">
                                {categoryData.length === 0 ? (
                                    <div className="flex items-center justify-center h-[250px] text-sm text-muted-foreground">
                                        No categories yet
                                    </div>
                                ) : (
                                    <div className="flex flex-col sm:flex-row items-center gap-4">
                                        <ResponsiveContainer width={180} height={180}>
                                            <PieChart>
                                                <Pie
                                                    data={categoryData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={50}
                                                    outerRadius={80}
                                                    paddingAngle={2}
                                                    dataKey="value"
                                                >
                                                    {categoryData.map((entry, i) => (
                                                        <Cell key={i} fill={entry.color} stroke="none" />
                                                    ))}
                                                </Pie>
                                                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                                            {categoryData.map(c => (
                                                <div key={c.name} className="flex items-center gap-2 text-sm">
                                                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                                                    <span className="text-muted-foreground">{c.name}</span>
                                                    <span className="font-medium tabular-nums ml-auto">{c.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </ChartCard>

                            <ChartCard title="Registration Status" gradientClass="bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-400">
                                {statusData.length === 0 ? (
                                    <div className="flex items-center justify-center h-[250px] text-sm text-muted-foreground">
                                        No registrations yet
                                    </div>
                                ) : (
                                    <div className="flex flex-col sm:flex-row items-center gap-4">
                                        <ResponsiveContainer width={180} height={180}>
                                            <PieChart>
                                                <Pie
                                                    data={statusData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={50}
                                                    outerRadius={80}
                                                    paddingAngle={2}
                                                    dataKey="value"
                                                >
                                                    {statusData.map((entry, i) => (
                                                        <Cell key={i} fill={entry.color} stroke="none" />
                                                    ))}
                                                </Pie>
                                                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                                            {statusData.map(s => (
                                                <div key={s.name} className="flex items-center gap-2 text-sm">
                                                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                                                    <span className="text-muted-foreground">{s.name}</span>
                                                    <span className="font-medium tabular-nums ml-auto">{s.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </ChartCard>
                        </div>

                        {/* Upcoming Events */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h2 className="text-base font-semibold text-foreground">Upcoming Events</h2>
                                <a href="/admin/events" className="text-xs font-medium text-brand hover:text-brand-dark transition-colors inline-flex items-center gap-1">
                                    View all <ChevronRight className="w-3.5 h-3.5" />
                                </a>
                            </div>
                            {upcomingEvents.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-border bg-muted/30 py-10 text-center">
                                    <CalendarDays className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                    <p className="text-sm text-muted-foreground">No upcoming events</p>
                                    <a href="/admin/events/create" className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline">
                                        <TrendingUp className="w-3.5 h-3.5" /> Create your first event
                                    </a>
                                </div>
                            ) : (
                                <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none snap-x snap-mandatory">
                                    {upcomingEvents.map(event => (
                                        <div key={event.id} className="snap-start">
                                            <UpcomingEventCard event={event} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Recent Registrations */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h2 className="text-base font-semibold text-foreground">Recent Registrations</h2>
                                <a href="/admin/registrations" className="text-xs font-medium text-brand hover:text-brand-dark transition-colors inline-flex items-center gap-1">
                                    View all <ChevronRight className="w-3.5 h-3.5" />
                                </a>
                            </div>
                            {recentRegistrations.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-border bg-muted/30 py-10 text-center">
                                    <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                    <p className="text-sm text-muted-foreground">No registrations yet</p>
                                </div>
                            ) : (
                                <div className="relative rounded-xl border border-border bg-gradient-to-br from-card to-brand/[0.03] shadow-sm overflow-hidden">
                                    <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-brand-navy via-brand to-brand-light" />
                                    <div className="divide-y divide-border/60 pt-[3px]">
                                    {(recentRegistrations as RecentRegistration[]).slice(0, 5).map(r => (
                                        <ActivityItem key={r.id} registration={r} />
                                    ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ════════════════════════════════════════════════════════════
                    TAB 2 — ANALYTICS
                ════════════════════════════════════════════════════════════ */}
                {tab === 'analytics' && (
                    <div className="space-y-6">
                        {/* Mini KPI Cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            <StatCard
                                icon={Users}
                                label="Today's Visitors"
                                value={fmtNumber(analyticsSnapshot.today_visits)}
                                colorClass="bg-[#1B4F91]/10 text-[#1B4F91] dark:text-[#56B8C4]"
                                gradientClass="bg-gradient-to-r from-brand-royal via-brand-royal to-brand"
                            />
                            <StatCard
                                icon={MousePointerClick}
                                label="Today's Page Views"
                                value={fmtNumber(analyticsSnapshot.today_page_views)}
                                colorClass="bg-brand/10 text-brand"
                                gradientClass="bg-gradient-to-r from-brand via-brand to-brand-light"
                            />
                            <StatCard
                                icon={Activity}
                                label="Active Now"
                                value={String(analyticsSnapshot.active_visitors)}
                                colorClass="bg-[#56B8C4]/10 text-[#56B8C4] dark:text-[#56B8C4]"
                                gradientClass="bg-gradient-to-r from-[#56B8C4] via-[#56B8C4] to-brand"
                            />
                        </div>

                        {/* Visitors Chart */}
                        <ChartCard title="Daily Visitors · Last 7 Days" gradientClass="bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-400">
                            {visitorsChartData.length === 0 ? (
                                <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">
                                    No visitor data yet
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <AreaChart data={visitorsChartData} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
                                        <defs>
                                            <linearGradient id="visitGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.2} />
                                                <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                                        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                                        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                        <Area type="monotone" dataKey="Visitors" stroke="#6366f1" strokeWidth={2.5} fill="url(#visitGrad)" dot={false} activeDot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </ChartCard>

                        {/* Top Pages */}
                        <div className="relative rounded-xl border border-border bg-gradient-to-br from-card to-brand/[0.03] shadow-sm overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-brand-navy via-brand to-brand-light" />
                            <div className="px-4 sm:px-5 py-3 border-b border-border/60 pt-4">
                                <h3 className="text-sm font-semibold text-foreground">Top Pages Today</h3>
                            </div>
                            <div className="p-4 sm:p-5">
                                {analyticsSnapshot.top_pages.length === 0 ? (
                                    <div className="text-center py-8 text-sm text-muted-foreground">
                                        No page views today
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {analyticsSnapshot.top_pages.map((page, i) => (
                                            <div key={page.url} className="flex items-center gap-3">
                                                <span className="text-xs font-bold text-muted-foreground w-5 tabular-nums">{i + 1}</span>
                                                <span className="flex-1 text-sm text-foreground truncate">{page.url}</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-24 sm:w-32 h-2 rounded-full bg-muted overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full bg-brand transition-all"
                                                            style={{
                                                                width: `${Math.min((page.views / (analyticsSnapshot.top_pages[0]?.views ?? 1)) * 100, 100)}%`,
                                                            }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-medium text-muted-foreground tabular-nums w-8 text-right">{page.views}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Link to full analytics */}
                        <a
                            href="/admin/analytics"
                            className="inline-flex items-center gap-2 text-sm font-medium text-brand hover:underline"
                        >
                            <BarChart3 className="w-4 h-4" />
                            Open full analytics
                            <ArrowUpRight className="w-3.5 h-3.5" />
                        </a>
                    </div>
                )}

                {/* ════════════════════════════════════════════════════════════
                    TAB 3 — ACTIVITY
                ════════════════════════════════════════════════════════════ */}
                {tab === 'activity' && (
                    <div className="space-y-4">
                        {/* Filter Pills */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {[
                                { key: 'all', label: 'All' },
                                { key: 'confirmed', label: 'Confirmed' },
                                { key: 'pending', label: 'Pending' },
                                { key: 'awaiting_payment', label: 'Awaiting Payment' },
                                { key: 'attended', label: 'Attended' },
                                { key: 'cancelled', label: 'Cancelled' },
                            ].map(f => (
                                <button
                                    key={f.key}
                                    onClick={() => setActivityFilter(f.key)}
                                    className={cn(
                                        'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                                        activityFilter === f.key
                                            ? 'bg-brand text-white border-brand'
                                            : 'bg-card text-muted-foreground border-border hover:text-foreground hover:border-foreground/20',
                                    )}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>

                        {/* Activity List */}
                        <div className="relative rounded-xl border border-border bg-gradient-to-br from-card to-brand/[0.03] shadow-sm overflow-hidden">
                                    <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-brand-navy via-brand to-brand-light" />
                            {filteredRegistrations.length === 0 ? (
                                <div className="text-center py-12 pt-5">
                                    <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                    <p className="text-sm text-muted-foreground">No {activityFilter === 'all' ? '' : activityFilter.replace('_', ' ')} registrations</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {filteredRegistrations.map(r => (
                                        <ActivityItem key={r.id} registration={r} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
