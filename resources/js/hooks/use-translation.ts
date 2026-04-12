import { usePage } from '@inertiajs/react';
import { useCallback } from 'react';

interface TranslationProps {
    translations: Record<string, string>;
    locale: string;
    availableLocales: Array<{ code: string; name: string }>;
}

export function useTranslation() {
    const { translations, locale, availableLocales } = usePage().props as unknown as TranslationProps;

    const t = useCallback(
        (key: string, replacements?: Record<string, string | number>): string => {
            let value = translations?.[key] ?? key;

            if (replacements) {
                Object.entries(replacements).forEach(([k, v]) => {
                    value = value.replace(`:${k}`, String(v));
                });
            }

            return value;
        },
        [translations],
    );

    return { t, locale: locale ?? 'en', availableLocales: availableLocales ?? [] };
}
