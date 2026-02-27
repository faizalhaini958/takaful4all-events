import UserDashboardLayout from '@/Layouts/UserDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { useForm, usePage, Link } from '@inertiajs/react';
import { type FormEventHandler } from 'react';
import { type PageProps } from '@/types';
import { Transition } from '@headlessui/react';
import { User, Lock, Trash2, AlertTriangle } from 'lucide-react';
import { useState, useRef } from 'react';

export default function Profile({ mustVerifyEmail, status }: PageProps<{ mustVerifyEmail: boolean; status?: string }>) {
    const user = usePage<PageProps>().props.auth.user;

    // ── Profile info form ──
    const profileForm = useForm({
        name: user.name,
        email: user.email,
    });

    const submitProfile: FormEventHandler = (e) => {
        e.preventDefault();
        profileForm.patch(route('user.profile.update'));
    };

    // ── Password form ──
    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submitPassword: FormEventHandler = (e) => {
        e.preventDefault();
        passwordForm.put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => passwordForm.reset(),
        });
    };

    // ── Delete form ──
    const [confirmingDeletion, setConfirmingDeletion] = useState(false);
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

    return (
        <UserDashboardLayout title="My Profile">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage your account information and security settings.</p>
                </div>

                {/* Profile Information */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center">
                                <User className="w-5 h-5 text-brand" />
                            </div>
                            <div>
                                <CardTitle>Profile Information</CardTitle>
                                <CardDescription>Update your name and email address.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submitProfile} className="space-y-4 max-w-lg">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    value={profileForm.data.name}
                                    onChange={(e) => profileForm.setData('name', e.target.value)}
                                    required
                                    autoComplete="name"
                                />
                                {profileForm.errors.name && (
                                    <p className="text-sm text-red-600">{profileForm.errors.name}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={profileForm.data.email}
                                    onChange={(e) => profileForm.setData('email', e.target.value)}
                                    required
                                    autoComplete="email"
                                />
                                {profileForm.errors.email && (
                                    <p className="text-sm text-red-600">{profileForm.errors.email}</p>
                                )}
                            </div>

                            {mustVerifyEmail && user.email_verified_at === null && (
                                <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                                    Your email address is unverified.
                                    <Link
                                        href={route('verification.send')}
                                        method="post"
                                        as="button"
                                        className="underline ml-1 font-medium"
                                    >
                                        Click here to resend the verification email.
                                    </Link>
                                </div>
                            )}

                            <div className="flex items-center gap-4">
                                <Button type="submit" disabled={profileForm.processing}>
                                    Save Changes
                                </Button>

                                <Transition
                                    show={profileForm.recentlySuccessful}
                                    enter="transition ease-in-out"
                                    enterFrom="opacity-0"
                                    leave="transition ease-in-out"
                                    leaveTo="opacity-0"
                                >
                                    <p className="text-sm text-green-600">Saved.</p>
                                </Transition>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Update Password */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                <Lock className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <CardTitle>Update Password</CardTitle>
                                <CardDescription>Ensure your account uses a strong password.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submitPassword} className="space-y-4 max-w-lg">
                            <div className="space-y-2">
                                <Label htmlFor="current_password">Current Password</Label>
                                <Input
                                    id="current_password"
                                    type="password"
                                    value={passwordForm.data.current_password}
                                    onChange={(e) => passwordForm.setData('current_password', e.target.value)}
                                    required
                                    autoComplete="current-password"
                                />
                                {passwordForm.errors.current_password && (
                                    <p className="text-sm text-red-600">{passwordForm.errors.current_password}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">New Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={passwordForm.data.password}
                                    onChange={(e) => passwordForm.setData('password', e.target.value)}
                                    required
                                    autoComplete="new-password"
                                />
                                {passwordForm.errors.password && (
                                    <p className="text-sm text-red-600">{passwordForm.errors.password}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password_confirmation">Confirm New Password</Label>
                                <Input
                                    id="password_confirmation"
                                    type="password"
                                    value={passwordForm.data.password_confirmation}
                                    onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
                                    required
                                    autoComplete="new-password"
                                />
                                {passwordForm.errors.password_confirmation && (
                                    <p className="text-sm text-red-600">{passwordForm.errors.password_confirmation}</p>
                                )}
                            </div>

                            <div className="flex items-center gap-4">
                                <Button type="submit" disabled={passwordForm.processing}>
                                    Update Password
                                </Button>

                                <Transition
                                    show={passwordForm.recentlySuccessful}
                                    enter="transition ease-in-out"
                                    enterFrom="opacity-0"
                                    leave="transition ease-in-out"
                                    leaveTo="opacity-0"
                                >
                                    <p className="text-sm text-green-600">Password updated.</p>
                                </Transition>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Delete Account */}
                <Card className="border-red-200">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                                <Trash2 className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <CardTitle className="text-red-600">Delete Account</CardTitle>
                                <CardDescription>Permanently delete your account and all associated data.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {!confirmingDeletion ? (
                            <Button
                                variant="destructive"
                                onClick={() => setConfirmingDeletion(true)}
                            >
                                Delete Account
                            </Button>
                        ) : (
                            <form onSubmit={submitDelete} className="space-y-4 max-w-lg">
                                <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg">
                                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-700">
                                        Once your account is deleted, all of its resources and data will be permanently deleted.
                                        Please enter your password to confirm.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="delete_password">Password</Label>
                                    <Input
                                        id="delete_password"
                                        type="password"
                                        ref={deletePasswordInput}
                                        value={deleteForm.data.password}
                                        onChange={(e) => deleteForm.setData('password', e.target.value)}
                                        required
                                        placeholder="Enter your password to confirm"
                                    />
                                    {deleteForm.errors.password && (
                                        <p className="text-sm text-red-600">{deleteForm.errors.password}</p>
                                    )}
                                </div>

                                <div className="flex items-center gap-3">
                                    <Button variant="destructive" type="submit" disabled={deleteForm.processing}>
                                        Yes, Delete My Account
                                    </Button>
                                    <Button variant="outline" type="button" onClick={() => setConfirmingDeletion(false)}>
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </UserDashboardLayout>
    );
}
