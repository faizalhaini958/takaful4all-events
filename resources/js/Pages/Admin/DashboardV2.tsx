/**
 * Dashboard — admin homepage
 *
 * A shadcn-styled admin dashboard rendering the full DashboardController
 * payload with a flat, whitespace-forward visual language.
 */

import AdminLayout from '@/Layouts/AdminLayout';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import {
    AreaChart, ComposedChart, Area, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label,
} from 'recharts';
import {
    CalendarDays, Users, DollarSign, Activity, Calendar,
    ShoppingCart, TrendingUp, MousePointerClick, BarChart3,
    UserCheck, Clock, XCircle, ArrowUpRight, PlusCircle, PenSquare,
    Globe, MapPin, Trophy, Presentation, GraduationCap, UtensilsCrossed,
    PartyPopper, Image as ImageIcon, Sparkles, Award, Flame, Target,
    Sun, Sunrise, Sunset, Moon, LayoutDashboard,
} from 'lucide-react';
import {
    type DashboardData,
    type TrendPoint,
    type RevenuePoint,
    type StatusBreakdown,
    type RecentRegistration,
    type Event,
    type EventCategory,
    type MetricComparison,
} from '@/types';
import { cn } from '@/lib/utils';

interface Props extends DashboardData {}

// ── Palette (shadcn-neutral, one accent per chart type) ─────────────────
const ACCENT = {
    teal: '#009FBB',
    navy: '#003366',
    amber: '#f59e0b',
    emerald: '#10b981',
    rose: '#f43f5e',
    slate: '#64748b',
};

const STATUS_META: Record<string, { color: string; label: string }> = {
    confirmed:        { color: ACCENT.emerald, label: 'Confirmed' },
    attended:         { color: ACCENT.teal,    label: 'Attended' },
    pending:          { color: ACCENT.amber,   label: 'Pending' },
    awaiting_payment: { color: '#f97316',      label: 'Awaiting Payment' },
    cancelled:        { color: ACCENT.rose,    label: 'Cancelled' },
    waitlisted:       { color: ACCENT.slate,   label: 'Waitlisted' },
};

const CATEGORY_META: Record<EventCategory, { label: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }> = {
    sports:        { label: 'Sports',        icon: Trophy },
    conference:    { label: 'Conference',    icon: Presentation },
    workshop:      { label: 'Workshop',      icon: GraduationCap },
    dinner:        { label: 'Dinner',        icon: UtensilsCrossed },
    entertainment: { label: 'Entertainment', icon: PartyPopper },
    exhibition:    { label: 'Exhibition',    icon: ImageIcon },
    general:       { label: 'General',       icon: Sparkles },
};

// ── Helpers ─────────────────────────────────────────────────────────────
function shortDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' });
}
function formatCurrency(n: number): string {
    return Number(n).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function formatCompact(n: number): string {
    if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1) + 'k';
    return String(n);
}
function initials(name: string): string {
    return name.split(' ').filter(Boolean).slice(0, 2).map(s => s[0]?.toUpperCase() ?? '').join('');
}

const CHART_TOOLTIP_STYLE: React.CSSProperties = {
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
    fontSize: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
};

// ── Reusable sub-components (inlined for mockup-review clarity) ─────────

function Card({
    className, children, accent,
}: {
    className?: string;
    children: React.ReactNode;
    /** Optional Tailwind gradient utility (e.g. "from-brand via-brand to-brand-light") for the top accent stripe. */
    accent?: string;
}) {
    return (
        <div className={cn(
            'relative rounded-xl border border-border bg-gradient-to-br from-card to-brand/[0.02] p-5 overflow-hidden',
            className,
        )}>
            {accent && (
                <div className={cn(
                    'absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r',
                    accent,
                )} />
            )}
            <div className={cn(accent && 'pt-1')}>
                {children}
            </div>
        </div>
    );
}

function CardHeader({
    title, subtitle, action,
}: { title: string; subtitle?: string; action?: React.ReactNode }) {
    return (
        <div className="flex items-start justify-between mb-4">
            <div>
                <h3 className="text-base font-semibold text-foreground leading-tight">{title}</h3>
                {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
            </div>
            {action}
        </div>
    );
}

/**
 * KPI card — delta-forward layout inspired by the reference dashboard.
 * The big number is the delta (colored). The total sits underneath.
 * When the previous-period baseline is too small for a percentage to be
 * meaningful, we omit the pct and show an absolute change instead.
 */
function KpiCard({
    label, total, comparison, pctBaselineMin = 10, formatValue = String, accent,
}: {
    label: string;
    total: string;
    comparison: MetricComparison;
    pctBaselineMin?: number;
    formatValue?: (n: number) => string;
    /** Tailwind gradient utility string, e.g. "from-brand via-brand to-brand-light" */
    accent?: string;
}) {
    const { delta, previous, change_pct } = comparison;
    const usePct = change_pct !== null && previous >= pctBaselineMin;
    const sign = delta > 0 ? '+' : delta < 0 ? '−' : '';

    // Delta chip content: percentage when baseline is large enough, otherwise absolute delta
    const chipContent = delta === 0
        ? '±0'
        : usePct && change_pct !== null
            ? `${change_pct > 0 ? '+' : ''}${change_pct.toFixed(1)}%`
            : `${sign}${formatValue(Math.abs(delta))}`;

    // Hide the chip when there's genuinely no data on either side
    const showChip = !(comparison.current === 0 && comparison.previous === 0);

    return (
        <Card accent={accent} className="hover:border-foreground/30 hover:shadow-sm transition-all">
            <div className="flex items-start justify-between gap-2 mb-3">
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                {showChip && (
                    <span className={cn(
                        'inline-flex items-center gap-0.5 text-[11px] font-semibold rounded-full px-1.5 py-0.5 flex-shrink-0',
                        delta > 0
                            ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10'
                            : delta < 0
                                ? 'text-rose-700 dark:text-rose-400 bg-rose-500/10'
                                : 'text-muted-foreground bg-muted',
                    )}>
                        {chipContent}
                    </span>
                )}
            </div>
            <p className="text-3xl font-bold tabular-nums tracking-tight text-foreground">
                {total}
            </p>
        </Card>
    );
}

// ── Main component ──────────────────────────────────────────────────────

type Tab = 'overview' | 'analytics' | 'activity';

function fmtNumber(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return String(n);
}

export default function DashboardV2(props: Props) {
    const { auth } = usePage().props;
    const firstName = auth.user?.name?.split(' ')[0] ?? 'Admin';
    const roleLabel = auth.user?.role
        ? auth.user.role.replace(/_/g, ' ')
        : null;

    const [tab, setTab] = useState<Tab>('overview');
    const [activityFilter, setActivityFilter] = useState<string>('all');

    // Time-of-day greeting + matching icon
    const hour = new Date().getHours();
    const { greeting, TimeIcon, timeTone } =
        hour < 6  ? { greeting: 'Working late', TimeIcon: Moon,    timeTone: 'text-indigo-500' } :
        hour < 12 ? { greeting: 'Good morning', TimeIcon: Sunrise, timeTone: 'text-amber-500' } :
        hour < 17 ? { greeting: 'Good afternoon', TimeIcon: Sun,   timeTone: 'text-amber-500' } :
        hour < 20 ? { greeting: 'Good evening', TimeIcon: Sunset,  timeTone: 'text-orange-500' } :
                    { greeting: 'Good evening', TimeIcon: Moon,    timeTone: 'text-indigo-500' };

    const fullDate = new Date().toLocaleDateString('en-MY', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });

    const {
        stats,
        monthOverMonth,
        registrationTrend,
        revenueTrend,
        registrationStatusBreakdown,
        recentRegistrations,
        recentEvents,
        analyticsSnapshot,
    } = props;

    // Date range badge — the 30-day window the controller is querying
    const now = new Date();
    const rangeStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const rangeLabel = `${shortDate(rangeStart.toISOString())} – ${shortDate(now.toISOString())}, ${now.getFullYear()}`;

    // ── Chart datasets ────────────────────────────────────────────────
    const trendData = (registrationTrend as TrendPoint[]).map((p, i) => ({
        date: shortDate(p.date),
        Registrations: p.count,
        Revenue: Number((revenueTrend as RevenuePoint[])[i]?.amount ?? 0),
    }));
    const trendHasActivity = trendData.some(p => p.Registrations > 0 || p.Revenue > 0);
    const trendTickInterval = trendData.length > 12 ? Math.ceil(trendData.length / 6) - 1 : 0;

    const statusData = (registrationStatusBreakdown as StatusBreakdown[]).map(s => ({
        name: STATUS_META[s.status]?.label ?? s.status,
        value: s.count,
        color: STATUS_META[s.status]?.color ?? ACCENT.slate,
    }));
    const totalRegs = statusData.reduce((sum, s) => sum + s.value, 0);
    const confirmedCount = statusData.find(s => s.name === 'Confirmed')?.value ?? 0;

    // Top events by registrations — mimics the "Monthly Earning" bar layout
    const topEventsData = (recentEvents as (Event & { registrations_count?: number })[])
        .slice()
        .sort((a, b) => (b.registrations_count ?? 0) - (a.registrations_count ?? 0))
        .slice(0, 5)
        .map(e => ({
            name: e.title ?? 'Untitled',
            registrations: e.registrations_count ?? 0,
        }));

    // Best-performing day in the current 30-day window — used by Period Highlights.
    const peakDay = trendData.reduce<{ date: string; count: number } | null>((best, p) => {
        if (p.Registrations === 0) return best;
        if (!best || p.Registrations > best.count) return { date: p.date, count: p.Registrations };
        return best;
    }, null);

    const upcomingEvents = (recentEvents as (Event & { registrations_count?: number })[])
        .filter(e => e.status === 'upcoming')
        .slice(0, 5);

    // ── Analytics + Activity tab data ─────────────────────────────────
    const visitorsChartData = (analyticsSnapshot.daily_visitors as { date: string; sessions: number }[]).map(v => ({
        date: shortDate(v.date),
        Visitors: v.sessions,
    }));

    const filteredRegistrations = (recentRegistrations as RecentRegistration[]).filter(r =>
        activityFilter === 'all' ? true : r.status === activityFilter
    );

    // ── Render ────────────────────────────────────────────────────────
    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* ── Hero — dark gradient banner (original vibe) ────── */}
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#001830] via-[#003366] to-[#006e88] shadow-lg">
                    {/* Decorative dots */}
                    <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{
                        backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
                        backgroundSize: '20px 20px',
                    }} />
                    {/* Right-side glow */}
                    <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-white/[0.06] via-white/[0.02] to-transparent pointer-events-none" />

                    <div className="relative px-5 py-6 sm:px-8 sm:py-7">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                            {/* Left — Avatar + Identity */}
                            <div className="flex items-center gap-4 min-w-0">
                                <div className="relative flex-shrink-0">
                                    <div
                                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-2xl font-extrabold shadow-xl text-white"
                                        style={{
                                            background: 'linear-gradient(135deg, rgba(255,255,255,0.22), rgba(255,255,255,0.06))',
                                            border: '2px solid rgba(255,255,255,0.25)',
                                        }}
                                    >
                                        {firstName.charAt(0).toUpperCase()}
                                    </div>
                                    {/* Online pulse */}
                                    <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-400 border-[3px] border-[#003366]">
                                        <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-70" />
                                    </span>
                                </div>

                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                                            {greeting}, {firstName}
                                        </h1>
                                        {roleLabel && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase"
                                                style={{
                                                    background: 'rgba(255,255,255,0.14)',
                                                    color: 'rgba(200,244,249,0.95)',
                                                    border: '1px solid rgba(255,255,255,0.18)',
                                                }}>
                                                <Sparkles className="w-3 h-3" />
                                                {roleLabel}
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-1.5 flex items-center gap-2 text-sm" style={{ color: 'rgba(200,244,249,0.9)' }}>
                                        <TimeIcon className={cn('w-4 h-4 flex-shrink-0', timeTone)} />
                                        <span>
                                            {upcomingEvents.length > 0
                                                ? `You have ${upcomingEvents.length} upcoming event${upcomingEvents.length > 1 ? 's' : ''} to manage`
                                                : 'No upcoming events scheduled'}
                                            {' · '}
                                            <span className="font-semibold text-white">{stats.registrations.total}</span> registrations
                                        </span>
                                    </div>
                                    <p className="text-xs mt-1" style={{ color: 'rgba(200,244,249,0.55)' }}>
                                        {fullDate}
                                    </p>
                                </div>
                            </div>

                            {/* Right — Primary action buttons */}
                            <div className="flex items-center gap-2 flex-wrap sm:justify-end flex-shrink-0 w-full sm:w-auto sm:ml-auto">
                                    <Link
                                        href="/admin/events/create"
                                        className="inline-flex items-center gap-2 rounded-lg bg-white hover:bg-white/90 text-brand-navy px-4 h-9 text-sm font-semibold shadow-sm transition-all hover:shadow-md"
                                    >
                                        <PlusCircle className="w-4 h-4" />
                                        New Event
                                    </Link>
                                    <Link
                                        href="/admin/posts/create"
                                        className="inline-flex items-center gap-2 rounded-lg text-white hover:bg-white/10 px-3.5 h-9 text-sm font-medium transition"
                                        style={{ border: '1px solid rgba(255,255,255,0.22)' }}
                                    >
                                        <PenSquare className="w-4 h-4" />
                                        New Post
                                    </Link>
                                    <a
                                        href="/"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg text-white/85 hover:text-white hover:bg-white/10 transition text-sm font-medium"
                                        style={{ border: '1px solid rgba(255,255,255,0.20)' }}
                                    >
                                        <Globe className="w-4 h-4" />
                                        View Site
                                    </a>
                            </div>
                        </div>
                    </div>

                    {/* Bottom shimmer line */}
                    <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)' }} />
                </div>

                {/* ── Tab bar (colorful, original vibe) ──────────────── */}
                <div className="flex items-center gap-1 p-1.5 rounded-xl w-full bg-muted/60 border border-border">
                    <button
                        onClick={() => setTab('overview')}
                        className={cn(
                            'flex-1 inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors',
                            tab === 'overview'
                                ? 'bg-brand/10 text-brand-navy dark:text-brand-light shadow-sm'
                                : 'text-muted-foreground hover:text-foreground hover:bg-card/60',
                        )}
                    >
                        <LayoutDashboard className={cn('w-4 h-4', tab === 'overview' ? 'text-brand' : 'text-muted-foreground')} />
                        Overview
                    </button>
                    <button
                        onClick={() => setTab('analytics')}
                        className={cn(
                            'flex-1 inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors',
                            tab === 'analytics'
                                ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 shadow-sm'
                                : 'text-muted-foreground hover:text-foreground hover:bg-card/60',
                        )}
                    >
                        <TrendingUp className={cn('w-4 h-4', tab === 'analytics' ? 'text-indigo-600 dark:text-indigo-400' : 'text-muted-foreground')} />
                        Analytics
                    </button>
                    <button
                        onClick={() => setTab('activity')}
                        className={cn(
                            'flex-1 inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors',
                            tab === 'activity'
                                ? 'bg-slate-500/10 text-slate-700 dark:text-slate-300 shadow-sm'
                                : 'text-muted-foreground hover:text-foreground hover:bg-card/60',
                        )}
                    >
                        <Activity className={cn('w-4 h-4', tab === 'activity' ? 'text-slate-600 dark:text-slate-400' : 'text-muted-foreground')} />
                        Activity
                    </button>
                </div>

                {/* ══════════════════ TAB 1 — OVERVIEW ══════════════════ */}
                {tab === 'overview' && (<>

                {/* ── Row 1 — 4 KPI cards ────────────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard
                        label="Total Revenue"
                        total={`RM ${formatCurrency(stats.registrations.revenue)}`}
                        comparison={monthOverMonth.revenue}
                        pctBaselineMin={500}
                        formatValue={(n) => `RM ${formatCurrency(n)}`}
                        accent="from-amber-500 via-amber-400 to-amber-300"
                    />
                    <KpiCard
                        label="Registrations"
                        total={formatCompact(stats.registrations.total)}
                        comparison={monthOverMonth.registrations}
                        pctBaselineMin={10}
                        accent="from-brand-navy-dark via-brand-navy to-brand"
                    />
                    <KpiCard
                        label="Events"
                        total={formatCompact(stats.events.total)}
                        comparison={monthOverMonth.events}
                        pctBaselineMin={5}
                        accent="from-brand via-brand to-brand-light"
                    />
                    <Card accent="from-emerald-500 via-emerald-400 to-emerald-300">
                        <div className="flex items-start justify-between gap-2 mb-3">
                            <p className="text-sm font-medium text-muted-foreground">Active Now</p>
                            {analyticsSnapshot.today_visits > 0 && (
                                <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold rounded-full px-1.5 py-0.5 text-muted-foreground bg-muted flex-shrink-0">
                                    {analyticsSnapshot.today_visits} today
                                </span>
                            )}
                        </div>
                        <p className={cn(
                            'text-3xl font-bold tabular-nums tracking-tight',
                            analyticsSnapshot.active_visitors > 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-foreground',
                        )}>
                            {formatCompact(analyticsSnapshot.active_visitors)}
                        </p>
                    </Card>
                </div>

                {/* ── Row 2 — Donut · Bars · List ────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Registration Status donut with center label */}
                    <Card accent="from-indigo-600 via-indigo-500 to-indigo-400">
                        <CardHeader
                            title="Registration Status"
                            subtitle="Live breakdown across all events"
                        />
                        {statusData.length === 0 ? (
                            <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">
                                No registrations yet
                            </div>
                        ) : (
                            <>
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie
                                            data={statusData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={62}
                                            outerRadius={92}
                                            paddingAngle={2}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {statusData.map((entry, i) => (
                                                <Cell key={i} fill={entry.color} />
                                            ))}
                                            <Label
                                                position="center"
                                                content={(props: any) => {
                                                    const vb = props?.viewBox as { cx?: number; cy?: number } | undefined;
                                                    if (!vb || vb.cx === undefined || vb.cy === undefined) return <></>;
                                                    return (
                                                        <g>
                                                            <text
                                                                x={vb.cx}
                                                                y={vb.cy - 6}
                                                                textAnchor="middle"
                                                                style={{ fill: 'hsl(var(--foreground))', fontSize: 26, fontWeight: 700 }}
                                                            >
                                                                {totalRegs}
                                                            </text>
                                                            <text
                                                                x={vb.cx}
                                                                y={vb.cy + 14}
                                                                textAnchor="middle"
                                                                style={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                                                            >
                                                                Registrations
                                                            </text>
                                                        </g>
                                                    );
                                                }}
                                            />
                                        </Pie>
                                        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="mt-3 space-y-2">
                                    {statusData.map(s => (
                                        <div key={s.name} className="flex items-center gap-2 text-sm">
                                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                                            <span className="text-muted-foreground flex-1">{s.name}</span>
                                            <span className="font-medium tabular-nums text-foreground">{s.value}</span>
                                            <span className="text-xs text-muted-foreground w-10 text-right tabular-nums">
                                                {totalRegs > 0 ? `${Math.round((s.value / totalRegs) * 100)}%` : '—'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </Card>

                    {/* Top Events — horizontal bar chart like "Monthly Earning" */}
                    <Card accent="from-brand-navy via-brand to-brand-light">
                        <CardHeader
                            title="Top Events"
                            subtitle="Registrations per event"
                            action={
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                    <TrendingUp className="w-3 h-3" />
                                    Live
                                </span>
                            }
                        />
                        {topEventsData.length === 0 ? (
                            <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">
                                No events yet
                            </div>
                        ) : (
                            <div className="space-y-3.5">
                                {topEventsData.map((e) => {
                                    const max = Math.max(1, ...topEventsData.map(x => x.registrations));
                                    const pct = (e.registrations / max) * 100;
                                    return (
                                        <div key={e.name}>
                                            <div className="flex items-center justify-between gap-2 mb-1.5">
                                                <p className="text-sm text-foreground truncate">{e.name}</p>
                                                <span className="text-sm font-semibold tabular-nums text-foreground flex-shrink-0">
                                                    {e.registrations}
                                                </span>
                                            </div>
                                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                                                <div
                                                    className="h-full bg-foreground rounded-full transition-all"
                                                    style={{ width: `${Math.max(pct, 2)}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Card>

                    {/* Status Breakdown — tabular counterpart to the donut */}
                    <Card accent="from-emerald-500 via-emerald-400 to-teal-400">
                        <CardHeader
                            title="Status Breakdown"
                            subtitle={totalRegs > 0 ? `${totalRegs} across all events` : 'No registrations yet'}
                            action={
                                <Link href="/admin/registrations" className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
                                    View all <ArrowUpRight className="w-3 h-3" />
                                </Link>
                            }
                        />
                        <div className="space-y-4">
                            {(() => {
                                const cancelledCount = statusData.find(s => s.name === 'Cancelled')?.value ?? 0;
                                const pct = (n: number) => totalRegs > 0 ? `${Math.round((n / totalRegs) * 100)}% of total` : '0% of total';
                                return (
                                    <>
                                        <QuickStat
                                            icon={UserCheck}
                                            iconBg="bg-emerald-500/10"
                                            iconColor="text-emerald-600 dark:text-emerald-400"
                                            label="Confirmed"
                                            value={String(confirmedCount)}
                                            sub={pct(confirmedCount)}
                                        />
                                        <QuickStat
                                            icon={Clock}
                                            iconBg="bg-amber-500/10"
                                            iconColor="text-amber-600 dark:text-amber-400"
                                            label="Pending"
                                            value={String(stats.registrations.pending)}
                                            sub={pct(stats.registrations.pending)}
                                        />
                                        <QuickStat
                                            icon={ShoppingCart}
                                            iconBg="bg-sky-500/10"
                                            iconColor="text-sky-600 dark:text-sky-400"
                                            label="Awaiting Payment"
                                            value={String(stats.registrations.awaiting_payment)}
                                            sub={pct(stats.registrations.awaiting_payment)}
                                        />
                                        <QuickStat
                                            icon={XCircle}
                                            iconBg="bg-rose-500/10"
                                            iconColor="text-rose-600 dark:text-rose-400"
                                            label="Cancelled"
                                            value={String(cancelledCount)}
                                            sub={pct(cancelledCount)}
                                        />
                                    </>
                                );
                            })()}
                        </div>
                    </Card>
                </div>

                {/* ── Row 3 — Trend chart + weekly bars ──────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Sales Report style — dual line */}
                    <Card className="lg:col-span-2" accent="from-brand-navy via-brand to-amber-400">
                        <CardHeader
                            title="Activity Report"
                            subtitle="Registrations vs revenue, last 30 days"
                            action={
                                <div className="flex items-center gap-3">
                                    <LegendDot color={ACCENT.teal} label="Registrations" />
                                    <LegendDot color={ACCENT.amber} label="Revenue (RM)" dashed />
                                </div>
                            }
                        />
                        {!trendHasActivity ? (
                            <div className="flex items-center justify-center h-[280px] text-sm text-muted-foreground">
                                No activity in the last 30 days
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={280}>
                                <ComposedChart data={trendData} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
                                    <defs>
                                        <linearGradient id="v2-reg" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={ACCENT.teal} stopOpacity={0.25} />
                                            <stop offset="100%" stopColor={ACCENT.teal} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis dataKey="date" interval={trendTickInterval} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                                    <YAxis yAxisId="left" allowDecimals={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}`} />
                                    <Tooltip
                                        contentStyle={CHART_TOOLTIP_STYLE}
                                        formatter={(value, name) => {
                                            const v = Number(value ?? 0);
                                            return String(name) === 'Revenue'
                                                ? [`RM ${formatCurrency(v)}`, 'Revenue']
                                                : [String(v), 'Registrations'];
                                        }}
                                    />
                                    {/* Registrations — filled area, primary series */}
                                    <Area yAxisId="left" type="monotone" dataKey="Registrations" stroke={ACCENT.teal} strokeWidth={2.5} fill="url(#v2-reg)" dot={false} activeDot={{ r: 4, fill: ACCENT.teal, strokeWidth: 0 }} />
                                    {/* Revenue — dashed line only, so it stays visible when it traces the same path as registrations */}
                                    <Line yAxisId="right" type="monotone" dataKey="Revenue" stroke={ACCENT.amber} strokeWidth={2.5} strokeDasharray="5 4" dot={false} activeDot={{ r: 4, fill: ACCENT.amber, strokeWidth: 0 }} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        )}
                    </Card>

                    {/* Period Highlights — always populated when there's any activity */}
                    <Card accent="from-rose-500 via-amber-400 to-emerald-400">
                        <CardHeader
                            title="Period Highlights"
                            subtitle="Notable stats · last 30 days"
                        />
                        <div className="space-y-4">
                            <HighlightRow
                                icon={Flame}
                                tone="rose"
                                label="Best day"
                                value={peakDay ? peakDay.date : '—'}
                                sub={peakDay ? `${peakDay.count} registration${peakDay.count === 1 ? '' : 's'}` : 'No activity yet'}
                            />
                            <HighlightRow
                                icon={Award}
                                tone="amber"
                                label="Top event"
                                value={topEventsData[0]?.name ?? '—'}
                                sub={topEventsData[0] ? `${topEventsData[0].registrations} registration${topEventsData[0].registrations === 1 ? '' : 's'}` : 'No events yet'}
                                truncate
                            />
                            <HighlightRow
                                icon={Target}
                                tone="emerald"
                                label="Confirmation rate"
                                value={totalRegs > 0 ? `${Math.round((confirmedCount / totalRegs) * 100)}%` : '—'}
                                sub={totalRegs > 0 ? `${confirmedCount} of ${totalRegs} confirmed` : 'No registrations yet'}
                            />
                            <HighlightRow
                                icon={DollarSign}
                                tone="teal"
                                label="Revenue this period"
                                value={`RM ${formatCurrency(monthOverMonth.revenue.current)}`}
                                sub={
                                    monthOverMonth.revenue.delta === 0
                                        ? 'Same as prior period'
                                        : `${monthOverMonth.revenue.delta > 0 ? '+' : '−'}RM ${formatCurrency(Math.abs(monthOverMonth.revenue.delta))} vs prior period`
                                }
                            />
                        </div>
                    </Card>
                </div>

                {/* ── Row 4 — Upcoming Events (visual, with thumbnails) ─── */}
                <div className="space-y-3">
                    <div className="flex items-end justify-between">
                        <div>
                            <h2 className="text-base font-semibold text-foreground">Upcoming Events</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {upcomingEvents.length} scheduled · click a card to edit
                            </p>
                        </div>
                        <Link href="/admin/events" className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
                            View all <ArrowUpRight className="w-3 h-3" />
                        </Link>
                    </div>
                    {upcomingEvents.length === 0 ? (
                        <Card className="text-center py-10">
                            <CalendarDays className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">No upcoming events</p>
                            <Link href="/admin/events/create" className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-foreground hover:underline">
                                <PlusCircle className="w-3.5 h-3.5" /> Create your first event
                            </Link>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {upcomingEvents.map(e => <FlatEventCard key={e.id} event={e} />)}
                        </div>
                    )}
                </div>

                {/* ── Row 5 — Recent Registrations (full width) ──────── */}
                <Card accent="from-brand-navy via-brand to-brand-light">
                    <CardHeader
                        title="Recent Registrations"
                        subtitle="Newest first · across all events"
                        action={
                            <Link href="/admin/registrations" className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
                                View all <ArrowUpRight className="w-3 h-3" />
                            </Link>
                        }
                    />
                    {recentRegistrations.length === 0 ? (
                        <div className="text-center py-10 text-sm text-muted-foreground">
                            No registrations yet
                        </div>
                    ) : (
                        <div className="divide-y divide-border/60">
                            {(recentRegistrations as RecentRegistration[]).slice(0, 6).map(r => {
                                const statusMeta = STATUS_META[r.status] ?? { color: ACCENT.slate, label: r.status };
                                return (
                                    <div key={r.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                                        <div
                                            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold text-white"
                                            style={{ backgroundColor: statusMeta.color }}
                                        >
                                            {initials(r.name)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">{r.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {r.event?.title ?? 'Event deleted'}
                                            </p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-sm font-semibold tabular-nums text-foreground">
                                                RM {formatCurrency(Number(r.total_amount ?? 0))}
                                            </p>
                                            <p className="text-[10px] uppercase tracking-wider font-medium mt-0.5" style={{ color: statusMeta.color }}>
                                                {statusMeta.label}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Card>

                </> )}

                {/* ── TAB 2 — ANALYTICS ────────────────────────────── */}
                {tab === 'analytics' && (<>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Card accent="from-indigo-500 via-indigo-400 to-indigo-300">
                            <div className="flex items-start justify-between gap-2 mb-3">
                                <p className="text-sm font-medium text-muted-foreground">Today's Visitors</p>
                            </div>
                            <p className="text-3xl font-bold tabular-nums tracking-tight text-foreground">
                                {formatCompact(analyticsSnapshot.today_visits)}
                            </p>
                        </Card>
                        <Card accent="from-slate-500 via-slate-400 to-slate-300">
                            <div className="flex items-start justify-between gap-2 mb-3">
                                <p className="text-sm font-medium text-muted-foreground">Today's Page Views</p>
                            </div>
                            <p className="text-3xl font-bold tabular-nums tracking-tight text-foreground">
                                {formatCompact(analyticsSnapshot.today_page_views)}
                            </p>
                        </Card>
                        <Card accent="from-emerald-500 via-emerald-400 to-emerald-300">
                            <div className="flex items-start justify-between gap-2 mb-3">
                                <p className="text-sm font-medium text-muted-foreground">Active Now</p>
                            </div>
                            <p className={cn(
                                'text-3xl font-bold tabular-nums tracking-tight',
                                analyticsSnapshot.active_visitors > 0
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-foreground',
                            )}>
                                {String(analyticsSnapshot.active_visitors)}
                            </p>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <Card className="lg:col-span-2" accent="from-indigo-600 via-indigo-500 to-indigo-400">
                            <CardHeader
                                title="Daily Visitors"
                                subtitle="Last 7 days"
                            />
                            {visitorsChartData.length === 0 ? (
                                <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">
                                    No visitor data yet
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={260}>
                                    <AreaChart data={visitorsChartData} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
                                        <defs>
                                            <linearGradient id="v2-analytics" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.2} />
                                                <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                                        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                                        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                                        <Area type="monotone" dataKey="Visitors" stroke="#6366f1" strokeWidth={2.5} fill="url(#v2-analytics)" dot={false} activeDot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </Card>

                        <Card accent="from-violet-500 via-violet-400 to-violet-300">
                            <CardHeader
                                title="Top Pages Today"
                                subtitle="By page views"
                            />
                            {analyticsSnapshot.top_pages.length === 0 ? (
                                <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">
                                    No page view data yet
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {analyticsSnapshot.top_pages.map((p, i) => {
                                        const maxViews = analyticsSnapshot.top_pages[0]?.views ?? 1;
                                        return (
                                            <div key={p.url} className="flex items-center gap-3">
                                                <span className="text-xs font-bold text-muted-foreground w-5 tabular-nums">{i + 1}</span>
                                                <span className="flex-1 text-sm text-foreground truncate">{p.url}</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-24 sm:w-32 h-2 rounded-full bg-muted overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full bg-foreground transition-all"
                                                            style={{ width: `${Math.min((p.views / maxViews) * 100, 100)}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-medium text-muted-foreground tabular-nums w-8 text-right">{p.views}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </Card>
                    </div>

                    <a
                        href="/admin/analytics"
                        className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:underline"
                    >
                        <BarChart3 className="w-4 h-4" />
                        Open full analytics
                        <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                </> )}

                {/* ── TAB 3 — ACTIVITY ──────────────────────────────── */}
                {tab === 'activity' && (<>
                    <div className="flex items-center gap-2 mb-4">
                        {['all', 'confirmed', 'pending', 'awaiting_payment', 'attended', 'cancelled', 'waitlisted'].map(status => (
                            <button
                                key={status}
                                onClick={() => setActivityFilter(status)}
                                className={cn(
                                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                                    activityFilter === status
                                        ? 'bg-foreground text-background'
                                        : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80',
                                )}
                            >
                                {status === 'all' ? 'All' : STATUS_META[status]?.label ?? status.replace('_', ' ')}
                            </button>
                        ))}
                    </div>

                    <Card accent="from-slate-500 via-slate-400 to-slate-300">
                        {filteredRegistrations.length === 0 ? (
                            <div className="text-center py-10 text-sm text-muted-foreground">
                                No registrations matching this filter
                            </div>
                        ) : (
                            <div className="divide-y divide-border/60">
                                {filteredRegistrations.map(r => {
                                    const statusMeta = STATUS_META[r.status] ?? { color: ACCENT.slate, label: r.status };
                                    return (
                                        <div key={r.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                                            <div
                                                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold text-white"
                                                style={{ backgroundColor: statusMeta.color }}
                                            >
                                                {initials(r.name)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-foreground truncate">{r.name}</p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {r.event?.title ?? 'Event deleted'}
                                                </p>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className="text-sm font-semibold tabular-nums text-foreground">
                                                    RM {formatCurrency(Number(r.total_amount ?? 0))}
                                                </p>
                                                <p className="text-[10px] uppercase tracking-wider font-medium mt-0.5" style={{ color: statusMeta.color }}>
                                                    {statusMeta.label}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Card>
                </> )}

                {/* ── Footer note ────────────────────────────────────── */}
                <div className="pt-4 pb-2 text-center text-xs text-muted-foreground border-t border-border/60">
                    Takaful4All Admin Dashboard
                </div>
            </div>
        </AdminLayout>
    );
}

// ── Tiny helpers used above ────────────────────────────────────────────
function LegendDot({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
    return (
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            {dashed ? (
                <span className="inline-flex items-center gap-0.5">
                    <span className="w-1.5 h-[2px] rounded-sm" style={{ backgroundColor: color }} />
                    <span className="w-1.5 h-[2px] rounded-sm" style={{ backgroundColor: color }} />
                </span>
            ) : (
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            )}
            {label}
        </span>
    );
}

function FlatEventCard({ event }: { event: Event & { registrations_count?: number } }) {
    const cap = event.max_attendees ?? 0;
    const registered = event.registrations_count ?? 0;
    const pct = cap > 0 ? Math.min((registered / cap) * 100, 100) : 0;
    const isFillingFast = cap > 0 && pct >= 80;

    const date = event.start_at
        ? new Date(event.start_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })
        : '—';

    const cat = event.event_category ? CATEGORY_META[event.event_category] : null;
    const CatIcon = cat?.icon;

    return (
        <Link
            href={`/admin/events/${event.slug}/edit`}
            className="group rounded-xl border border-border bg-card overflow-hidden hover:border-foreground/30 hover:shadow-sm transition-all"
        >
            <div className="relative h-32 bg-gradient-to-br from-brand-navy/80 via-brand/70 to-brand-light/60 overflow-hidden">
                {event.media?.url ? (
                    <img
                        src={event.media.url}
                        alt={event.title}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                ) : CatIcon ? (
                    <CatIcon className="absolute inset-0 m-auto w-10 h-10 text-white/30" strokeWidth={1.5} />
                ) : null}
                {/* Bottom-gradient for badge legibility over any image */}
                <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/45 to-transparent pointer-events-none" />

                <div className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-md bg-background/90 dark:bg-card/90 px-2 py-1 text-[11px] font-semibold text-foreground shadow-sm backdrop-blur-sm">
                    <CalendarDays className="w-3 h-3" />
                    {date}
                </div>

                {isFillingFast && (
                    <div className="absolute top-2 right-2 inline-flex items-center rounded-md bg-amber-500 text-white px-2 py-1 text-[10px] font-bold shadow-sm">
                        {pct >= 95 ? 'Almost full' : 'Filling fast'}
                    </div>
                )}

                {cat && (
                    <div className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-md bg-background/90 dark:bg-card/90 px-1.5 py-0.5 text-[10px] font-medium text-foreground backdrop-blur-sm">
                        {cat.label}
                    </div>
                )}
            </div>

            <div className="p-3.5">
                <h4 className="text-sm font-semibold text-foreground line-clamp-2 leading-snug min-h-[2.5rem] group-hover:text-foreground/80 transition-colors">
                    {event.title}
                </h4>
                {event.city && (
                    <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{event.city}</span>
                    </div>
                )}
                {cap > 0 ? (
                    <div className="mt-3">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="text-muted-foreground">
                                <Users className="w-3 h-3 inline mr-1" />
                                {registered} / {cap}
                            </span>
                            <span className="font-semibold text-foreground tabular-nums">{pct.toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                                className={cn(
                                    'h-full rounded-full transition-all',
                                    pct >= 95 ? 'bg-rose-500' : pct >= 80 ? 'bg-amber-500' : 'bg-foreground',
                                )}
                                style={{ width: `${Math.max(pct, 2)}%` }}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="mt-3 text-[11px] text-muted-foreground">
                        <Users className="w-3 h-3 inline mr-1" />
                        {registered} registered
                    </div>
                )}
            </div>
        </Link>
    );
}

/**
 * Static tone map — using literal class strings ensures Tailwind's JIT compiler
 * picks them up (dynamic composed strings passed as props sometimes get purged).
 */
const HIGHLIGHT_TONE: Record<'rose' | 'amber' | 'emerald' | 'teal', string> = {
    rose:    'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    amber:   'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    teal:    'bg-teal-500/10 text-teal-600 dark:text-teal-400',
};

function HighlightRow({
    icon: Icon, tone, label, value, sub, truncate,
}: {
    icon: React.ComponentType<{ className?: string }>;
    tone: keyof typeof HIGHLIGHT_TONE;
    label: string;
    value: string;
    sub: string;
    truncate?: boolean;
}) {
    return (
        <div className="flex items-start gap-3">
            <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', HIGHLIGHT_TONE[tone])}>
                <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground font-medium">{label}</p>
                <p className={cn('text-sm font-semibold text-foreground mt-0.5', truncate && 'truncate')}>
                    {value}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
            </div>
        </div>
    );
}

function QuickStat({
    icon: Icon, iconBg, iconColor, label, value, sub,
}: {
    icon: React.ComponentType<{ className?: string }>;
    iconBg: string;
    iconColor: string;
    label: string;
    value: string;
    sub: string;
}) {
    return (
        <div className="flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', iconBg)}>
                <Icon className={cn('w-5 h-5', iconColor)} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{label}</p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{sub}</p>
            </div>
            <p className="text-lg font-bold tabular-nums text-foreground flex-shrink-0">{value}</p>
        </div>
    );
}
