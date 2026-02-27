import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

export default function Guest({ children }: PropsWithChildren) {
    return (
        <div className="flex min-h-screen flex-col items-center bg-muted pt-6 sm:justify-center sm:pt-0">
            <div>
                <Link href="/">
                    <img src="/images/logo.png" alt="Takaful4All" className="h-12 w-auto dark:brightness-200 dark:invert" />
                </Link>
            </div>

            <div className="mt-6 w-full overflow-hidden bg-card border border-border px-6 py-4 shadow-md sm:max-w-md sm:rounded-lg">
                {children}
            </div>
        </div>
    );
}
