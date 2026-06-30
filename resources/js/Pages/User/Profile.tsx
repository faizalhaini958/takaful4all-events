import UserDashboardLayout from '@/Layouts/UserDashboardLayout';
import { usePage, Link } from '@inertiajs/react';
import { type PageProps } from '@/types';
import { Mail, BadgeCheck, Pencil, Ticket, ShoppingBag, Calendar, LogOut } from 'lucide-react';

export default function Profile() {
    const user = usePage<PageProps>().props.auth.user;

    const memberSince = (user as any)?.created_at
        ? new Date((user as any).created_at).toLocaleDateString('en-MY', { month: 'long', year: 'numeric' })
        : null;

    const initial = user?.name?.charAt(0).toUpperCase() ?? '?';

    return (
        <UserDashboardLayout title="My Profile">
            <div className="space-y-5">

                {/* ── Hero card ── */}
                <div className="rounded-2xl overflow-hidden shadow-md" style={{ background: 'linear-gradient(135deg, #001830 0%, #003366 50%, #006e88 100%)' }}>
                    <div className="relative px-8 pt-8 pb-0">

                        {/* Top row */}
                        <div className="relative flex items-center justify-between mb-6">
                            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold tracking-widest" style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(200,244,249,1)' }}>
                                <span className="w-1.5 h-1.5 rounded-full bg-brand-light inline-block animate-pulse" />
                                MEMBER
                            </span>
                            {user.email_verified_at ? (
                                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 bg-emerald-950/50 border border-emerald-700/40 px-3 py-1.5 rounded-full">
                                    <BadgeCheck className="w-3.5 h-3.5" /> Verified
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-300 bg-amber-950/50 border border-amber-600/40 px-3 py-1.5 rounded-full">
                                    Unverified
                                </span>
                            )}
                        </div>

                        {/* Avatar + name */}
                        <div className="relative pb-7">
                            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                                <div className="w-24 h-24 rounded-3xl border-4 flex items-center justify-center text-4xl font-black text-white flex-shrink-0 shadow-2xl"
                                    style={{ background: 'linear-gradient(135deg, #009FBB 0%, #003366 100%)', borderColor: 'rgba(255,255,255,0.2)' }}>
                                    {initial}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-2xl font-extrabold text-white leading-tight tracking-tight break-words">{user.name}</h2>
                                    <p className="text-sm flex items-center gap-1.5 mt-1 break-all" style={{ color: 'rgba(200,244,249,0.8)' }}>
                                        <Mail className="w-3.5 h-3.5 flex-shrink-0" />{user.email}
                                    </p>
                                    {memberSince && (
                                        <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>Member since {memberSince}</p>
                                    )}
                                </div>
                            </div>
                            {/* Edit button — full width on mobile, auto on desktop */}
                            <div className="mt-4">
                                <Link
                                    href={route('user.profile.edit')}
                                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
                                    style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.2)' }}
                                >
                                    <Pencil className="w-4 h-4" />
                                    Edit Profile
                                </Link>
                                <Link
                                    href={route('logout')}
                                    method="post"
                                    as="button"
                                    className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
                                    style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.18)' }}
                                >
                                    <LogOut className="w-4 h-4" />
                                    Sign Out
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Details card ── */}
                <div className="bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50 dark:border-border">
                        <h3 className="text-sm font-bold text-brand-navy dark:text-foreground uppercase tracking-wide">Account Details</h3>
                    </div>
                    <div className="divide-y divide-gray-50 dark:divide-border">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-6 py-4 gap-1">
                            <span className="text-xs font-semibold text-gray-400 dark:text-muted-foreground uppercase tracking-wide">Full Name</span>
                            <span className="text-sm font-semibold text-gray-800 dark:text-foreground truncate">{user.name}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-6 py-4 gap-1">
                            <span className="text-xs font-semibold text-gray-400 dark:text-muted-foreground uppercase tracking-wide">Email Address</span>
                            <span className="text-sm font-semibold text-gray-800 dark:text-foreground break-all">{user.email}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-6 py-4 gap-1">
                            <span className="text-xs font-semibold text-gray-400 dark:text-muted-foreground uppercase tracking-wide">Email Status</span>
                            {user.email_verified_at ? (
                                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full w-fit">
                                    <BadgeCheck className="w-3.5 h-3.5" /> Verified
                                </span>
                            ) : (
                                <span className="text-xs font-bold text-amber-500 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full w-fit">Not Verified</span>
                            )}
                        </div>
                        {memberSince && (
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-6 py-4 gap-1">
                                <span className="text-xs font-semibold text-gray-400 dark:text-muted-foreground uppercase tracking-wide">Member Since</span>
                                <span className="text-sm font-semibold text-gray-800 dark:text-foreground">{memberSince}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Quick links ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Link href={route('user.tickets')}
                        className="bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border shadow-sm p-5 flex items-center gap-4 hover:border-brand/30 hover:shadow-md transition-all group">
                        <div className="w-11 h-11 rounded-xl bg-brand/10 flex items-center justify-center flex-shrink-0 group-hover:bg-brand/15 transition-colors">
                            <Ticket className="w-5 h-5 text-brand" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-brand-navy dark:text-foreground">My Tickets</p>
                            <p className="text-xs text-gray-400 dark:text-muted-foreground">View all registrations</p>
                        </div>
                    </Link>
                    <Link href={route('user.orders')}
                        className="bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border shadow-sm p-5 flex items-center gap-4 hover:border-brand/30 hover:shadow-md transition-all group">
                        <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-100 transition-colors">
                            <ShoppingBag className="w-5 h-5 text-purple-500" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-brand-navy dark:text-foreground">My Orders</p>
                            <p className="text-xs text-gray-400 dark:text-muted-foreground">Purchase history</p>
                        </div>
                    </Link>
                </div>

            </div>
        </UserDashboardLayout>
    );
}
