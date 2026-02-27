import { useForm } from '@inertiajs/react';
import { type FormEventHandler } from 'react';
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
}

export default function LoginModal({ open, onOpenChange, onSwitchToRegister, onSwitchToForgotPassword }: LoginModalProps) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false as boolean,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

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
                            className="rounded border-gray-300 text-brand shadow-sm focus:ring-brand"
                        />
                        <Label htmlFor="login-remember" className="text-sm font-normal text-gray-500 cursor-pointer">
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

                    <p className="text-center text-sm text-gray-500">
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
