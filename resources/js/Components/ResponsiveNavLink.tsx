import { InertiaLinkProps, Link } from '@inertiajs/react';

export default function ResponsiveNavLink({
    active = false,
    className = '',
    children,
    ...props
}: InertiaLinkProps & { active?: boolean }) {
    return (
        <Link
            {...props}
            className={`flex w-full items-start border-l-4 py-2 pe-4 ps-3 ${
                active
                    ? 'border-brand-light bg-brand text-white focus:border-brand-light focus:bg-brand-dark focus:text-white'
                    : 'border-transparent text-brand-light/80 hover:border-brand-light/50 hover:bg-brand hover:text-white focus:border-brand-light/50 focus:bg-brand focus:text-white'
            } text-base font-medium transition duration-150 ease-in-out focus:outline-none ${className}`}
        >
            {children}
        </Link>
    );
}
