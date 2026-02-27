import { Link, usePage } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';
import { type PageProps } from '@/types';
import {
    LayoutDashboard,
    User,
    Ticket,
    ShoppingBag,
    CreditCard,
    LogOut,
    ChevronRight,
    Menu,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { Head } from '@inertiajs/react';

const navigation = [
    { name: 'Dashboard',       href: '/dashboard',          icon: LayoutDashboard, routeName: 'user.dashboard' },
    { name: 'My Profile',      href: '/dashboard/profile',  icon: User,            routeName: 'user.profile' },
    { name: 'My Tickets',      href: '/dashboard/tickets',  icon: Ticket,          routeName: 'user.tickets' },
    { name: 'Order History',   href: '/dashboard/orders',   icon: ShoppingBag,     routeName: 'user.orders' },
    { name: 'Payment Options', href: '/dashboard/payments',  icon: CreditCard,      routeName: 'user.payments' },
];

interface Props {
    title: string;
}

export default function UserDashboardLayout({ title, children }: PropsWithChildren<Props>) {
    const { auth } = usePage<PageProps>().props;
    const user = auth.user;
    const currentUrl = usePage().url;
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const isActive = (href: string) => {
        if (href === '/dashboard') return currentUrl === '/dashboard';
        return currentUrl.startsWith(href);
    };

    return (
        <>
            <Head title={title} />

            <div className="min-h-screen bg-gray-50">
                {/* ── Top header bar ── */}
                <header className="sticky top-0 z-50 bg-brand-navy shadow-md">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <button
                                className="lg:hidden p-2 text-brand-light hover:text-white transition-colors"
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                aria-label="Toggle sidebar"
                            >
                                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>

                            <Link href="/" className="flex-shrink-0">
                                <img src="/images/logo.png" alt="Takaful4All" className="h-9 w-auto" />
                            </Link>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="hidden sm:block text-right">
                                <p className="text-sm font-medium text-white">{user?.name}</p>
                                <p className="text-xs text-brand-light/70">{user?.email}</p>
                            </div>
                            <div className="w-9 h-9 rounded-full bg-brand flex items-center justify-center text-white font-bold text-sm">
                                {user?.name?.charAt(0).toUpperCase()}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex gap-8">
                        {/* ── Sidebar — Mobile overlay ── */}
                        {sidebarOpen && (
                            <div
                                className="lg:hidden fixed inset-0 z-30 bg-black/40"
                                onClick={() => setSidebarOpen(false)}
                            />
                        )}

                        {/* ── Sidebar ── */}
                        <aside
                            className={`
                                fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border border-gray-200 rounded-xl shadow-sm
                                transform transition-transform duration-200 ease-in-out
                                lg:transform-none lg:translate-x-0 lg:flex-shrink-0
                                ${sidebarOpen ? 'translate-x-0 top-16' : '-translate-x-full'}
                            `}
                        >
                            <nav className="p-4 space-y-1">
                                {navigation.map((item) => {
                                    const active = isActive(item.href);
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            onClick={() => setSidebarOpen(false)}
                                            className={`
                                                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                                                ${active
                                                    ? 'bg-brand/10 text-brand-navy font-semibold'
                                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                                }
                                            `}
                                        >
                                            <item.icon className={`w-5 h-5 ${active ? 'text-brand' : 'text-gray-400'}`} />
                                            {item.name}
                                            {active && <ChevronRight className="w-4 h-4 ml-auto text-brand" />}
                                        </Link>
                                    );
                                })}

                                <div className="pt-4 mt-4 border-t border-gray-200">
                                    <Link
                                        href={route('logout')}
                                        method="post"
                                        as="button"
                                        className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                        <LogOut className="w-5 h-5" />
                                        Sign Out
                                    </Link>
                                </div>
                            </nav>
                        </aside>

                        {/* ── Main content ── */}
                        <main className="flex-1 min-w-0">
                            {children}
                        </main>
                    </div>
                </div>
            </div>
        </>
    );
}
