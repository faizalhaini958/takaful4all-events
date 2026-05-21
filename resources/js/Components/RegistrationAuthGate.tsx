import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';
import { LogIn, UserPlus, Ticket, History, QrCode, Zap } from 'lucide-react';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSignIn: () => void;
    onCreateAccount: () => void;
    onContinueAsGuest: () => void;
}

const BENEFITS = [
    { icon: Zap,     text: 'Auto-fill your info on every registration' },
    { icon: History, text: 'View all your bookings in one place' },
    { icon: QrCode,  text: 'Access your QR ticket from your dashboard' },
    { icon: Ticket,  text: 'Faster checkout next time' },
];

export default function RegistrationAuthGate({ open, onOpenChange, onSignIn, onCreateAccount, onContinueAsGuest }: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="text-center sm:text-center">
                    <div className="mx-auto mb-2 w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center">
                        <Ticket className="w-6 h-6 text-brand" />
                    </div>
                    <DialogTitle className="text-xl">Almost there!</DialogTitle>
                    <DialogDescription>
                        Sign in to save this booking to your account, or continue as a guest.
                    </DialogDescription>
                </DialogHeader>

                {/* Benefits */}
                <div className="rounded-xl bg-brand/5 border border-brand/10 p-4 space-y-2.5 my-1">
                    {BENEFITS.map(({ icon: Icon, text }) => (
                        <div key={text} className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-muted-foreground">
                            <div className="w-7 h-7 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0">
                                <Icon className="w-3.5 h-3.5 text-brand" />
                            </div>
                            {text}
                        </div>
                    ))}
                </div>

                {/* CTAs */}
                <div className="space-y-2.5">
                    <Button className="w-full" onClick={onSignIn}>
                        <LogIn className="w-4 h-4 mr-2" />
                        Sign In
                    </Button>
                    <Button variant="outline" className="w-full" onClick={onCreateAccount}>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Create Account
                    </Button>
                    <div className="text-center pt-1">
                        <button
                            type="button"
                            onClick={onContinueAsGuest}
                            className="text-sm text-gray-500 hover:text-gray-700 dark:text-muted-foreground dark:hover:text-foreground hover:underline transition-colors"
                        >
                            Continue as Guest
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
