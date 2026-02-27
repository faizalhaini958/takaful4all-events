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
import { UserPlus, Loader2 } from 'lucide-react';

interface RegisterModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSwitchToLogin: () => void;
}

export default function RegisterModal({ open, onOpenChange, onSwitchToLogin }: RegisterModalProps) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

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
