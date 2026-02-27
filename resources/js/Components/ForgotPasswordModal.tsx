import { useForm } from '@inertiajs/react';
import { type FormEventHandler, useState } from 'react';
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
import { KeyRound, Loader2, CheckCircle } from 'lucide-react';

interface ForgotPasswordModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSwitchToLogin: () => void;
}

export default function ForgotPasswordModal({ open, onOpenChange, onSwitchToLogin }: ForgotPasswordModalProps) {
    const [status, setStatus] = useState<string | null>(null);
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('password.email'), {
            onSuccess: (page) => {
                const flashStatus = (page.props as Record<string, unknown>).status as string | undefined;
                if (flashStatus) {
                    setStatus(flashStatus);
                } else {
                    setStatus('We have emailed your password reset link.');
                }
                reset('email');
            },
        });
    };

    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) {
            setStatus(null);
            reset('email');
        }
        onOpenChange(isOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="text-center sm:text-center">
                    <div className="mx-auto mb-2 w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center">
                        <KeyRound className="w-6 h-6 text-brand" />
                    </div>
                    <DialogTitle className="text-xl">Reset Password</DialogTitle>
                    <DialogDescription>
                        Enter your email address and we&apos;ll send you a link to reset your password.
                    </DialogDescription>
                </DialogHeader>

                {status && (
                    <div className="flex items-start gap-2 rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-700">
                        <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{status}</span>
                    </div>
                )}

                <form onSubmit={submit} className="space-y-4 mt-2">
                    <div className="space-y-2">
                        <Label htmlFor="forgot-email">Email</Label>
                        <Input
                            id="forgot-email"
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

                    <Button type="submit" className="w-full" disabled={processing}>
                        {processing ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Sending…
                            </>
                        ) : (
                            'Email Password Reset Link'
                        )}
                    </Button>

                    <p className="text-center text-sm text-gray-500">
                        Remember your password?{' '}
                        <button
                            type="button"
                            onClick={onSwitchToLogin}
                            className="font-medium text-brand hover:underline cursor-pointer"
                        >
                            Back to Sign In
                        </button>
                    </p>
                </form>
            </DialogContent>
        </Dialog>
    );
}
