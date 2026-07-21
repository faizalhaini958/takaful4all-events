import { type PropsWithChildren } from 'react';
import { cn } from '@/lib/utils';

interface Props extends PropsWithChildren {
    title: string;
    className?: string;
    gradientClass?: string;
}

export default function ChartCard({ title, children, className, gradientClass }: Props) {
    return (
        <div className={cn(
            'relative rounded-xl border border-border bg-gradient-to-br from-card to-brand/[0.03] shadow-sm overflow-hidden',
            className,
        )}>
            {/* Gradient top accent stripe */}
            <div className={cn(
                'absolute top-0 left-0 right-0 h-[3px]',
                gradientClass ?? 'bg-gradient-to-r from-brand-navy via-brand to-brand-light',
            )} />

            <div className="px-4 sm:px-5 py-3 border-b border-border/60 pt-4">
                <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            </div>
            <div className="p-4 sm:p-5">
                {children}
            </div>
        </div>
    );
}
