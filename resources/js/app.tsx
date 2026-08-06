import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { Inertia } from '@inertiajs/inertia';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@/Components/ThemeProvider';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);
        // Send GA4 `page_view` on Inertia client-side navigation
        const sendPageView = () => {
            try {
                if (window && (window as any).gtag) {
                    (window as any).gtag('event', 'page_view', {
                        page_location: window.location.href,
                        page_path: window.location.pathname,
                        page_title: document.title,
                    });
                }
            } catch (e) {
                // ignore
            }
        };

        Inertia.on('navigate', sendPageView);

        root.render(
            <ThemeProvider>
                <App {...props} />
            </ThemeProvider>
        );
    },
    progress: {
        color: '#1C7C93',
    },
});

