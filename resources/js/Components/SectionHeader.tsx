interface Props {
    title: string;
    subtitle?: string;
    centered?: boolean;
}

export default function SectionHeader({ title, subtitle, centered = false }: Props) {
    return (
        <div className={centered ? 'text-center' : ''}>
            <h2 className="text-2xl sm:text-3xl font-bold text-brand tracking-tight">{title}</h2>
            {subtitle && (
                <p className="mt-2 text-brand-navy/60 max-w-2xl">{subtitle}</p>
            )}
        </div>
    );
}
