import { useEffect, useState } from 'react';
import axios from 'axios';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Eye, Users, MousePointerClick, CheckCircle2, TrendingUp, BarChart2 } from 'lucide-react';

interface EventStats {
    views: number;
    unique_visitors: number;
    register_clicks: number;
    registrations: number;
    conversion_rate: number;
    views_over_time: { date: string; views: number }[];
}

function fmt(n: number): string {
    return n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : String(n);
}

function shortDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('en-MY', { month: 'short', day: 'numeric' });
}

export function EventAnalyticsPanel({ slug }: { slug: string }) {
    const [stats, setStats] = useState<EventStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        axios.get(`/admin/analytics/events/${slug}`)
            .then(res => setStats(res.data))
            .catch(() => setStats(null))
            .finally(() => setLoading(false));
    }, [slug]);

    if (loading) {
        return (
            <div className="rounded-xl border border-border/60 bg-card p-6 animate-pulse">
                <div className="h-4 w-32 bg-muted rounded mb-4" />
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-16 bg-muted rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    if (!stats) return null;

    const chartData = stats.views_over_time.map(v => ({
        date: shortDate(v.date),
        Views: v.views,
    }));

    const METRICS = [
        { label: 'Page Views',       value: fmt(stats.views),            icon: Eye,              iconBg: 'bg-sky-500/10',     iconColor: 'text-sky-600 dark:text-sky-400' },
        { label: 'Unique Visitors',  value: fmt(stats.unique_visitors),  icon: Users,            iconBg: 'bg-primary/10',     iconColor: 'text-primary' },
        { label: 'Register Clicks',  value: fmt(stats.register_clicks),  icon: MousePointerClick,iconBg: 'bg-amber-500/10',   iconColor: 'text-amber-600 dark:text-amber-400' },
        { label: 'Registrations',    value: fmt(stats.registrations),    icon: CheckCircle2,     iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-600 dark:text-emerald-400' },
        { label: 'Conversion Rate',  value: `${stats.conversion_rate}%`, icon: TrendingUp,       iconBg: 'bg-violet-500/10',  iconColor: 'text-violet-600 dark:text-violet-400' },
    ] as const;

    return (
        <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border/60 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">Analytics (last 30 days)</h3>
            </div>

            <div className="p-5 space-y-5">
                {/* Metric cards */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {METRICS.map(m => {
                        const Icon = m.icon;
                        return (
                            <div key={m.label} className="rounded-lg border border-border/60 p-3 bg-background/50">
                                <div className={`w-7 h-7 rounded-md ${m.iconBg} flex items-center justify-center mb-2`}>
                                    <Icon className={`w-3.5 h-3.5 ${m.iconColor}`} />
                                </div>
                                <p className="text-lg font-bold tabular-nums text-foreground leading-none">{m.value}</p>
                                <p className="text-[11px] text-muted-foreground mt-1 leading-tight">{m.label}</p>
                            </div>
                        );
                    })}
                </div>

                {/* Views over time mini-chart */}
                {chartData.length > 1 && (
                    <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Daily views</p>
                        <ResponsiveContainer width="100%" height={120}>
                            <AreaChart data={chartData} margin={{ top: 0, right: 4, bottom: 0, left: -28 }}>
                                <defs>
                                    <linearGradient id="evGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{
                                        background: 'hsl(var(--card))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: 8,
                                        fontSize: 11,
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="Views"
                                    stroke="#3b82f6"
                                    strokeWidth={1.5}
                                    fill="url(#evGrad)"
                                    dot={false}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {stats.views === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                        No views tracked yet. Analytics start collecting once the event page is visited.
                    </p>
                )}
            </div>
        </div>
    );
}
