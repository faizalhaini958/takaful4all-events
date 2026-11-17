// Currencies tickets can be priced in. Keep in sync with App\Models\EventTicket::CURRENCIES.
export const CURRENCIES: Record<string, { symbol: string; label: string }> = {
    MYR: { symbol: 'RM', label: 'MYR – Malaysian Ringgit' },
    USD: { symbol: 'US$', label: 'USD – US Dollar' },
};

export const DEFAULT_CURRENCY = 'MYR';

export function currencySymbol(currency?: string | null): string {
    const code = currency ?? DEFAULT_CURRENCY;
    return CURRENCIES[code]?.symbol ?? code;
}

/** "RM 75.00", "US$ 20.00" */
export function formatMoney(amount: number | string, currency?: string | null): string {
    return `${currencySymbol(currency)} ${Number(amount).toFixed(2)}`;
}

/**
 * One line summarising ticket prices, grouped per currency so MYR and USD are never mixed:
 * "RM 75.00 – RM 130.00 · US$ 20.00"
 */
export function formatPriceRange(prices: Array<{ amount: number; currency?: string | null }>): string {
    const byCurrency = new Map<string, number[]>();
    prices.forEach(({ amount, currency }) => {
        const code = currency ?? DEFAULT_CURRENCY;
        byCurrency.set(code, [...(byCurrency.get(code) ?? []), amount]);
    });

    return [...byCurrency.entries()]
        .sort(([a], [b]) => (a === DEFAULT_CURRENCY ? -1 : b === DEFAULT_CURRENCY ? 1 : a.localeCompare(b)))
        .map(([code, amounts]) => {
            const min = Math.min(...amounts);
            const max = Math.max(...amounts);
            return min === max ? formatMoney(min, code) : `${formatMoney(min, code)} – ${formatMoney(max, code)}`;
        })
        .join(' · ');
}
