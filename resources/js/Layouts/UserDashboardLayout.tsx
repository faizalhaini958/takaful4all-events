import { Link, usePage } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';
import { type PageProps } from '@/types';
import {
    LayoutDashboard,
    User,
    Ticket,
    ShoppingBag,
    LogOut,
    Globe,
    ChevronRight,
} from 'lucide-react';
import { Head } from '@inertiajs/react';

const navItems = [
    { name: 'Overview',   href: '/dashboard',          icon: LayoutDashboard },
    { name: 'My Tickets', href: '/dashboard/tickets',  icon: Ticket          },
    { name: 'Orders',     href: '/dashboard/orders',   icon: ShoppingBag     },
    { name: 'Profile',    href: '/dashboard/profile',  icon: User            },
];

interface Props {
    title: string;
}

export default function UserDashboardLayout({ title, children }: PropsWithChildren<Props>) {
    const { auth } = usePage<PageProps>().props;
    const user = auth.user;
    const currentUrl = usePage().url;

    const isActive = (href: string) => {
        if (href === '/dashboard') return currentUrl === '/dashboard';
        return currentUrl.startsWith(href);
    };

    const initial = user?.name?.charAt(0).toUpperCase() ?? '?';

    return (
        <>
            <Head title={`${title} — My Account`} />

            {/* Root: flex-col so header + body row stack vertically */}
            <div className="min-h-screen flex flex-col" style={{ background: '#F0FAFA' }}>

                {/* ── Full-width top navbar ── */}
                <header className="sticky top-0 z-50 bg-white border-b border-gray-100 flex-shrink-0 h-16 flex items-center justify-between" style={{ boxShadow: '0 1px 0 #e5e7eb, 0 2px 8px rgba(0,159,187,0.06)' }}>
                    {/* Logo zone — exact same width as sidebar so they align */}
                    <div className="hidden lg:flex w-60 flex-shrink-0 h-full items-center px-5 border-r border-gray-100">
                        <Link href="/">
                            <img src="/images/logo.png" alt="Takaful4All" className="h-9 w-auto" />
                        </Link>
                    </div>

                    {/* Mobile: logo (no sidebar) */}
                    <div className="lg:hidden flex items-center px-4">
                        <Link href="/">
                            <img src="/images/logo.png" alt="Takaful4All" className="h-9 w-auto" />
                        </Link>
                    </div>

                    {/* Content zone — browse events right */}
                    <div className="flex flex-1 items-center justify-end px-6 lg:px-10 min-w-0">
                        <Link
                            href="/events"
                            target="_blank"
                            className="flex-shrink-0 flex items-center gap-2 text-sm font-semibold text-brand border border-brand/40 hover:bg-brand hover:text-white hover:border-brand transition-all duration-200 px-4 py-1.5 rounded-full"
                        >
                            <Globe className="w-4 h-4" />
                            <span className="hidden sm:inline">Browse Events</span>
                        </Link>
                    </div>
                </header>

                {/* ── Body row: sidebar flush-left + right content ── */}
                <div className="flex flex-1 min-h-0">

                    {/* ── Desktop Sidebar — far left, full height ── */}
                    <aside className="hidden lg:flex flex-col w-60 flex-shrink-0 bg-white border-r border-gray-100 sticky top-16 self-start h-[calc(100vh-4rem)] overflow-y-auto z-40">
                        {/* Brand accent stripe */}
                        <div className="h-1 flex-shrink-0" style={{ background: 'linear-gradient(90deg, #003366 0%, #009FBB 100%)' }} />

                        {/* User identity — gradient hero card */}
                        <div className="m-3 rounded-xl overflow-hidden flex-shrink-0" style={{ background: 'linear-gradient(135deg, #001830 0%, #003366 55%, #006e88 100%)' }}>
                            <div className="px-4 pt-4 pb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-base flex-shrink-0 shadow-md"
                                        style={{ background: 'linear-gradient(135deg, #009FBB 0%, #003366 100%)', border: '2px solid rgba(255,255,255,0.2)' }}>
                                        {initial}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-bold text-white leading-snug truncate">{user?.name}</p>
                                        <p className="text-[11px] truncate mt-0.5" style={{ color: 'rgba(200,244,249,0.65)' }}>{user?.email}</p>
                                    </div>
                                </div>
                                <div className="mt-2.5">
                                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(200,244,249,0.9)' }}>
                                        <span className="w-1 h-1 rounded-full bg-brand-light inline-block" />
                                        Member
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Nav links */}
                        <nav className="flex-1 px-3 pt-4 pb-2">
                            <p className="px-2 mb-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Navigation</p>
                            <div className="space-y-0.5">
                                {navItems.map((item) => {
                                    const active = isActive(item.href);
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={[
                                                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
                                                active
                                                    ? 'bg-brand text-white shadow-sm'
                                                    : 'text-gray-600 hover:bg-brand/5 hover:text-brand-navy',
                                            ].join(' ')}
                                        >
                                            <item.icon className={['w-4 h-4 flex-shrink-0 transition-colors', active ? 'text-white' : 'text-gray-400 group-hover:text-brand'].join(' ')} />
                                            {item.name}
                                            {active && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-70" />}
                                        </Link>
                                    );
                                })}
                            </div>
                        </nav>

                        {/* Sign out */}
                        <div className="px-3 pb-4 pt-2 border-t border-gray-100">
                            <Link
                                href={route('logout')}
                                method="post"
                                as="button"
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-150 group"
                            >
                                <LogOut className="w-4 h-4 flex-shrink-0 text-gray-400 group-hover:text-red-500 transition-colors" />
                                Sign Out
                            </Link>
                        </div>
                    </aside>

                    {/* ── Right side: page content ── */}
                    <div className="flex-1 min-w-0">
                        <main className="px-6 lg:px-10 py-6 pb-24 lg:pb-10">
                            {children}
                        </main>
                    </div>
                </div>

                {/* ── Mobile bottom tab bar ── */}
                <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-100 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
                    <div className="flex">
                        {navItems.map((tab) => {
                            const active = isActive(tab.href);
                            return (
                                <Link
                                    key={tab.href}
                                    href={tab.href}
                                    className={[
                                        'flex-1 flex flex-col items-center gap-1 pt-2.5 pb-3 transition-colors',
                                        active ? 'text-brand' : 'text-gray-400 hover:text-gray-600',
                                    ].join(' ')}
                                >
                                    <tab.icon className="w-5 h-5" />
                                    <span className="text-[10px] font-medium">{tab.name}</span>
                                    {active && <div className="absolute bottom-0 w-8 h-0.5 bg-brand rounded-full" />}
                                </Link>
                            );
                        })}
                    </div>
                </nav>

            </div>
        </>
    );
}