import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
    TrendingUp, TrendingDown, Users, Eye, Globe,
    Monitor, ExternalLink, RefreshCw, Activity, BarChart2, Tag, HelpCircle,
} from 'lucide-react';

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface Overview {
    total_sessions: number;
    total_views: number;
    sessions_change_pct: number | null;
    views_change_pct: number | null;
}

interface VisitorPoint { date: string; sessions: number }
interface TopPage      { url: string; route_name: string; views: number }
interface DeviceRow    { device_type: string; sessions: number }
interface BrowserRow   { browser: string; sessions: number }
interface ReferrerRow  { referrer_domain: string; sessions: number }
interface UtmRow       { utm_source: string; utm_medium: string | null; utm_campaign: string | null; sessions: number }
interface TopEvent     { url: string; views: number; unique_visitors: number }

interface RealtimeData {
    active_sessions: number;
    active_pages: { url: string; visitors: number }[];
}

interface Props {
    days: number;
    overview: Overview;
    topPages: TopPage[];
    deviceBreakdown: DeviceRow[];
    browserBreakdown: BrowserRow[];
    topReferrers: ReferrerRow[];
    utmSummary: UtmRow[];
    visitorsOverTime: VisitorPoint[];
    topEvents: TopEvent[];
}

// â”€â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const DEVICE_COLORS: Record<string, string> = {
    mobile:  '#6366f1',
    tablet:  '#f59e0b',
    desktop: '#10b981',
};

const PIE_PALETTE = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#06b6d4'];

const TT_STYLE = {
    background: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: 10,
    fontSize: 12,
    boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
};

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function fmt(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
}

function shortDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-MY', { month: 'short', day: 'numeric' });
}

function slugFromUrl(url: string): string {
    const m = url.match(/\/events\/([^/?#]+)/);
    return m ? m[1] : (url.replace(/^https?:\/\/[^/]+/, '') || '/');
}
function slugToTitle(slug: string): string {
    return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
function trunc(str: string, max: number): string {
    return str.length > max ? str.slice(0, max - 1) + '\u2026' : str;
}

function pathFromUrl(url: string): string {
    return url.replace(/^https?:\/\/[^/]+/, '') || '/';
}

function friendlyPageName(url: string): string {
    const path = (url.replace(/^https?:\/\/[^/]+/, '').replace(/\?.*$/, '').replace(/\/+$/, '')) || '/';
    if (path === '/') return 'Home Page';
    const parts = path.split('/').filter(Boolean);
    const fmt = (s: string) => s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    if (parts[0] === 'events' && parts[1]) return 'Event: ' + fmt(parts[1]);
    if (parts[0] === 'events') return 'Events Listing';
    if (parts[0] === 'admin' && parts.length === 1) return 'Admin Panel';
    if (parts[0] === 'admin') return 'Admin · ' + parts.slice(1).map(fmt).join(' · ');
    if (parts[0] === 'orders') return parts.length === 1 ? 'Orders' : 'Order Details';
    if (parts[0] === 'register') return 'Registration Page';
    if (parts[0] === 'login') return 'Login Page';
    return parts.map(fmt).join(' / ');
}

// â”€â”€â”€ Main page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function AnalyticsIndex({
    days, overview, topPages, deviceBreakdown, browserBreakdown,
    topReferrers, utmSummary, visitorsOverTime, topEvents,
}: Props) {
    const [realtime, setRealtime]         = useState<RealtimeData | null>(null);
    const [realtimeLoading, setRtLoading] = useState(false);
    const [activeTab, setActiveTab]       = useState<'overview' | 'events' | 'acquisition'>('overview');

    function fetchRealtime() {
        setRtLoading(true);
        axios.get('/admin/analytics/realtime')
            .then(r => setRealtime(r.data))
            .catch(() => {})
            .finally(() => setRtLoading(false));
    }

    useEffect(() => {
        fetchRealtime();
        const id = setInterval(fetchRealtime, 30_000);
        return () => clearInterval(id);
    }, []);

    function setDays(d: number) {
        router.get('/admin/analytics', { days: d }, { preserveState: false });
    }

    const chartData   = visitorsOverTime.map(v => ({ date: shortDate(v.date), Sessions: v.sessions }));
    const deviceData  = deviceBreakdown.map(d => ({
        name:  d.device_type.charAt(0).toUpperCase() + d.device_type.slice(1),
        value: d.sessions,
        color: DEVICE_COLORS[d.device_type] ?? '#94a3b8',
    }));
    const browserData = browserBreakdown.map((b, i) => ({
        name:  b.browser.charAt(0).toUpperCase() + b.browser.slice(1),
        value: b.sessions,
        color: PIE_PALETTE[i % PIE_PALETTE.length],
    }));

    const totalDevice  = deviceData.reduce((s, d) => s + d.value, 0);
    const totalBrowser = browserData.reduce((s, d) => s + d.value, 0);
    const avgPages     = overview.total_sessions > 0
        ? (overview.total_views / overview.total_sessions).toFixed(1) : '0';

    return (
        <AdminLayout>
            <Head title="Analytics" />
            <div className="space-y-6 pb-10">

                {/* â”€â”€ Header â”€â”€ */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Analytics</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">A summary of your visitor data, page views and event performance.</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Live badge */}
                        <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                            </span>
                            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                                {realtime?.active_sessions ?? 0} live
                            </span>
                            <button onClick={fetchRealtime} className="text-emerald-600/60 hover:text-emerald-600 transition-colors">
                                <RefreshCw className={`w-3 h-3 ${realtimeLoading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                        {/* Day range */}
                        <div className="flex rounded-xl border border-border bg-muted/50 p-0.5 gap-0.5 text-sm">
                            {[7, 14, 30, 90].map(d => (
                                <button key={d} onClick={() => setDays(d)}
                                    className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                                        days === d
                                            ? 'bg-background text-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >{d}d</button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* â”€â”€ KPI cards â”€â”€ */}
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                    <KpiCard
                        label="Total Visits"
                        tip="How many times people visited your website in this period. Each visit — even from the same person — counts as one."
                        value={fmt(overview.total_sessions)}
                        change={overview.sessions_change_pct}
                        suffix={`compared to last ${days} days`}
                        icon={<Users className="w-5 h-5" />}
                        accent="indigo"
                    />
                    <KpiCard
                        label="Page Views"
                        tip="Total number of pages opened by all visitors. If one person reads 5 pages, that counts as 5 views."
                        value={fmt(overview.total_views)}
                        change={overview.views_change_pct}
                        suffix={`compared to last ${days} days`}
                        icon={<Eye className="w-5 h-5" />}
                        accent="sky"
                    />
                    <KpiCard
                        label="Pages per Visit"
                        tip="On average, how many pages each visitor browses in one visit. A higher number means people are exploring more of your site."
                        value={avgPages}
                        change={null}
                        suffix="pages on average per visit"
                        icon={<BarChart2 className="w-5 h-5" />}
                        accent="violet"
                    />
                    <KpiCard
                        label="Visitors Now"
                        tip="People who are on your website right now (in the last 5 minutes). This updates automatically every 30 seconds."
                        value={String(realtime?.active_sessions ?? 0)}
                        change={null}
                        suffix="currently browsing your site"
                        icon={<Activity className="w-5 h-5" />}
                        accent="emerald"
                        live
                    />
                </div>

                {/* â”€â”€ Tabs â”€â”€ */}
                <div className="flex gap-0.5 bg-muted/50 border border-border rounded-xl p-1 w-fit">
                    {(['overview', 'events', 'acquisition'] as const).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                activeTab === tab
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            {tab === 'overview' ? 'Overview' : tab === 'events' ? 'Events' : 'Traffic Sources'}
                        </button>
                    ))}
                </div>

                {/* â•â•â•â• OVERVIEW â•â•â•â• */}
                {activeTab === 'overview' && (
                    <div className="space-y-5">

                        {/* Row 1 — Sessions chart + Page Breakdown side by side */}
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

                            {/* Sessions area chart */}
                            <div className="lg:col-span-3 bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
                                <div className="px-5 py-4 border-b border-border/50">
                                    <h3 className="text-sm font-semibold text-foreground">Daily Visitors</h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">How many people visited your site each day over the last {days} days</p>
                                </div>
                                <div className="p-5">
                                    {chartData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={220}>
                                            <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
                                                <defs>
                                                    <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%"   stopColor="#6366f1" stopOpacity={0.2} />
                                                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                                                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                                                <Tooltip contentStyle={TT_STYLE} cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                                <Area type="monotone" dataKey="Sessions" stroke="#6366f1" strokeWidth={2.5} fill="url(#grad1)" dot={false} activeDot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    ) : <ChartEmpty />}
                                </div>
                            </div>

                            {/* Page Breakdown — Socially-style horizontal bars */}
                            <div className="lg:col-span-2 bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
                                <div className="px-5 py-4 border-b border-border/50">
                                    <h3 className="text-sm font-semibold text-foreground">Most Visited Pages</h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">Which pages on your site got the most visits this period</p>
                                </div>
                                {topPages.length > 0 ? (
                                    <div className="p-5 space-y-5">
                                        {topPages.slice(0, 5).map((p, i) => {
                                            const pct = topPages[0]?.views > 0 ? Math.round((p.views / topPages[0].views) * 100) : 0;
                                            const barColors = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'];
                                            return (
                                                <div key={i}>
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <span className="text-sm font-medium text-foreground truncate max-w-[160px]" title={p.url}>
                                                            {friendlyPageName(p.url)}
                                                        </span>
                                                        <span className="text-sm font-bold tabular-nums text-foreground ml-2 shrink-0">{fmt(p.views)}</span>
                                                    </div>
                                                    <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full transition-all duration-700"
                                                            style={{ width: `${pct}%`, background: barColors[i] ?? '#6366f1' }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="p-5 h-48 flex items-center justify-center text-sm text-muted-foreground">No page views yet.</div>
                                )}
                            </div>
                        </div>

                        {/* Row 2 — Device + Browser segmentation bars */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <SegmentCard
                                title="Visitor Devices"
                                subtitle="What type of device your visitors used — phone, tablet, or desktop"
                                icon={<Monitor className="w-4 h-4" />}
                                data={deviceData}
                                total={totalDevice}
                            />
                            <SegmentCard
                                title="Visitor Browsers"
                                subtitle="Which web browser your visitors used to open your site"
                                icon={<Globe className="w-4 h-4" />}
                                data={browserData}
                                total={totalBrowser}
                            />
                        </div>

                        {/* Row 3 — Recent Activities (active pages) */}
                        {realtime && realtime.active_pages.length > 0 && (
                            <div className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
                                <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
                                    <div className="flex items-center gap-2.5">
                                        <span className="relative flex h-2.5 w-2.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                                        </span>
                                        <div>
                                            <h3 className="text-sm font-semibold text-foreground">Recent Activities</h3>
                                            <p className="text-xs text-muted-foreground">Currently active visitor pages</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                                        Live · last 5 min
                                    </span>
                                </div>
                                <div className="divide-y divide-border/40">
                                    {realtime.active_pages.map((p, i) => {
                                        const initial = friendlyPageName(p.url).charAt(0).toUpperCase() || 'H';
                                        const grads = ['from-indigo-400 to-violet-500', 'from-sky-400 to-indigo-500', 'from-emerald-400 to-teal-500', 'from-amber-400 to-orange-500'];
                                        return (
                                            <div key={i} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/20 transition-colors">
                                                <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${grads[i % grads.length]} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                                                    {initial}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-foreground truncate" title={p.url}>{friendlyPageName(p.url)}</p>
                                                    <p className="text-xs text-muted-foreground">{p.visitors} active {p.visitors === 1 ? 'visitor' : 'visitors'}</p>
                                                </div>
                                                <div className="shrink-0 flex items-center gap-1.5">
                                                    <Users className="w-3.5 h-3.5 text-emerald-500" />
                                                    <span className="text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{p.visitors}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* â•â•â•â• EVENTS â•â•â•â• */}
                {activeTab === 'events' && (
                    <div className="space-y-5">
                        {topEvents.length > 0 ? (<>
                            <ChartCard title="Event Popularity">
                                <p className="text-xs text-muted-foreground -mt-2 mb-5">How many times each event page was viewed. <span className="font-semibold text-indigo-600 dark:text-indigo-400">Total Views</span> counts every visit; <span className="font-semibold text-emerald-600 dark:text-emerald-400">Unique Visitors</span> counts each person once.</p>
                                <ResponsiveContainer width="100%" height={Math.max(220, topEvents.length * 56)}>
                                    <BarChart
                                        layout="vertical"
                                        data={topEvents.map(e => {
                                            const full = slugToTitle(slugFromUrl(e.url));
                                            return { name: trunc(full, 26), fullName: full, Views: e.views, Unique: e.unique_visitors };
                                        })}
                                        margin={{ top: 4, right: 48, bottom: 4, left: 4 }}
                                    >
                                        <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                        <YAxis type="category" dataKey="name" width={176} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            contentStyle={TT_STYLE}
                                            labelFormatter={(label: any, payload: readonly any[]) => payload?.[0]?.payload?.fullName ?? label}
                                            formatter={(val: any, key: any) => [val, key === 'Views' ? 'Total Views' : 'Unique Visitors']}
                                        />
                                        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                                        <Bar dataKey="Views"  fill="#6366f1" radius={[0,5,5,0]} maxBarSize={18} />
                                        <Bar dataKey="Unique" fill="#10b981" radius={[0,5,5,0]} maxBarSize={18} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartCard>

                            <RankTable
                                title="Event Pages" columns={['Event', 'Total Views', 'Unique Visitors']} rows={topEvents}
                                renderRow={(e, rank) => (<>
                                    <td className="px-5 py-3.5 flex items-center gap-3">
                                        <RankBadge rank={rank} />
                                        <a href={e.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 truncate max-w-xs">
                                            {slugToTitle(slugFromUrl(e.url))}<ExternalLink className="w-3 h-3 shrink-0 opacity-60" />
                                        </a>
                                    </td>
                                    <td className="px-5 py-3.5 text-right tabular-nums font-semibold text-sm">{fmt(e.views)}</td>
                                    <td className="px-5 py-3.5 text-right tabular-nums text-sm text-muted-foreground">{fmt(e.unique_visitors)}</td>
                                </>)}
                                empty="No event page views yet."
                            />
                        </>) : (
                            <EmptySection icon={<BarChart2 className="w-10 h-10" />} title="No event data yet" body="Event page views will appear here once visitors start browsing events." />
                        )}
                    </div>
                )}

                {/* â•â•â•â• ACQUISITION â•â•â•â• */}
                {activeTab === 'acquisition' && (
                    <div className="space-y-5">

                        {/* Where visitors came from */}
                        <div className="rounded-2xl border border-border bg-card overflow-hidden">
                            <div className="px-5 py-4 border-b border-border/70">
                                <h3 className="text-sm font-semibold text-foreground">Where Visitors Came From</h3>
                                <p className="text-xs text-muted-foreground mt-0.5">Websites or apps that sent people to your site. Visitors who typed your URL directly are not listed here.</p>
                            </div>
                            {topReferrers.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-border/50 bg-muted/30">
                                                <th className="px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-left">Source Website</th>
                                                <th className="px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-right">Visits Sent</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {topReferrers.map((r, i) => (
                                                <tr key={i} className="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
                                                    <td className="px-5 py-3.5 flex items-center gap-3">
                                                        <RankBadge rank={i + 1} />
                                                        <a href={`https://${r.referrer_domain}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                                                            {r.referrer_domain}<ExternalLink className="w-3 h-3 opacity-60" />
                                                        </a>
                                                    </td>
                                                    <td className="px-5 py-3.5 text-right">
                                                        <ViewsBar value={r.sessions} max={topReferrers[0]?.sessions ?? 1} label={fmt(r.sessions)} />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="px-5 py-10 text-center">
                                    <p className="text-sm font-medium text-foreground">No referral traffic yet</p>
                                    <p className="text-xs text-muted-foreground mt-1">Most visitors are arriving directly. Share your site links on social media or other platforms to start seeing traffic sources here.</p>
                                </div>
                            )}
                        </div>

                        {/* Marketing campaigns */}
                        <div className="rounded-2xl border border-border bg-card overflow-hidden">
                            <div className="px-5 py-4 border-b border-border">
                                <div className="flex items-start gap-2">
                                    <Tag className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                                    <div>
                                        <h3 className="text-sm font-semibold text-foreground">Marketing Campaigns</h3>
                                        <p className="text-xs text-muted-foreground mt-0.5">Visits that came through tracked marketing links such as email newsletters, ads, or social media posts.</p>
                                    </div>
                                </div>
                            </div>
                            {utmSummary.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-border bg-muted/30">
                                                {['Channel', 'Type', 'Campaign Name', 'Visits'].map((col, i) => (
                                                    <th key={col} className={`px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ${i === 3 ? 'text-right' : 'text-left'}`}>{col}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {utmSummary.map((u, i) => (
                                                <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                                                    <td className="px-5 py-3.5 font-medium">{u.utm_source}</td>
                                                    <td className="px-5 py-3.5 text-muted-foreground">{u.utm_medium ?? <span className="opacity-40">—</span>}</td>
                                                    <td className="px-5 py-3.5 text-muted-foreground">{u.utm_campaign ?? <span className="opacity-40">—</span>}</td>
                                                    <td className="px-5 py-3.5 text-right tabular-nums font-semibold">{fmt(u.sessions)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="px-5 py-10 text-center">
                                    <p className="text-sm font-medium text-foreground">No marketing campaigns tracked yet</p>
                                    <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">Add <span className="font-mono bg-muted px-1 py-0.5 rounded">?utm_source=email</span> to your links to track which campaigns bring the most visitors.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}


            </div>
        </AdminLayout>
    );
}

// â”€â”€â”€ KPI Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const ACCENT = {
    indigo:  { iconBg: 'bg-indigo-50 dark:bg-indigo-500/15',  iconText: 'text-indigo-600 dark:text-indigo-400',  bar: 'bg-indigo-500'  },
    sky:     { iconBg: 'bg-sky-50 dark:bg-sky-500/15',        iconText: 'text-sky-600 dark:text-sky-400',          bar: 'bg-sky-500'     },
    violet:  { iconBg: 'bg-violet-50 dark:bg-violet-500/15',  iconText: 'text-violet-600 dark:text-violet-400',   bar: 'bg-violet-500'  },
    emerald: { iconBg: 'bg-emerald-50 dark:bg-emerald-500/15',iconText: 'text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500' },
} as const;

function KpiCard({ label, value, change, suffix, icon, accent, live, tip }: {
    label: string; value: string; change: number | null; suffix: string;
    icon: React.ReactNode; accent: keyof typeof ACCENT; live?: boolean; tip?: string;
}) {
    const a = ACCENT[accent];
    return (
        <div className="bg-card rounded-2xl border border-border/60 shadow-sm hover:shadow-md transition-shadow p-5">
            <div className="flex items-start justify-between mb-5">
                <div className={`w-10 h-10 rounded-xl ${a.iconBg} ${a.iconText} flex items-center justify-center ${live ? 'animate-pulse' : ''}`}>
                    {icon}
                </div>
                {change !== null && (
                    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold rounded-full px-2 py-0.5 ${
                        change > 0 ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : change < 0 ? 'bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                        {change > 0 ? <TrendingUp className="w-3 h-3" /> : change < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                        {change > 0 ? '+' : ''}{change}%
                    </span>
                )}
            </div>
            <p className="text-3xl font-bold tabular-nums text-foreground tracking-tight leading-none">{value}</p>
            <div className="flex items-center gap-1.5 mt-2">
                <p className="text-sm font-medium text-foreground">{label}</p>
                {tip && <InfoTip text={tip} />}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{suffix}</p>
            <div className={`mt-4 h-1 ${a.bar} rounded-full opacity-40`} />
        </div>
    );
}

function InfoTip({ text }: { text: string }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        if (!open) return;
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, [open]);

    return (
        <span ref={ref} className="group relative inline-flex shrink-0" onClick={() => setOpen(!open)}>
            <HelpCircle className="w-3.5 h-3.5 text-muted-foreground/40 hover:text-muted-foreground cursor-help transition-colors" />
            <span className={`pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 rounded-xl bg-popover border border-border px-3 py-2.5 text-xs text-popover-foreground shadow-xl transition-opacity duration-150 z-50 leading-relaxed text-left ${open ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                {text}
            </span>
        </span>
    );
}

// â”€â”€â”€ Chart wrapper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border/70">
                <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

// â”€â”€â”€ Donut Chart Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function SegmentCard({ title, subtitle, icon, data, total }: {
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    data: { name: string; value: number; color: string }[];
    total: number;
}) {
    return (
        <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-5">
            <div className="flex items-start justify-between mb-5">
                <div>
                    <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
                </div>
                <span className="text-muted-foreground">{icon}</span>
            </div>
            {data.length > 0 ? (
                <div className="space-y-4">
                    {data.map(d => {
                        const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
                        return (
                            <div key={d.name}>
                                <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                                        <span className="text-sm font-medium text-foreground">{d.name}</span>
                                    </div>
                                    <span className="text-sm font-bold tabular-nums text-foreground">{fmt(d.value)}</span>
                                </div>
                                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-700"
                                        style={{ width: `${pct}%`, background: d.color }}
                                    />
                                </div>
                                <p className="text-[11px] text-muted-foreground text-right mt-1">{pct}%</p>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">No data yet.</div>
            )}
        </div>
    );
}

// â”€â”€â”€ Rank table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function RankTable<T>({ title, columns, rows, renderRow, empty }: {
    title: string; columns: string[]; rows: T[];
    renderRow: (row: T, rank: number) => React.ReactNode; empty: string;
}) {
    return (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border/70">
                <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            </div>
            {rows.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border/50 bg-muted/30">
                                {columns.map((col, i) => (
                                    <th key={col} className={`px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ${i > 0 ? 'text-right' : 'text-left'}`}>{col}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, i) => (
                                <tr key={i} className="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
                                    {renderRow(row, i + 1)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="px-5 py-10 text-center text-sm text-muted-foreground">{empty}</div>
            )}
        </div>
    );
}

function RankBadge({ rank }: { rank: number }) {
    const styles = ['bg-amber-400/20 text-amber-600 dark:text-amber-400','bg-slate-300/20 text-slate-500','bg-orange-300/20 text-orange-500'];
    const cls = rank <= 3 ? styles[rank - 1] : 'bg-muted text-muted-foreground';
    return <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold shrink-0 ${cls}`}>{rank}</span>;
}

function ViewsBar({ value, max, label }: { value: number; max: number; label: string }) {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0;
    return (
        <div className="flex items-center justify-end gap-3">
            <div className="hidden sm:flex w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <span className="tabular-nums font-semibold text-foreground text-sm">{label}</span>
        </div>
    );
}

function ChartEmpty() {
    return (
        <div className="h-[230px] flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <BarChart2 className="w-8 h-8 opacity-25" />
            <p className="text-sm">No data for this period yet.</p>
        </div>
    );
}

function EmptySection({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
    return (
        <div className="rounded-2xl border border-border bg-card px-8 py-16 flex flex-col items-center gap-3 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground/40">{icon}</div>
            <p className="text-base font-semibold text-foreground">{title}</p>
            <p className="text-sm text-muted-foreground max-w-sm">{body}</p>
        </div>
    );
}

