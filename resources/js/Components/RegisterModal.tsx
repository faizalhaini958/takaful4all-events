import { useForm } from '@inertiajs/react';
import { type FormEventHandler, useRef, useEffect } from 'react';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { UserPlus, Loader2 } from 'lucide-react';

interface RegisterModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSwitchToLogin: () => void;
    returnTo?: string;
    initialEmail?: string;
}

export default function RegisterModal({ open, onOpenChange, onSwitchToLogin, returnTo, initialEmail }: RegisterModalProps) {
    const { executeRecaptcha } = useGoogleReCaptcha();
    const tokenRef = useRef('');
    const { data, setData, post, processing, errors, reset, transform } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        recaptcha_token: '',
        return_to: '',
    });

    transform(d => ({ ...d, recaptcha_token: tokenRef.current, return_to: returnTo ?? '' }));

    // Pre-fill email when initialEmail is provided (e.g. post-payment CTA)
    useEffect(() => {
        if (open && initialEmail && !data.email) {
            setData('email', initialEmail);
        }
    }, [open, initialEmail]);

    const submit: FormEventHandler = async (e) => {
        e.preventDefault();

        if (executeRecaptcha) {
            try {
                tokenRef.current = await executeRecaptcha('register');
            } catch {
                // reCAPTCHA not available (no key configured), continue without token
            }
        }

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
            onSuccess: () => onOpenChange(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="text-center sm:text-center">
                    <div className="mx-auto mb-2 w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center">
                        <UserPlus className="w-6 h-6 text-brand" />
                    </div>
                    <DialogTitle className="text-xl">Create an account</DialogTitle>
                    <DialogDescription>
                        Register to start managing your events and tickets.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-4 mt-2">
                    <div className="space-y-2">
                        <Label htmlFor="register-name">Name</Label>
                        <Input
                            id="register-name"
                            type="text"
                            placeholder="Your full name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            autoComplete="name"
                            autoFocus
                            required
                        />
                        {errors.name && (
                            <p className="text-sm text-red-600">{errors.name}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="register-email">Email</Label>
                        <Input
                            id="register-email"
                            type="email"
                            placeholder="you@example.com"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            autoComplete="username"
                            required
                        />
                        {errors.email && (
                            <p className="text-sm text-red-600">{errors.email}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="register-password">Password</Label>
                        <Input
                            id="register-password"
                            type="password"
                            placeholder="••••••••"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            autoComplete="new-password"
                            required
                        />
                        {errors.password && (
                            <p className="text-sm text-red-600">{errors.password}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="register-password-confirm">Confirm Password</Label>
                        <Input
                            id="register-password-confirm"
                            type="password"
                            placeholder="••••••••"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            autoComplete="new-password"
                            required
                        />
                        {errors.password_confirmation && (
                            <p className="text-sm text-red-600">{errors.password_confirmation}</p>
                        )}
                    </div>

                    <Button type="submit" className="w-full" disabled={processing}>
                        {processing ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Creating account…
                            </>
                        ) : (
                            'Register'
                        )}
                    </Button>
                    {errors.recaptcha_token && (
                        <p className="text-sm text-red-600 text-center">{errors.recaptcha_token}</p>
                    )}

                    <div className="flex items-center gap-3">
                        <span className="h-px flex-1 bg-gray-200" />
                        <span className="text-xs uppercase tracking-wider text-gray-400">
                            or
                        </span>
                        <span className="h-px flex-1 bg-gray-200" />
                    </div>

                    <a
                        href={route('auth.google.redirect')}
                        className="flex w-full items-center justify-center gap-3 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
                    >
                        <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true">
                            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
                            <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
                            <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
                            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
                        </svg>
                        Sign up with Google
                    </a>

                    <p className="text-center text-sm text-gray-500">
                        Already have an account?{' '}
                        <button
                            type="button"
                            onClick={onSwitchToLogin}
                            className="font-medium text-brand hover:underline cursor-pointer"
                        >
                            Sign In
                        </button>
                    </p>
                </form>
            </DialogContent>
        </Dialog>
    );
}
