import { router, usePage } from '@inertiajs/react';
import { Globe } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { Button } from '@/Components/ui/button';

interface LocaleInfo {
    code: string;
    name: string;
}

export default function LanguageSwitcher() {
    const { locale, availableLocales } = usePage().props as unknown as {
        locale: string;
        availableLocales: LocaleInfo[];
    };

    const locales: LocaleInfo[] = availableLocales?.length
        ? availableLocales
        : [
              { code: 'en', name: 'English' },
              { code: 'ms', name: 'Bahasa Melayu' },
          ];

    const current = locales.find((l) => l.code === locale) ?? locales[0];

    function switchLocale(code: string) {
        if (code === locale) return;
        router.post(route('locale.switch', { lang: code }), {}, { preserveScroll: true });
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs uppercase tracking-wide">
                    <Globe className="h-4 w-4" />
                    {current.code.toUpperCase()}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {locales.map((l) => (
                    <DropdownMenuItem
                        key={l.code}
                        onClick={() => switchLocale(l.code)}
                        className={l.code === locale ? 'font-semibold' : ''}
                    >
                        {l.name}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
