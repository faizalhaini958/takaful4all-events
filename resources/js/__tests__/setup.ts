import '@testing-library/jest-dom/vitest';

// Mock Inertia's usePage to provide default shared props
vi.mock('@inertiajs/react', async () => {
    const actual = await vi.importActual<typeof import('@inertiajs/react')>('@inertiajs/react');
    return {
        ...actual,
        usePage: vi.fn(() => ({
            props: {
                auth: { user: null },
                flash: {},
                ziggy: { url: 'http://localhost', port: null, defaults: {}, routes: {} },
            },
            url: '/',
            component: '',
            version: '',
            scrollRegions: [],
            rememberedState: {},
            resolvedErrors: {},
            clearHistory: false,
            encryptHistory: false,
        })),
        Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => {
            const React = require('react');
            return React.createElement('a', { href, ...rest }, children);
        },
        useForm: vi.fn((initialValues: Record<string, unknown>) => {
            let formData = { ...initialValues };
            return {
                data: formData,
                setData: vi.fn((key: string | Function, value?: unknown) => {
                    if (typeof key === 'function') {
                        formData = key(formData);
                    } else if (typeof key === 'string') {
                        formData = { ...formData, [key]: value };
                    }
                }),
                post: vi.fn(),
                put: vi.fn(),
                delete: vi.fn(),
                processing: false,
                errors: {},
                reset: vi.fn(() => { formData = { ...initialValues }; }),
                clearErrors: vi.fn(),
            };
        }),
        router: {
            get: vi.fn(),
            post: vi.fn(),
            put: vi.fn(),
            patch: vi.fn(),
            delete: vi.fn(),
            visit: vi.fn(),
        },
    };
});

// Mock axios
vi.mock('axios', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        patch: vi.fn(),
        create: vi.fn(),
    },
}));
