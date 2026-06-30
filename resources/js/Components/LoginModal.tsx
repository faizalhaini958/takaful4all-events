import { useForm } from '@inertiajs/react';
import { type FormEventHandler, useRef } from 'react';
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
import { LogIn, Loader2 } from 'lucide-react';

interface LoginModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSwitchToRegister: () => void;
    onSwitchToForgotPassword: () => void;
    returnTo?: string;
}

export default function LoginModal({ open, onOpenChange, onSwitchToRegister, onSwitchToForgotPassword, returnTo }: LoginModalProps) {
    const { executeRecaptcha } = useGoogleReCaptcha();
    const tokenRef = useRef('');
    const { data, setData, post, processing, errors, reset, transform } = useForm({
        email: '',
        password: '',
        remember: false as boolean,
        recaptcha_token: '',
        return_to: '',
    });

    transform(d => ({ ...d, recaptcha_token: tokenRef.current, return_to: returnTo ?? '' }));

    const submit: FormEventHandler = async (e) => {
        e.preventDefault();

        if (executeRecaptcha) {
            try {
                tokenRef.current = await executeRecaptcha('login');
            } catch {
                // reCAPTCHA not available (no key configured), continue without token
            }
        }

        post(route('login'), {
            onFinish: () => reset('password'),
            onSuccess: () => onOpenChange(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="text-center sm:text-center">
                    <div className="mx-auto mb-2 w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center">
                        <LogIn className="w-6 h-6 text-brand" />
                    </div>
                    <DialogTitle className="text-xl">Welcome back</DialogTitle>
                    <DialogDescription>
                        Sign in to your account to continue.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-4 mt-2">
                    <div className="space-y-2">
                        <Label htmlFor="login-email">Email</Label>
                        <Input
                            id="login-email"
                            type="email"
                            placeholder="you@example.com"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            autoComplete="username"
                            autoFocus
                            required
                        />
                        {errors.email && (
                            <p className="text-sm text-red-600">{errors.email}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="login-password">Password</Label>
                            <button
                                type="button"
                                onClick={onSwitchToForgotPassword}
                                className="text-xs text-brand hover:underline cursor-pointer"
                            >
                                Forgot password?
                            </button>
                        </div>
                        <Input
                            id="login-password"
                            type="password"
                            placeholder="••••••••"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            autoComplete="current-password"
                            required
                        />
                        {errors.password && (
                            <p className="text-sm text-red-600">{errors.password}</p>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            id="login-remember"
                            type="checkbox"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                            className="rounded border-gray-300 dark:border-border text-brand shadow-sm focus:ring-brand dark:bg-card"
                        />
                        <Label htmlFor="login-remember" className="text-sm font-normal text-gray-500 dark:text-muted-foreground cursor-pointer">
                            Remember me
                        </Label>
                    </div>

                    <Button type="submit" className="w-full" disabled={processing}>
                        {processing ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Signing in…
                            </>
                        ) : (
                            'Sign In'
                        )}
                    </Button>
                    {errors.recaptcha_token && (
                        <p className="text-sm text-red-600 text-center">{errors.recaptcha_token}</p>
                    )}

                    <div className="flex items-center gap-3">
                        <span className="h-px flex-1 bg-gray-200 dark:bg-border" />
                        <span className="text-xs uppercase tracking-wider text-gray-400 dark:text-muted-foreground">
                            or
                        </span>
                        <span className="h-px flex-1 bg-gray-200 dark:bg-border" />
                    </div>

                    <a
                        href={route('auth.google.redirect') + (returnTo ? `?return_to=${encodeURIComponent(returnTo)}` : '')}
                        className="flex w-full items-center justify-center gap-3 rounded-md border border-gray-300 dark:border-border bg-white dark:bg-card px-4 py-2 text-sm font-medium text-gray-700 dark:text-foreground shadow-sm transition hover:bg-gray-50 dark:hover:bg-muted focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
                    >
                        <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true">
                            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
                            <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
                            <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
                            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
                        </svg>
                        Continue with Google
                    </a>

                    <p className="text-center text-sm text-gray-500 dark:text-muted-foreground">
                        Don&apos;t have an account?{' '}
                        <button
                            type="button"
                            onClick={onSwitchToRegister}
                            className="font-medium text-brand hover:underline cursor-pointer"
                        >
                            Register
                        </button>
                    </p>
                </form>
            </DialogContent>
        </Dialog>
    );
}
