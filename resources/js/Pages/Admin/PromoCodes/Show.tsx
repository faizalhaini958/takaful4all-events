import AdminLayout from '@/Layouts/AdminLayout';
import { Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Separator } from '@/Components/ui/separator';
import { ArrowLeft, Hash, Ticket, Percent, DollarSign, Users, Target, ShoppingCart } from 'lucide-react';
import { type PaginatedData } from '@/types';

interface PromoCode {
    id: number;
    code: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    max_uses: number | null;
    used_count: number;
    max_uses_per_user: number | null;
    min_order_amount: number | null;
    event_id: number | null;
    event?: { id: number; title: string } | null;
    starts_at: string | null;
    expires_at: string | null;
    is_active: boolean;
    creator?: { id: number; name: string } | null;
    created_at: string;
}

interface RegistrationDetail {
    id: number;
    reference_no: string;
    name: string;
    email: string;
    promo_code_discount: number;
    total_amount: number;
    status: string;
    created_at: string;
    event?: { id: number; title: string; slug: string } | null;
    ticket?: { id: number; name: string } | null;
}

interface Props {
    promo_code: PromoCode;
    registrations: PaginatedData<RegistrationDetail>;
    total_discount: number;
    redemption_count: number;
}

const STATUS: Record<string, string> = {
    confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    attended: 'bg-blue-50 text-blue-700 border-blue-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    awaiting_payment: 'bg-orange-50 text-orange-700 border-orange-200',
    cancelled: 'bg-red-50 text-red-600 border-red-200',
    waitlisted: 'bg-purple-50 text-purple-700 border-purple-200',
};

function myr(n: number | string) { return `RM ${Number(n).toFixed(2)}`; }
function fmt(d: string) { return new Date(d).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' }); }
function fmtdt(d: string) { return new Date(d).toLocaleString('en-MY', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }

export default function PromoCodeShow({ promo_code, registrations, total_discount, redemption_count }: Props) {

    const expired = promo_code.expires_at && new Date(promo_code.expires_at) < new Date();
    const upcoming = promo_code.starts_at && new Date(promo_code.starts_at) > new Date();
    const exhausted = promo_code.max_uses !== null && promo_code.used_count >= promo_code.max_uses;
    const pct = promo_code.max_uses ? Math.min(100, (promo_code.used_count / promo_code.max_uses) * 100) : 0;

    return (
        <AdminLayout>
            <div className="space-y-5 sm:space-y-6">
                <Link href="/admin/promo-codes" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Promo Codes
                </Link>

                {/* Header */}
                <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <h1 className="text-xl sm:text-2xl font-bold font-mono tracking-wide">{promo_code.code}</h1>
                        {!promo_code.is_active ? <Badge variant="secondary">Inactive</Badge>
                        : expired ? <Badge className="bg-red-50 text-red-600 border-red-200 hover:bg-red-50">Expired</Badge>
                        : upcoming ? <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50">Upcoming</Badge>
                        : exhausted ? <Badge className="bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-50">Exhausted</Badge>
                        : <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50">Active</Badge>}
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                            {promo_code.discount_type === 'percentage'
                                ? <><Percent className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> {promo_code.discount_value}% off</>
                                : <><DollarSign className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> {myr(promo_code.discount_value)} off</>}
                        </span>
                        <span className="hidden sm:inline">·</span>
                        <span className="flex items-center gap-1"><Target className="w-3 h-3 sm:w-3.5 sm:h-3.5" />{promo_code.event ? promo_code.event.title : 'All events'}</span>
                        {promo_code.creator && <><span className="hidden sm:inline">·</span><span className="hidden sm:inline">by {promo_code.creator.name} on {fmt(promo_code.created_at)}</span></>}
                    </div>
                </div>

                <Separator />

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <Card className="border-l-2 border-l-brand">
                        <CardContent className="p-3 sm:p-4">
                            <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                                <Hash className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand" />
                                <p className="text-[11px] sm:text-xs text-muted-foreground font-medium">Usage</p>
                            </div>
                            <p className="text-lg sm:text-xl font-semibold tabular-nums">
                                {promo_code.used_count}<span className="text-xs sm:text-sm font-normal text-muted-foreground"> / {promo_code.max_uses ?? '∞'}</span>
                            </p>
                            {promo_code.max_uses && (
                                <div className="mt-1.5 sm:mt-2 w-full bg-muted rounded-full h-1">
                                    <div className="bg-foreground/25 h-1 rounded-full" style={{ width: `${pct}%` }} />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    <Card className="border-l-2 border-l-emerald-500">
                        <CardContent className="p-3 sm:p-4">
                            <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                                <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                                <p className="text-[11px] sm:text-xs text-muted-foreground font-medium">Redemptions</p>
                            </div>
                            <p className="text-lg sm:text-xl font-semibold tabular-nums">{redemption_count}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-l-2 border-l-emerald-500">
                        <CardContent className="p-3 sm:p-4">
                            <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                                <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                                <p className="text-[11px] sm:text-xs text-muted-foreground font-medium">Discounted</p>
                            </div>
                            <p className="text-lg sm:text-xl font-semibold tabular-nums text-emerald-600">{myr(total_discount)}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-l-2 border-l-amber-500">
                        <CardContent className="p-3 sm:p-4">
                            <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" />
                                <p className="text-[11px] sm:text-xs text-muted-foreground font-medium">Per user</p>
                            </div>
                            <p className="text-lg sm:text-xl font-semibold tabular-nums">{promo_code.max_uses_per_user ?? '—'}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Details row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <Card>
                        <CardContent className="p-3 sm:p-4">
                            <p className="text-[11px] sm:text-xs text-muted-foreground mb-1">Min order</p>
                            <p className="font-semibold text-sm">{promo_code.min_order_amount != null ? myr(promo_code.min_order_amount) : 'None'}</p>
                        </CardContent>
                    </Card>
                    {promo_code.starts_at && (
                        <Card>
                            <CardContent className="p-3 sm:p-4">
                                <p className="text-[11px] sm:text-xs text-muted-foreground mb-1">{upcoming ? 'Starts' : 'Started'}</p>
                                <p className="font-semibold text-xs sm:text-sm">{fmtdt(promo_code.starts_at)}</p>
                            </CardContent>
                        </Card>
                    )}
                    {promo_code.expires_at && (
                        <Card>
                            <CardContent className="p-3 sm:p-4">
                                <p className="text-[11px] sm:text-xs text-muted-foreground mb-1">{expired ? 'Expired' : 'Expires'}</p>
                                <p className={`font-semibold text-xs sm:text-sm ${expired ? 'text-red-600' : ''}`}>{fmtdt(promo_code.expires_at)}</p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Redemptions */}
                <Card>
                    <CardHeader className="pb-3 px-4 sm:px-6">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Ticket className="w-4 h-4" /> Redemptions
                                <span className="text-muted-foreground font-normal">({registrations.total})</span>
                            </CardTitle>
                        </div>
                    </CardHeader>
                    <Separator />
                    <CardContent className="p-0">
                        {registrations.data.length === 0 ? (
                            <div className="py-12 text-center text-sm text-muted-foreground">No redemptions yet.</div>
                        ) : (
                            <>
                                {/* Desktop table */}
                                <div className="hidden sm:block overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b bg-muted/30">
                                                <th className="py-2.5 px-4 text-left text-xs font-medium text-muted-foreground">Reference</th>
                                                <th className="py-2.5 px-4 text-left text-xs font-medium text-muted-foreground">Attendee</th>
                                                <th className="py-2.5 px-4 text-left text-xs font-medium text-muted-foreground">Event</th>
                                                <th className="py-2.5 px-4 text-right text-xs font-medium text-muted-foreground">Discount</th>
                                                <th className="py-2.5 px-4 text-right text-xs font-medium text-muted-foreground">Paid</th>
                                                <th className="py-2.5 px-4 text-center text-xs font-medium text-muted-foreground">Status</th>
                                                <th className="py-2.5 px-4 text-right text-xs font-medium text-muted-foreground">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {registrations.data.map(reg => (
                                                <tr key={reg.id} className="hover:bg-muted/30">
                                                    <td className="py-2.5 px-4">
                                                        <Link href={reg.event ? `/admin/events/${reg.event.slug}/registrations/${reg.id}` : '#'}
                                                            className="font-mono text-xs hover:text-brand transition-colors">
                                                            {reg.reference_no}
                                                        </Link>
                                                    </td>
                                                    <td className="py-2.5 px-4">
                                                        <p className="font-medium">{reg.name}</p>
                                                        <p className="text-xs text-muted-foreground">{reg.email}</p>
                                                    </td>
                                                    <td className="py-2.5 px-4 text-xs text-muted-foreground">{reg.event?.title ?? '—'}</td>
                                                    <td className="py-2.5 px-4 text-right tabular-nums text-emerald-600">-{myr(reg.promo_code_discount)}</td>
                                                    <td className="py-2.5 px-4 text-right tabular-nums">{myr(reg.total_amount)}</td>
                                                    <td className="py-2.5 px-4">
                                                        <div className="flex justify-center">
                                                            <span className={`text-xs px-2 py-0.5 rounded border ${STATUS[reg.status] ?? 'bg-gray-50 dark:bg-muted text-gray-600 dark:text-muted-foreground border-gray-200 dark:border-border'}`}>
                                                                {reg.status.replace('_', ' ')}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-2.5 px-4 text-right text-xs text-muted-foreground">{fmt(reg.created_at)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile cards */}
                                <div className="sm:hidden divide-y">
                                    {registrations.data.map(reg => (
                                        <div key={reg.id} className="p-4 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Link href={reg.event ? `/admin/events/${reg.event.slug}/registrations/${reg.id}` : '#'}
                                                    className="font-mono text-xs font-medium hover:text-brand transition-colors">
                                                    {reg.reference_no}
                                                </Link>
                                                <span className={`text-[10px] px-2 py-0.5 rounded border ${STATUS[reg.status] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                                    {reg.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{reg.name}</p>
                                                <p className="text-xs text-muted-foreground">{reg.email}</p>
                                            </div>
                                            {reg.event && (
                                                <p className="text-xs text-muted-foreground">{reg.event.title}</p>
                                            )}
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-emerald-600 font-medium">-{myr(reg.promo_code_discount)}</span>
                                                <span className="font-medium">{myr(reg.total_amount)}</span>
                                                <span className="text-xs text-muted-foreground">{fmt(reg.created_at)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {registrations.last_page > 1 && (
                                    <div className="flex items-center justify-between px-4 py-3 border-t">
                                        <p className="text-xs text-muted-foreground">{registrations.from}–{registrations.to} of {registrations.total}</p>
                                        <div className="flex items-center gap-0.5">
                                            {registrations.links.filter(l => l.url).map((link, i) => (
                                                <Link key={i} href={link.url || '#'}
                                                    className={`px-2.5 py-1.5 text-xs rounded font-medium ${link.active ? 'bg-foreground text-background' : 'hover:bg-muted text-muted-foreground'}`}
                                                    dangerouslySetInnerHTML={{ __html: link.label }} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
