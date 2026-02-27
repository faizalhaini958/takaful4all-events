import { Link, usePage } from '@inertiajs/react';
import { useState, useCallback, type PropsWithChildren } from 'react';
import { Facebook, Linkedin, Instagram, Youtube, Menu, X, UserCircle } from 'lucide-react';
import { type MenuItem, type SharedProps } from '@/types';
import LoginModal from '@/Components/LoginModal';
import RegisterModal from '@/Components/RegisterModal';
import ForgotPasswordModal from '@/Components/ForgotPasswordModal';

export default function PublicLayout({ children }: PropsWithChildren) {
    const props = usePage().props as unknown as SharedProps & { menus?: Record<string, MenuItem[]> };
    const auth = props.auth;

    const mainNav   = props.menus?.['main-navigation']   ?? [];
    const footerNav = props.menus?.['footer-navigation']  ?? [];
    const legalNav  = props.menus?.['legal-navigation']   ?? [];

    const [mobileOpen, setMobileOpen] = useState(false);
    const [loginOpen, setLoginOpen] = useState(false);
    const [registerOpen, setRegisterOpen] = useState(false);
    const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

    const switchToLogin = useCallback(() => {
        setRegisterOpen(false);
        setForgotPasswordOpen(false);
        setTimeout(() => setLoginOpen(true), 150);
    }, []);

    const switchToRegister = useCallback(() => {
        setLoginOpen(false);
        setTimeout(() => setRegisterOpen(true), 150);
    }, []);

    const switchToForgotPassword = useCallback(() => {
        setLoginOpen(false);
        setTimeout(() => setForgotPasswordOpen(true), 150);
    }, []);

    const navItems = mainNav.length > 0
        ? mainNav
        : [
            { id: 0, url: '/',       label: 'Home' },
            { id: 1, url: '/about',  label: 'About' },
            { id: 2, url: '/events', label: 'Events' },
            { id: 3, url: '/contact',label: 'Contact' },
          ];

    return (
        <div className="min-h-screen flex flex-col bg-white text-gray-900">
            {/* ── Navbar ── */}
            <header className="sticky top-0 z-50 bg-brand-light shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex-shrink-0">
                        <img src="/images/logo.png" alt="Takaful4All" className="h-9 w-auto" />
                    </Link>

                    {/* Nav links — desktop */}
                    <nav className="hidden md:flex items-center gap-6 text-sm font-semibold uppercase tracking-wide text-brand-navy">
                        {navItems.map(item => (
                            <Link key={item.id} href={item.url} className="hover:text-brand transition-colors">{item.label}</Link>
                        ))}
                        {auth?.user ? (
                            <Link href="/dashboard" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-navy text-white hover:bg-brand transition-colors text-xs">
                                <UserCircle className="w-4 h-4" />
                                My Account
                            </Link>
                        ) : (
                            <button
                                onClick={() => setLoginOpen(true)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-navy text-white hover:bg-brand transition-colors text-xs font-semibold uppercase tracking-wide cursor-pointer"
                            >
                                Login
                            </button>
                        )}
                    </nav>

                    {/* Burger button — mobile only */}
                    <button
                        className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-brand-navy hover:text-brand hover:bg-brand-light/60 transition-colors"
                        onClick={() => setMobileOpen(prev => !prev)}
                        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                        aria-expanded={mobileOpen}
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                </div>
            </header>

            {/* ── Mobile drawer overlay ── */}
            {/* Backdrop */}
            <div
                className={`md:hidden fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setMobileOpen(false)}
                aria-hidden="true"
            />

            {/* Drawer panel */}
            <div
                className={`md:hidden fixed top-0 right-0 z-50 h-full w-72 bg-brand-light shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {/* Drawer header */}
                <div className="flex items-center justify-end px-5 h-16 border-b border-brand-navy/10">
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="p-2 rounded-md text-brand-navy hover:text-brand hover:bg-brand-navy/10 transition-colors"
                        aria-label="Close menu"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Nav links */}
                <nav className="flex flex-col gap-1 px-4 py-4">
                    {navItems.map(item => (
                        <Link
                            key={item.id}
                            href={item.url}
                            onClick={() => setMobileOpen(false)}
                            className="block py-3 px-3 rounded-md text-sm font-semibold uppercase tracking-wide text-brand-navy hover:bg-brand-navy/10 hover:text-brand transition-colors"
                        >
                            {item.label}
                        </Link>
                    ))}

                    <div className="mt-4 pt-4 border-t border-brand-navy/10">
                        {auth?.user ? (
                            <Link
                                href="/dashboard"
                                onClick={() => setMobileOpen(false)}
                                className="flex items-center gap-2 py-3 px-3 rounded-md text-sm font-semibold text-brand-navy bg-brand-navy/5 hover:bg-brand-navy/10 transition-colors"
                            >
                                <UserCircle className="w-5 h-5" />
                                My Account
                            </Link>
                        ) : (
                            <button
                                onClick={() => {
                                    setMobileOpen(false);
                                    setLoginOpen(true);
                                }}
                                className="flex items-center gap-2 py-3 px-3 rounded-md text-sm font-semibold text-white bg-brand-navy hover:bg-brand transition-colors w-full cursor-pointer"
                            >
                                Login
                            </button>
                        )}
                    </div>
                </nav>
            </div>

            {/* ── Auth Modals ── */}
            {!auth?.user && (
                <>
                    <LoginModal
                        open={loginOpen}
                        onOpenChange={setLoginOpen}
                        onSwitchToRegister={switchToRegister}
                        onSwitchToForgotPassword={switchToForgotPassword}
                    />
                    <RegisterModal
                        open={registerOpen}
                        onOpenChange={setRegisterOpen}
                        onSwitchToLogin={switchToLogin}
                    />
                    <ForgotPasswordModal
                        open={forgotPasswordOpen}
                        onOpenChange={setForgotPasswordOpen}
                        onSwitchToLogin={switchToLogin}
                    />
                </>
            )}

            {/* ── Page content ── */}
            <main className="flex-1">{children}</main>

            {/* ── Footer ── */}
            <footer className="mt-16 text-brand-light/80" style={{ backgroundColor: '#283746' }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Brand */}
                        <div>
                            <Link href="/">
                                <img src="/images/logo.png" alt="Takaful4All" className="h-10 w-auto brightness-0 invert mb-3" />
                            </Link>
                            <p className="text-sm text-brand-light/60">
                                The leading platform for Takaful meet-ups and conferences in Malaysia.
                            </p>
                            {/* Social media */}
                            <div className="flex items-center gap-3 mt-4">
                                <a href="https://www.facebook.com/mtasocialmedia.mta" target="_blank" rel="noopener noreferrer" className="text-brand-light/50 hover:text-brand transition-colors" aria-label="Facebook">
                                    <Facebook className="w-5 h-5" />
                                </a>
                                <a href="https://my.linkedin.com/company/malaysian-takaful-association" target="_blank" rel="noopener noreferrer" className="text-brand-light/50 hover:text-brand transition-colors" aria-label="LinkedIn">
                                    <Linkedin className="w-5 h-5" />
                                </a>
                                <a href="https://www.instagram.com/malaysiantakafulassociation/?hl=en" target="_blank" rel="noopener noreferrer" className="text-brand-light/50 hover:text-brand transition-colors" aria-label="Instagram">
                                    <Instagram className="w-5 h-5" />
                                </a>
                                <a href="https://www.youtube.com/channel/UCCUm__PhqVIKJscy6FLdXjA" target="_blank" rel="noopener noreferrer" className="text-brand-light/50 hover:text-brand transition-colors" aria-label="YouTube">
                                    <Youtube className="w-5 h-5" />
                                </a>
                            </div>
                        </div>

                        {/* Quick links */}
                        <div>
                            <p className="text-white font-semibold mb-3">Quick Links</p>
                            <ul className="space-y-2 text-sm">
                                {(footerNav.length > 0 ? footerNav : [
                                    { id: 0, url: '/',       label: 'Home' },
                                    { id: 1, url: '/about',  label: 'About Us' },
                                    { id: 2, url: '/events', label: 'Events' },
                                    { id: 3, url: '/contact',label: 'Contact' },
                                ]).map(item => (
                                    <li key={item.id}>
                                        <Link href={item.url} className="hover:text-brand transition-colors">{item.label}</Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Legal */}
                        <div>
                            <p className="text-white font-semibold mb-3">Legals</p>
                            <ul className="space-y-2 text-sm">
                                {(legalNav.length > 0 ? legalNav : [
                                    { id: 0, url: '/terms',               label: 'Terms & Conditions' },
                                    { id: 1, url: '/privacy-policy',      label: 'Privacy Policy' },
                                    { id: 2, url: '/cancellation-refund', label: 'Cancellation & Refund' },
                                ]).map(item => (
                                    <li key={item.id}>
                                        <Link href={item.url} className="hover:text-brand transition-colors">{item.label}</Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-white/10 mt-8 pt-6 text-sm text-brand-light/40 text-center">
                        © {new Date().getFullYear()} Malaysian Takaful Association. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}
