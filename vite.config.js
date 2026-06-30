import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.tsx',
            refresh: true,
        }),
        react(),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'resources/js'),
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        if (id.includes('recharts')) return 'vendor-recharts';
                        if (id.includes('jspdf') || id.includes('html2canvas')) return 'vendor-pdf';
                        if (id.includes('html5-qrcode')) return 'vendor-qrcode';
                        if (id.includes('@tiptap')) return 'vendor-tiptap';
                        if (id.includes('embla-carousel')) return 'vendor-embla';
                        if (id.includes('react-google-recaptcha')) return 'vendor-recaptcha';
                        if (id.includes('lucide-react') || id.includes('@radix-ui') || id.includes('@headlessui')) return 'vendor-ui';
                        if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler') || id.includes('@inertiajs')) return 'vendor-framework';
                    }
                },
            },
        },
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./resources/js/__tests__/setup.ts'],
        include: ['resources/js/**/*.{test,spec}.{ts,tsx}'],
        css: false,
    },
});
