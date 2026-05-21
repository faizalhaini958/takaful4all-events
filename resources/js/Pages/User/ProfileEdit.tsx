import UserDashboardLayout from '@/Layouts/UserDashboardLayout';
import { useForm, usePage, Link } from '@inertiajs/react';
import { type FormEventHandler } from 'react';
import { type PageProps } from '@/types';
import { Transition } from '@headlessui/react';
import { User, Lock, Trash2, AlertTriangle, CheckCircle2, ShieldCheck, Mail, BadgeCheck, ArrowLeft } from 'lucide-react';
import { useState, useRef } from 'react';

// ─── Reusable field components ────────────────────────────────────────────────

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
    return (
        <label htmlFor={htmlFor} className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            {children}
        </label>
    );
}

function TextInput({ id, type = 'text', value, onChange, autoComplete, required, placeholder, inputRef }: {
    id: string; type?: string; value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    autoComplete?: string; required?: boolean; placeholder?: string;
    inputRef?: React.Ref<HTMLInputElement>;
}) {
    return (
        <input
            ref={inputRef}
            id={id}
            type={type}
            value={value}
            onChange={onChange}
            autoComplete={autoComplete}
            required={required}
            placeholder={placeholder}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-border bg-gray-50 dark:bg-card focus:bg-white dark:focus:bg-card focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand text-sm text-gray-900 dark:text-foreground transition-colors placeholder:text-gray-400 dark:placeholder:text-muted-foreground"
        />
    );
}

function FieldError({ message }: { message?: string }) {
    if (!message) return null;
    return <p className="mt-1.5 text-xs text-red-500">{message}</p>;
}

type Tab = 'profile' | 'security' | 'danger';

export default function ProfileEdit({ mustVerifyEmail, status }: PageProps<{ mustVerifyEmail: boolean; status?: string }>) {
    const user = usePage<PageProps>().props.auth.user;

    const [tab, setTab] = useState<Tab>('profile');
    const [confirmingDeletion, setConfirmingDeletion] = useState(false);

    // ── Profile info form ──
    const profileForm = useForm({ name: user.name, email: user.email });
    const submitProfile: FormEventHandler = (e) => {
        e.preventDefault();
        profileForm.patch(route('user.profile.update'));
    };

    // ── Password form ──
    const passwordForm = useForm({ current_password: '', password: '', password_confirmation: '' });
    const submitPassword: FormEventHandler = (e) => {
        e.preventDefault();
        passwordForm.put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => passwordForm.reset(),
        });
    };

    // ── Delete form ──
    const deleteForm = useForm({ password: '' });
    const deletePasswordInput = useRef<HTMLInputElement>(null);
    const submitDelete: FormEventHandler = (e) => {
        e.preventDefault();
        deleteForm.delete(route('user.profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => setConfirmingDeletion(false),
            onError: () => deletePasswordInput.current?.focus(),
            onFinish: () => deleteForm.reset(),
        });
    };

    const initial = user?.name?.charAt(0).toUpperCase() ?? '?';

    const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
        { key: 'profile',  label: 'Profile Info', icon: User },
        { key: 'security', label: 'Security',     icon: Lock },
        { key: 'danger',   label: 'Account',      icon: Trash2 },
    ];

    return (
        <UserDashboardLayout title="Edit Profile">
            <div className="max-w-2xl space-y-5">

                {/* ── Back link + header ── */}
                <div className="flex items-center gap-3">
                    <Link href={route('user.profile')}
                        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand font-semibold transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Profile
                    </Link>
                </div>

                {/* ── Mini identity strip ── */}
                <div className="flex items-center gap-4 bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border shadow-sm px-5 py-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black text-white flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #009FBB 0%, #003366 100%)' }}>
                        {initial}
                    </div>
                    <div>
                        <p className="text-sm font-extrabold text-brand-navy">{user.name}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3" /> {user.email}
                        </p>
                    </div>
                    {user.email_verified_at && (
                        <span className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                            <BadgeCheck className="w-3.5 h-3.5" /> Verified
                        </span>
                    )}
                </div>

                {/* ── Tabs + panel ── */}
                <div className="bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border shadow-sm overflow-hidden">

                    {/* Tab bar */}
                    <div className="p-2.5 border-b border-gray-100 dark:border-border bg-gray-50/70 dark:bg-muted/50">
                        <div className="flex gap-1.5">
                            {tabs.map(({ key, label, icon: Icon }) => (
                                <button
                                    key={key}
                                    onClick={() => setTab(key)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 text-sm font-semibold rounded-xl transition-all ${
                                        tab === key
                                            ? 'bg-white dark:bg-background text-brand shadow border border-brand/20'
                                            : 'text-gray-400 dark:text-muted-foreground hover:text-gray-600 dark:hover:text-foreground hover:bg-white/80 dark:hover:bg-background/50'
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── Tab: Profile Info ── */}
                    {tab === 'profile' && (
                        <form onSubmit={submitProfile} className="p-6 space-y-5">
                            <div>
                                <FieldLabel htmlFor="name">Full Name</FieldLabel>
                                <TextInput id="name" value={profileForm.data.name}
                                    onChange={(e) => profileForm.setData('name', e.target.value)}
                                    autoComplete="name" required />
                                <FieldError message={profileForm.errors.name} />
                            </div>
                            <div>
                                <FieldLabel htmlFor="email">Email Address</FieldLabel>
                                <TextInput id="email" type="email" value={profileForm.data.email}
                                    onChange={(e) => profileForm.setData('email', e.target.value)}
                                    autoComplete="email" required />
                                <FieldError message={profileForm.errors.email} />
                            </div>
                            {mustVerifyEmail && user.email_verified_at === null && (
                                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-700">
                                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                    <span>Your email is unverified.{' '}
                                        <Link href={route('verification.send')} method="post" as="button" className="underline font-semibold">
                                            Resend verification
                                        </Link>
                                    </span>
                                </div>
                            )}
                            <div className="flex items-center gap-4 pt-1">
                                <button type="submit" disabled={profileForm.processing}
                                    className="px-6 py-2.5 bg-brand hover:bg-brand-dark text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50">
                                    Save Changes
                                </button>
                                <Transition show={profileForm.recentlySuccessful}
                                    enter="transition ease-in-out duration-200" enterFrom="opacity-0"
                                    leave="transition ease-in-out duration-200" leaveTo="opacity-0">
                                    <span className="text-sm text-emerald-600 flex items-center gap-1 font-medium">
                                        <CheckCircle2 className="w-4 h-4" /> Saved
                                    </span>
                                </Transition>
                            </div>
                        </form>
                    )}

                    {/* ── Tab: Security ── */}
                    {tab === 'security' && (
                        <form onSubmit={submitPassword} className="p-6 space-y-5">
                            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
                                <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                Use at least 8 characters with a mix of letters, numbers and symbols.
                            </div>
                            {([
                                { id: 'current_password', label: 'Current Password',    key: 'current_password',      ac: 'current-password' },
                                { id: 'new_password',     label: 'New Password',         key: 'password',              ac: 'new-password' },
                                { id: 'confirm_password', label: 'Confirm New Password', key: 'password_confirmation', ac: 'new-password' },
                            ] as const).map((f) => (
                                <div key={f.id}>
                                    <FieldLabel htmlFor={f.id}>{f.label}</FieldLabel>
                                    <TextInput id={f.id} type="password"
                                        value={(passwordForm.data as Record<string, string>)[f.key]}
                                        onChange={(e) => passwordForm.setData(f.key as 'current_password' | 'password' | 'password_confirmation', e.target.value)}
                                        autoComplete={f.ac} required />
                                    <FieldError message={(passwordForm.errors as Record<string, string>)[f.key]} />
                                </div>
                            ))}
                            <div className="flex items-center gap-4 pt-1">
                                <button type="submit" disabled={passwordForm.processing}
                                    className="px-6 py-2.5 bg-brand hover:bg-brand-dark text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50">
                                    Update Password
                                </button>
                                <Transition show={passwordForm.recentlySuccessful}
                                    enter="transition ease-in-out duration-200" enterFrom="opacity-0"
                                    leave="transition ease-in-out duration-200" leaveTo="opacity-0">
                                    <span className="text-sm text-emerald-600 flex items-center gap-1 font-medium">
                                        <CheckCircle2 className="w-4 h-4" /> Updated
                                    </span>
                                </Transition>
                            </div>
                        </form>
                    )}

                    {/* ── Tab: Danger Zone ── */}
                    {tab === 'danger' && (
                        <div className="p-6">
                            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl mb-5">
                                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-semibold text-red-700">Delete Account</p>
                                    <p className="text-xs text-red-600 mt-0.5">Once deleted, all your tickets, orders and data are permanently removed and cannot be recovered.</p>
                                </div>
                            </div>
                            {!confirmingDeletion ? (
                                <button onClick={() => setConfirmingDeletion(true)}
                                    className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-xl transition-colors">
                                    Delete My Account
                                </button>
                            ) : (
                                <form onSubmit={submitDelete} className="space-y-4">
                                    <div>
                                        <FieldLabel htmlFor="delete_password">Enter your password to confirm</FieldLabel>
                                        <TextInput id="delete_password" type="password"
                                            inputRef={deletePasswordInput}
                                            value={deleteForm.data.password}
                                            onChange={(e) => deleteForm.setData('password', e.target.value)}
                                            required placeholder="Your current password" />
                                        <FieldError message={deleteForm.errors.password} />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button type="submit" disabled={deleteForm.processing}
                                            className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50">
                                            Yes, Delete My Account
                                        </button>
                                        <button type="button" onClick={() => setConfirmingDeletion(false)}
                                            className="px-6 py-2.5 bg-white border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors">
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}
                </div>

            </div>
        </UserDashboardLayout>
    );
}
