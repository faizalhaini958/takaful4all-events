import { router } from '@inertiajs/react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type PropsWithChildren, useEffect, useState } from 'react';

// Only these areas may use dark mode; every other (public) page is forced to light.
const DARK_CAPABLE_PREFIXES = ['/admin', '/dashboard'];

const isDarkCapable = (path: string) =>
    DARK_CAPABLE_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));

const currentPath = () => (typeof window === 'undefined' ? '/' : window.location.pathname);

export function ThemeProvider({ children }: PropsWithChildren) {
    const [path, setPath] = useState(currentPath);

    useEffect(() => router.on('navigate', () => setPath(currentPath())), []);

    return (
        <NextThemesProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
            forcedTheme={isDarkCapable(path) ? undefined : 'light'}
        >
            {children}
        </NextThemesProvider>
    );
}
