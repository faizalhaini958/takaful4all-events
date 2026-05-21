import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@/Components/ThemeProvider';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';
const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY ?? '';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <ThemeProvider>
                <GoogleReCaptchaProvider reCaptchaKey={recaptchaSiteKey}>
                    <App {...props} />
                </GoogleReCaptchaProvider>
            </ThemeProvider>
        );
    },
    progress: {
        color: '#009FBB',
    },
});

