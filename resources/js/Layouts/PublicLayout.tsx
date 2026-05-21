import { Link, usePage, Head } from '@inertiajs/react';
import { useState, useCallback, type PropsWithChildren } from 'react';
import { Facebook, Linkedin, Instagram, Youtube, Menu, X, UserCircle } from 'lucide-react';
import { type MenuItem, type SharedProps } from '@/types';
import { useTranslation } from '@/hooks/use-translation';
import LoginModal from '@/Components/LoginModal';
import RegisterModal from '@/Components/RegisterModal';
import ForgotPasswordModal from '@/Components/ForgotPasswordModal';
import LanguageSwitcher from '@/Components/LanguageSwitcher';

export default function PublicLayout({ children }: PropsWithChildren) {
    const props = usePage().props as unknown as SharedProps & { menus?: Record<string, MenuItem[]> };
    const auth = props.auth;
    const currentUrl = props.currentUrl;
    const { t } = useTranslation();

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
            { id: 0, url: '/',          label: t('nav.home') },
            { id: 1, url: '/about',      label: t('nav.about') },
            { id: 2, url: '/events',     label: t('nav.events') },
            { id: 3, url: '/content',    label: t('nav.content') },
            { id: 4, url: '/contact',    label: t('nav.contact') },
          ];

    return (
        <>
        <Head>
            <link rel="alternate" hreflang="en" href={currentUrl} />
            <link rel="alternate" hreflang="ms" href={currentUrl} />
            <link rel="alternate" hreflang="x-default" href={currentUrl} />
        </Head>
        <div className="min-h-screen flex flex-col bg-white text-gray-900">
            {/* ── Navbar ── */}
            <header className="sticky top-0 z-50 border-b border-white/5 backdrop-blur-md" style={{ backgroundColor: 'rgba(7,27,42,0.92)' }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex-shrink-0">
                        <img src="/images/logo.png" alt="Takaful4All" className="h-9 w-auto brightness-0 invert" />
                    </Link>

                    {/* Nav links — desktop */}
                    <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-white/70">
                        {navItems.map(item => (
                            <Link key={item.id} href={item.url} className="hover:text-white transition-colors tracking-wide">{item.label}</Link>
                        ))}
                        <LanguageSwitcher />
                        {auth?.user ? (
                            ['admin', 'editor', 'checkin_staff'].includes(auth.user.role) ? (
                                <Link href="/admin" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[#071B2A] text-xs font-bold" style={{ background: 'linear-gradient(135deg, #18C8FF, #8BE9E0)' }}>
                                    <UserCircle className="w-4 h-4" />
                                    {t('nav.management')}
                                </Link>
                            ) : (
                                <Link href="/dashboard" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-white text-xs font-medium border border-white/20 hover:border-[#18C8FF]/60 hover:text-[#18C8FF] transition-all">
                                    <UserCircle className="w-4 h-4" />
                                    {t('nav.my_account')}
                                </Link>
                            )
                        ) : (
                            <button
                                onClick={() => setLoginOpen(true)}
                                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-[#071B2A] text-xs font-bold cursor-pointer transition-opacity hover:opacity-90"
                                style={{ background: 'linear-gradient(135deg, #18C8FF, #8BE9E0)' }}
                            >
                                {t('nav.login')}
                            </button>
                        )}
                    </nav>

                    {/* Burger button — mobile only */}
                    <button
                        className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors"
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
                className={`md:hidden fixed top-0 right-0 z-50 h-full w-72 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}`}
                style={{ backgroundColor: '#071B2A' }}
            >
                {/* Drawer header */}
                <div className="flex items-center justify-between px-5 h-16 border-b border-white/10">
                    <img src="/images/logo.png" alt="Takaful4All" className="h-8 w-auto brightness-0 invert" />
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="p-2 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                        aria-label={t('nav.close_menu')}
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
                            className="block py-3 px-3 rounded-md text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                        >
                            {item.label}
                        </Link>
                    ))}

                    <div className="mt-4 pt-4 border-t border-white/10">
                        <div className="py-2 px-3">
                            <LanguageSwitcher />
                        </div>
                        {auth?.user ? (
                            ['admin', 'editor', 'checkin_staff'].includes(auth.user.role) ? (
                                <Link
                                    href="/admin"
                                    onClick={() => setMobileOpen(false)}
                                    className="flex items-center gap-2 py-3 px-3 rounded-md text-sm font-bold text-[#071B2A]"
                                    style={{ background: 'linear-gradient(135deg, #18C8FF, #8BE9E0)' }}
                                >
                                    <UserCircle className="w-5 h-5" />
                                    {t('nav.management')}
                                </Link>
                            ) : (
                                <Link
                                    href="/dashboard"
                                    onClick={() => setMobileOpen(false)}
                                    className="flex items-center gap-2 py-3 px-3 rounded-md text-sm font-medium text-white border border-white/20 hover:border-[#18C8FF]/50 transition-colors"
                                >
                                    <UserCircle className="w-5 h-5" />
                                    {t('nav.my_account')}
                                </Link>
                            )
                        ) : (
                            <button
                                onClick={() => {
                                    setMobileOpen(false);
                                    setLoginOpen(true);
                                }}
                                className="flex items-center justify-center gap-2 py-3 px-3 rounded-md text-sm font-bold text-[#071B2A] w-full cursor-pointer"
                                style={{ background: 'linear-gradient(135deg, #18C8FF, #8BE9E0)' }}
                            >
                                {t('nav.login')}
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
            <footer className="mt-0 text-white/60" style={{ background: 'linear-gradient(145deg, #071B2A 0%, #0a3352 50%, #071B2A 100%)', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        {/* Brand */}
                        <div>
                            <Link href="/">
                                <img src="/images/logo.png" alt="Takaful4All" className="h-10 w-auto brightness-0 invert mb-4" />
                            </Link>
                            <p className="text-sm text-white/40 leading-relaxed">
                                {t('footer.tagline')}
                            </p>
                            {/* Social media */}
                            <div className="flex items-center gap-3 mt-5">
                                <a href="https://www.facebook.com/mtasocialmedia.mta" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full flex items-center justify-center border border-white/10 text-white/40 hover:border-[#18C8FF]/50 hover:text-[#18C8FF] transition-all" aria-label="Facebook">
                                    <Facebook className="w-4 h-4" />
                                </a>
                                <a href="https://my.linkedin.com/company/malaysian-takaful-association" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full flex items-center justify-center border border-white/10 text-white/40 hover:border-[#18C8FF]/50 hover:text-[#18C8FF] transition-all" aria-label="LinkedIn">
                                    <Linkedin className="w-4 h-4" />
                                </a>
                                <a href="https://www.instagram.com/malaysiantakafulassociation/?hl=en" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full flex items-center justify-center border border-white/10 text-white/40 hover:border-[#18C8FF]/50 hover:text-[#18C8FF] transition-all" aria-label="Instagram">
                                    <Instagram className="w-4 h-4" />
                                </a>
                                <a href="https://www.youtube.com/channel/UCCUm__PhqVIKJscy6FLdXjA" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full flex items-center justify-center border border-white/10 text-white/40 hover:border-[#18C8FF]/50 hover:text-[#18C8FF] transition-all" aria-label="YouTube">
                                    <Youtube className="w-4 h-4" />
                                </a>
                            </div>
                        </div>

                        {/* Quick links */}
                        <div>
                            <p className="text-white text-sm font-semibold mb-4 tracking-wide">{t('footer.quick_links')}</p>
                            <ul className="space-y-2.5 text-sm">
                                {(footerNav.length > 0 ? footerNav : [
                                    { id: 0, url: '/',       label: t('nav.home') },
                                    { id: 1, url: '/about',  label: t('footer.about_us') },
                                    { id: 2, url: '/events', label: t('nav.events') },
                                    { id: 3, url: '/contact',label: t('nav.contact') },
                                ]).map(item => (
                                    <li key={item.id}>
                                        <Link href={item.url} className="text-white/40 hover:text-white transition-colors">{item.label}</Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Legal */}
                        <div>
                            <p className="text-white text-sm font-semibold mb-4 tracking-wide">{t('footer.legals')}</p>
                            <ul className="space-y-2.5 text-sm">
                                {(legalNav.length > 0 ? legalNav : [
                                    { id: 0, url: '/terms',               label: t('footer.terms') },
                                    { id: 1, url: '/privacy-policy',      label: t('footer.privacy') },
                                    { id: 2, url: '/cancellation-refund', label: t('footer.refund') },
                                ]).map(item => (
                                    <li key={item.id}>
                                        <Link href={item.url} className="text-white/40 hover:text-white transition-colors">{item.label}</Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-white/5 mt-10 pt-6 text-xs text-white/25 text-center">
                        © {new Date().getFullYear()} Malaysian Takaful Association. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
        </>
    );
}
