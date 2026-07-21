import { Link } from '@inertiajs/react';
import { type LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type MetricComparison } from '@/types';

export interface StatTrend {
    comparison: MetricComparison;
    label: string;
    /**
     * When previous is below this, we show absolute delta instead of a
     * percentage. Small baselines make percentages misleading (e.g. 1 → 3 = 200%).
     */
    pctBaselineMin?: number;
    /** Optional formatter for absolute delta display (used for currency). */
    formatDelta?: (n: number) => string;
}

interface Props {
    icon: LucideIcon;
    label: string;
    value: string | number;
    href?: string;
    trend?: StatTrend;
    colorClass?: string;
    gradientClass?: string;
}

function formatDeltaChip(t: StatTrend): { text: string; direction: 'up' | 'down' | 'flat' } {
    const { comparison, pctBaselineMin = 10, formatDelta } = t;
    const { delta, previous, change_pct } = comparison;

    const direction: 'up' | 'down' | 'flat' = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';

    const usePct = change_pct !== null && previous >= pctBaselineMin;

    if (usePct) {
        const sign = change_pct! > 0 ? '+' : change_pct! < 0 ? '' : '';
        return { text: `${sign}${change_pct!.toFixed(1)}%`, direction };
    }

    const sign = delta > 0 ? '+' : delta < 0 ? '−' : '';
    const magnitude = Math.abs(delta);
    const body = formatDelta ? formatDelta(magnitude) : String(magnitude);
    return { text: delta === 0 ? '±0' : `${sign}${body}`, direction };
}

export default function StatCard({ icon: Icon, label, value, href, trend, colorClass, gradientClass }: Props) {
    const chip = trend ? formatDeltaChip(trend) : null;
    // Suppress the chip entirely when there's nothing meaningful to show —
    // no current activity and no prior baseline.
    const showChip = chip !== null && !(trend!.comparison.current === 0 && trend!.comparison.previous === 0);

    const content = (
        <div className={cn(
            'relative rounded-xl border border-border bg-gradient-to-br from-card to-brand/[0.03] p-4 sm:p-5 transition-all hover:shadow-md hover:-translate-y-0.5 overflow-hidden',
            href && 'cursor-pointer hover:border-primary/40',
        )}>
            {/* Gradient top accent stripe */}
            <div className={cn(
                'absolute top-0 left-0 right-0 h-[3px]',
                gradientClass ?? 'bg-gradient-to-r from-brand-navy via-brand to-brand-light',
            )} />

            <div className="flex items-center justify-between mb-3 pt-1">
                <div className={cn('flex items-center justify-center w-10 h-10 rounded-xl', colorClass ?? 'bg-primary/10')}>
                    <Icon className={cn('w-5 h-5', colorClass ? colorClass.replace('bg-', 'text-').replace('/10', '') : 'text-primary')} />
                </div>
                {showChip && chip && (
                    <span className={cn(
                        'inline-flex items-center gap-0.5 text-xs font-semibold rounded-full px-2 py-0.5',
                        chip.direction === 'up'
                            ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                            : chip.direction === 'down'
                                ? 'text-red-600 dark:text-red-400 bg-red-500/10'
                                : 'text-muted-foreground bg-muted',
                    )}>
                        {chip.direction === 'up' && <TrendingUp className="w-3 h-3" />}
                        {chip.direction === 'down' && <TrendingDown className="w-3 h-3" />}
                        {chip.direction === 'flat' && <Minus className="w-3 h-3" />}
                        {chip.text}
                    </span>
                )}
            </div>
            <p className="text-2xl sm:text-3xl font-bold tabular-nums text-foreground">{value}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
            {trend && (
                <p className="text-xs text-muted-foreground mt-2">{trend.label}</p>
            )}
        </div>
    );

    if (href) {
        return <Link href={href} className="group block">{content}</Link>;
    }

    return content;
}
