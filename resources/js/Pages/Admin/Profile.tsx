import AdminLayout from '@/Layouts/AdminLayout';
import { useForm, usePage, Link } from '@inertiajs/react';
import { type FormEventHandler, useRef, useState } from 'react';
import { type PageProps } from '@/types';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Separator } from '@/Components/ui/separator';
import { Transition } from '@headlessui/react';
import { User, Mail, Lock, ShieldCheck, AlertTriangle, CheckCircle2, BadgeCheck, Trash2, Shield, CalendarDays, Globe, Eye, EyeOff } from 'lucide-react';

type Tab = 'info' | 'password' | 'danger';

export default function AdminProfile({ mustVerifyEmail, status }: PageProps<{ mustVerifyEmail: boolean; status?: string }>) {
    const user = usePage<PageProps>().props.auth.user;

    const [tab, setTab] = useState<Tab>('info');
    const [confirmingDeletion, setConfirmingDeletion] = useState(false);
    const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false, delete: false });
    const deletePasswordInput = useRef<HTMLInputElement>(null);

    const profileForm = useForm({ name: user.name, email: user.email });
    const passwordForm = useForm({ current_password: '', password: '', password_confirmation: '' });
    const deleteForm = useForm({ password: '' });

    const submitProfile: FormEventHandler = (e) => {
        e.preventDefault();
        profileForm.patch(route('admin.profile.update'));
    };

    const submitPassword: FormEventHandler = (e) => {
        e.preventDefault();
        passwordForm.put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => passwordForm.reset(),
        });
    };

    const submitDelete: FormEventHandler = (e) => {
        e.preventDefault();
        deleteForm.delete(route('admin.profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => setConfirmingDeletion(false),
            onError: () => deletePasswordInput.current?.focus(),
            onFinish: () => deleteForm.reset(),
        });
    };

    const initials = user.name
        .split(' ')
        .map((n: string) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    const memberSince = (user as any)?.created_at
        ? new Date((user as any).created_at).toLocaleDateString('en-MY', { month: 'long', year: 'numeric' })
        : null;

    const roleLabel: Record<string, string> = {
        admin: 'Administrator',
        editor: 'Editor',
        checkin_staff: 'Check-in Staff',
        company: 'Company',
        public: 'Public User',
    };

    const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
        { key: 'info',     label: 'Edit Profile', icon: User },
        { key: 'password', label: 'Security',     icon: Lock },
        { key: 'danger',   label: 'Danger Zone',  icon: Trash2 },
    ];

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* ── Hero Cover Card ── */}
                <div className="relative rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #001830 0%, #003366 40%, #006e88 100%)' }}>
                    {/* Decorative background pattern */}
                    <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
                        style={{
                            backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(200,244,249,1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,1) 0%, transparent 40%)',
                        }}
                    />

                    {/* Content */}
                    <div className="relative px-6 sm:px-8 pt-8 pb-6 sm:pb-8">
                        {/* Top row: status + date */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold tracking-widest uppercase"
                                    style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(200,244,249,0.9)' }}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-brand-light inline-block animate-pulse" />
                                    {roleLabel[user.role] ?? user.role}
                                </span>
                            </div>
                            {memberSince && (
                                <span className="text-[11px] font-medium flex items-center gap-1.5"
                                    style={{ color: 'rgba(255,255,255,0.5)' }}>
                                    <CalendarDays className="w-3 h-3" />
                                    Joined {memberSince}
                                </span>
                            )}
                        </div>

                        {/* Avatar + Info */}
                        <div className="flex flex-col sm:flex-row sm:items-end gap-5">
                            {/* Avatar */}
                            <div className="relative flex-shrink-0">
                                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center text-3xl sm:text-4xl font-black text-white ring-4 shadow-2xl"
                                    style={{
                                        background: 'linear-gradient(135deg, #009FBB 0%, #003366 100%)',
                                        boxShadow: '0 0 0 4px rgba(255,255,255,0.15), 0 12px 40px rgba(0,0,0,0.3)',
                                    }}>
                                    {initials}
                                </div>
                            </div>

                            {/* Name + details */}
                            <div className="flex-1 min-w-0 pb-1">
                                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                                    {user.name}
                                </h1>
                                <p className="text-sm flex items-center gap-1.5 mt-1" style={{ color: 'rgba(200,244,249,0.75)' }}>
                                    <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                                    {user.email}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                    {user.email_verified_at ? (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-950/40 border border-emerald-700/40 px-2.5 py-1 rounded-full">
                                            <BadgeCheck className="w-3 h-3" /> Verified
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-950/40 border border-amber-600/40 px-2.5 py-1 rounded-full">
                                            Unverified
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Quick Info Cards Row ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="rounded-xl border border-border/60 bg-card p-4 flex items-center gap-3 hover:border-primary/30 hover:shadow-sm transition-all">
                        <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10 flex-shrink-0">
                            <Shield className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">Role</p>
                            <p className="text-sm font-semibold text-foreground capitalize">{user.role.replace('_', ' ')}</p>
                        </div>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-card p-4 flex items-center gap-3 hover:border-primary/30 hover:shadow-sm transition-all">
                        <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-emerald-500/10 flex-shrink-0">
                            <BadgeCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">Email Status</p>
                            <p className="text-sm font-semibold text-foreground">{user.email_verified_at ? 'Verified' : 'Unverified'}</p>
                        </div>
                    </div>
                    {memberSince && (
                        <div className="rounded-xl border border-border/60 bg-card p-4 flex items-center gap-3 hover:border-primary/30 hover:shadow-sm transition-all">
                            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-amber-500/10 flex-shrink-0">
                                <CalendarDays className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs text-muted-foreground">Member Since</p>
                                <p className="text-sm font-semibold text-foreground">{memberSince}</p>
                            </div>
                        </div>
                    )}
                    <div className="rounded-xl border border-border/60 bg-card p-4 flex items-center gap-3 hover:border-primary/30 hover:shadow-sm transition-all">
                        <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-violet-500/10 flex-shrink-0">
                            <Globe className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">Account ID</p>
                            <p className="text-sm font-semibold text-foreground font-mono">#{user.id}</p>
                        </div>
                    </div>
                </div>

                {/* ── Content Section ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Tabs + Form */}
                    <div className="lg:col-span-2 rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
                        {/* Tab Header — Instagram/Facebook style pill tabs */}
                        <div className="flex justify-center px-4 pt-4 pb-2 border-b border-border/40">
                            <div className="inline-flex bg-muted/60 rounded-xl p-1 gap-0.5">
                                {tabs.map(({ key, label, icon: Icon }) => (
                                    <button
                                        key={key}
                                        onClick={() => setTab(key)}
                                        className={`relative flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                                            tab === key
                                                ? 'bg-card text-foreground shadow-sm'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span className="hidden sm:inline">{label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tab Content */}
                        <div className="p-5 sm:p-6">
                            {/* ── Edit Profile ── */}
                            {tab === 'info' && (
                                <form onSubmit={submitProfile} className="space-y-5">
                                    <div>
                                        <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full Name</Label>
                                        <Input
                                            id="name"
                                            value={profileForm.data.name}
                                            onChange={(e) => profileForm.setData('name', e.target.value)}
                                            autoComplete="name"
                                            required
                                            className="mt-1.5"
                                        />
                                        {profileForm.errors.name && (
                                            <p className="text-xs text-red-500 mt-1">{profileForm.errors.name}</p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email Address</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={profileForm.data.email}
                                            onChange={(e) => profileForm.setData('email', e.target.value)}
                                            autoComplete="email"
                                            required
                                            className="mt-1.5"
                                        />
                                        {profileForm.errors.email && (
                                            <p className="text-xs text-red-500 mt-1">{profileForm.errors.email}</p>
                                        )}
                                    </div>

                                    {mustVerifyEmail && user.email_verified_at === null && (
                                        <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/5 text-sm text-amber-700 dark:text-amber-400">
                                            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                            <span>
                                                Your email is unverified.{' '}
                                                <Link href={route('verification.send')} method="post" as="button" className="underline font-semibold hover:text-amber-800 dark:hover:text-amber-300">
                                                    Resend verification
                                                </Link>
                                            </span>
                                        </div>
                                    )}

                                    <Separator />

                                    <div className="flex items-center gap-3">
                                        <Button type="submit" disabled={profileForm.processing}>
                                            Save Changes
                                        </Button>
                                        <Transition
                                            show={profileForm.recentlySuccessful}
                                            enter="transition ease-out duration-300"
                                            enterFrom="opacity-0 translate-y-1"
                                            leave="transition ease-in duration-200"
                                            leaveTo="opacity-0"
                                        >
                                            <span className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-semibold">
                                                <CheckCircle2 className="w-4 h-4" /> Profile updated
                                            </span>
                                        </Transition>
                                    </div>
                                </form>
                            )}

                            {/* ── Security ── */}
                            {tab === 'password' && (
                                <form onSubmit={submitPassword} className="space-y-5">
                                    <div className="flex items-start gap-3 p-4 rounded-xl border border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/5 text-sm text-blue-700 dark:text-blue-400">
                                        <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-semibold">Password Requirements</p>
                                            <p className="text-xs mt-0.5 opacity-80">Use at least 8 characters with a mix of letters, numbers and symbols for a strong password.</p>
                                        </div>
                                    </div>

                                    {([
                                        { id: 'current_password', label: 'Current Password', key: 'current_password' as const, ac: 'current-password', placeholder: 'Enter current password', stateKey: 'current' as const },
                                        { id: 'new_password', label: 'New Password', key: 'password' as const, ac: 'new-password', placeholder: 'Enter new password', stateKey: 'new' as const },
                                        { id: 'confirm_password', label: 'Confirm New Password', key: 'password_confirmation' as const, ac: 'new-password', placeholder: 'Re-enter new password', stateKey: 'confirm' as const },
                                    ]).map((f) => (
                                        <div key={f.id}>
                                            <Label htmlFor={f.id} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{f.label}</Label>
                                            <div className="relative mt-1.5">
                                                <Input
                                                    id={f.id}
                                                    type={showPassword[f.stateKey] ? 'text' : 'password'}
                                                    value={(passwordForm.data as Record<string, string>)[f.key]}
                                                    onChange={(e) => passwordForm.setData(f.key, e.target.value)}
                                                    autoComplete={f.ac}
                                                    required
                                                    placeholder={f.placeholder}
                                                    className="pr-10"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(prev => ({ ...prev, [f.stateKey]: !prev[f.stateKey] }))}
                                                    className="absolute right-0 top-0 h-full px-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                                                    tabIndex={-1}
                                                >
                                                    {showPassword[f.stateKey]
                                                        ? <EyeOff className="w-4 h-4" />
                                                        : <Eye className="w-4 h-4" />
                                                    }
                                                </button>
                                            </div>
                                            {(passwordForm.errors as Record<string, string>)[f.key] && (
                                                <p className="text-xs text-red-500 mt-1">{(passwordForm.errors as Record<string, string>)[f.key]}</p>
                                            )}
                                        </div>
                                    ))}

                                    <Separator />

                                    <div className="flex items-center gap-3">
                                        <Button type="submit" disabled={passwordForm.processing}>
                                            Update Password
                                        </Button>
                                        <Transition
                                            show={passwordForm.recentlySuccessful}
                                            enter="transition ease-out duration-300"
                                            enterFrom="opacity-0 translate-y-1"
                                            leave="transition ease-in duration-200"
                                            leaveTo="opacity-0"
                                        >
                                            <span className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-semibold">
                                                <CheckCircle2 className="w-4 h-4" /> Password updated
                                            </span>
                                        </Transition>
                                    </div>
                                </form>
                            )}

                            {/* ── Danger Zone ── */}
                            {tab === 'danger' && (
                                <div>
                                    <div className="flex items-start gap-3 p-5 rounded-xl border-2 border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/5 mb-5">
                                        <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-red-100 dark:bg-red-500/10 flex-shrink-0">
                                            <AlertTriangle className="w-5 h-5 text-red-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-red-700 dark:text-red-400">Delete Account Permanently</p>
                                            <p className="text-xs text-red-600 dark:text-red-400/80 mt-1 leading-relaxed">
                                                Once you delete your account, there is no going back. All your data, tickets, orders and associated records will be permanently removed.
                                            </p>
                                        </div>
                                    </div>

                                    {!confirmingDeletion ? (
                                        <Button variant="destructive" onClick={() => setConfirmingDeletion(true)}>
                                            Delete My Account
                                        </Button>
                                    ) : (
                                        <form onSubmit={submitDelete} className="space-y-4 p-4 rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50/50 dark:bg-red-500/5">
                                            <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                                                Enter your password to confirm account deletion:
                                            </p>
                                            <div>
                                                <div className="relative">
                                                    <Input
                                                        id="delete_password"
                                                        type={showPassword.delete ? 'text' : 'password'}
                                                        ref={deletePasswordInput}
                                                        value={deleteForm.data.password}
                                                        onChange={(e) => deleteForm.setData('password', e.target.value)}
                                                        required
                                                        placeholder="Your current password"
                                                        className="border-red-200 dark:border-red-500/20 focus-visible:ring-red-500 pr-10"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(prev => ({ ...prev, delete: !prev.delete }))}
                                                        className="absolute right-0 top-0 h-full px-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                                                        tabIndex={-1}
                                                    >
                                                        {showPassword.delete
                                                            ? <EyeOff className="w-4 h-4" />
                                                            : <Eye className="w-4 h-4" />
                                                        }
                                                    </button>
                                                </div>
                                                {deleteForm.errors.password && (
                                                    <p className="text-xs text-red-500 mt-1">{deleteForm.errors.password}</p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Button type="submit" variant="destructive" disabled={deleteForm.processing}>
                                                    Yes, Permanently Delete
                                                </Button>
                                                <Button type="button" variant="outline" onClick={() => setConfirmingDeletion(false)}>
                                                    Cancel
                                                </Button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Sidebar Info */}
                    <div className="space-y-4">
                        {/* Account details card */}
                        <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-border/40">
                                <h3 className="text-sm font-bold text-foreground">Account Details</h3>
                            </div>
                            <div className="divide-y divide-border/30">
                                <div className="px-5 py-3.5 flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">Full Name</span>
                                    <span className="text-sm font-semibold text-foreground text-right max-w-[140px] truncate">{user.name}</span>
                                </div>
                                <div className="px-5 py-3.5 flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">Email</span>
                                    <span className="text-sm font-semibold text-foreground text-right max-w-[140px] truncate">{user.email}</span>
                                </div>
                                <div className="px-5 py-3.5 flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">Role</span>
                                    <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary capitalize">{user.role.replace('_', ' ')}</span>
                                </div>
                                <div className="px-5 py-3.5 flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">Status</span>
                                    {user.email_verified_at ? (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                            <BadgeCheck className="w-3.5 h-3.5" /> Verified
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                                            <AlertTriangle className="w-3 h-3" /> Unverified
                                        </span>
                                    )}
                                </div>
                                {memberSince && (
                                    <div className="px-5 py-3.5 flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground">Member Since</span>
                                        <span className="text-sm font-semibold text-foreground">{memberSince}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Tips card */}
                        <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-primary/10">
                                    <ShieldCheck className="w-4 h-4 text-primary" />
                                </div>
                                <h3 className="text-sm font-bold text-foreground">Security Tips</h3>
                            </div>
                            <ul className="space-y-2.5">
                                {[
                                    'Use a strong, unique password',
                                    'Enable two-factor authentication',
                                    'Keep your email address up to date',
                                    'Never share your login credentials',
                                    'Log out from shared devices',
                                ].map((tip, i) => (
                                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                                        <span className="flex-shrink-0 w-1 h-1 rounded-full bg-primary mt-1.5" />
                                        {tip}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
