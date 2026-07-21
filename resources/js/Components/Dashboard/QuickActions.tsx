import { Link } from '@inertiajs/react';
import { PlusCircle, PenSquare, Users, Globe } from 'lucide-react';

export default function QuickActions() {
    const actions = [
        { href: '/admin/events/create', label: 'New Event', icon: PlusCircle },
        { href: '/admin/posts/create',  label: 'New Post',  icon: PenSquare },
        { href: '/admin/registrations', label: 'Registrations', icon: Users },
        { href: '/',                    label: 'View Site', icon: Globe, external: true },
    ];

    return (
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
            {actions.map((action) => {
                const target = action.external ? '_blank' : undefined;
                return (
                    <Link
                        key={action.href}
                        href={action.href}
                        target={target}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground shadow-sm hover:bg-brand hover:text-white hover:border-brand transition-all duration-200 group"
                    >
                        <action.icon className="w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110" />
                        {action.label}
                    </Link>
                );
            })}
        </div>
    );
}
