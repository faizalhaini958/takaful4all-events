import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Badge } from '@/Components/ui/badge';
import { Link } from '@inertiajs/react';
import { useState, useRef } from 'react';
import { ChevronLeft, QrCode, Search, CheckCircle2, XCircle, AlertCircle, UserCheck } from 'lucide-react';
import { type Event } from '@/types';
import { registrationStatusBadge, paymentStatusBadge } from '@/lib/status-colors';

interface Props {
    event: Event;
}

interface LookupResult {
    id: number;
    reference_no: string;
    name: string;
    email: string;
    phone: string | null;
    company: string | null;
    ticket: string | null;
    quantity: number;
    status: string;
    payment_status: string;
    checked_in_at: string | null;
}

type MessageType = 'success' | 'error' | 'warning';

export default function EventCheckIn({ event }: Props) {
    const [reference, setReference] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<LookupResult | null>(null);
    const [message, setMessage] = useState<{ type: MessageType; text: string } | null>(null);
    const [checkedInCount, setCheckedInCount] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    async function handleLookup(e?: React.FormEvent) {
        e?.preventDefault();
        if (!reference.trim()) return;

        setLoading(true);
        setMessage(null);
        setResult(null);

        try {
            const res = await fetch(`/admin/events/${event.slug}/check-in/lookup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ reference: reference.trim() }),
            });

            const data = await res.json();

            if (data.found) {
                setResult(data.registration);
                if (data.registration.checked_in_at) {
                    setMessage({ type: 'warning', text: `Already checked in at ${new Date(data.registration.checked_in_at).toLocaleTimeString()}` });
                }
            } else {
                setMessage({ type: 'error', text: data.message || 'Registration not found.' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Failed to look up registration. Please try again.' });
        } finally {
            setLoading(false);
        }
    }

    async function handleCheckIn() {
        if (!result) return;

        setLoading(true);
        try {
            const res = await fetch(`/admin/events/${event.slug}/check-in/confirm`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ reference: result.reference_no }),
            });

            const data = await res.json();

            if (data.success) {
                setMessage({ type: 'success', text: data.message });
                setResult(prev => prev ? { ...prev, checked_in_at: new Date().toISOString(), status: 'attended' } : null);
                setCheckedInCount(c => c + 1);

                // Auto-clear after 3 seconds for next scan
                setTimeout(() => {
                    setReference('');
                    setResult(null);
                    setMessage(null);
                    inputRef.current?.focus();
                }, 3000);
            } else {
                setMessage({ type: 'error', text: data.message });
            }
        } catch {
            setMessage({ type: 'error', text: 'Check-in failed. Please try again.' });
        } finally {
            setLoading(false);
        }
    }

    // Extract reference from QR URL (handles full URLs like /events/.../confirmation/EVT-...)
    function parseInput(value: string): string {
        const match = value.match(/confirmation\/(EVT-[A-Z0-9-]+)/i);
        return match ? match[1] : value;
    }

    function handleInputChange(value: string) {
        const parsed = parseInput(value);
        setReference(parsed);
    }

    const msgIcon = {
        success: <CheckCircle2 className="w-5 h-5" />,
        error: <XCircle className="w-5 h-5" />,
        warning: <AlertCircle className="w-5 h-5" />,
    };

    const msgColor = {
        success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
        error: 'bg-red-50 border-red-200 text-red-800',
        warning: 'bg-amber-50 border-amber-200 text-amber-800',
    };

    return (
        <AdminLayout>
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <Link href={`/admin/events/${event.slug}/edit`} className="text-muted-foreground hover:text-foreground transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-foreground">Event Check-In</h1>
                        <p className="text-sm text-muted-foreground">{event.title}</p>
                    </div>
                    {checkedInCount > 0 && (
                        <Badge variant="secondary" className="text-sm">
                            <UserCheck className="w-4 h-4 mr-1" /> {checkedInCount} checked in
                        </Badge>
                    )}
                </div>

                {/* Scanner Input */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <QrCode className="w-5 h-5" /> Scan or Enter Reference
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLookup} className="flex gap-2">
                            <Input
                                ref={inputRef}
                                value={reference}
                                onChange={e => handleInputChange(e.target.value)}
                                placeholder="Scan QR code or type reference number (e.g. EVT-20260410-ABCD)"
                                className="flex-1 text-lg"
                                autoFocus
                            />
                            <Button type="submit" disabled={loading || !reference.trim()}>
                                <Search className="w-4 h-4 mr-1" /> Look Up
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Message */}
                {message && (
                    <div className={`p-4 rounded-lg border flex items-start gap-2 ${msgColor[message.type]}`}>
                        {msgIcon[message.type]}
                        <p className="font-medium">{message.text}</p>
                    </div>
                )}

                {/* Result */}
                {result && (
                    <Card>
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-xl font-bold">{result.name}</h3>
                                    <p className="text-sm text-muted-foreground">{result.email}</p>
                                    {result.phone && <p className="text-sm text-muted-foreground">{result.phone}</p>}
                                </div>
                                <div className="flex gap-2">
                                    <Badge {...registrationStatusBadge(result.status as any)}>
                                        {result.status}
                                    </Badge>
                                    <Badge {...paymentStatusBadge(result.payment_status as any)}>
                                        {result.payment_status}
                                    </Badge>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm border-t pt-4">
                                <div>
                                    <p className="text-muted-foreground">Reference</p>
                                    <p className="font-mono font-medium">{result.reference_no}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Ticket</p>
                                    <p className="font-medium">{result.ticket ?? '—'}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Attendees</p>
                                    <p className="font-medium">{result.quantity}</p>
                                </div>
                                {result.company && (
                                    <div>
                                        <p className="text-muted-foreground">Company</p>
                                        <p className="font-medium">{result.company}</p>
                                    </div>
                                )}
                            </div>

                            {!result.checked_in_at && result.status !== 'cancelled' && (
                                <Button
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-lg py-6"
                                    onClick={handleCheckIn}
                                    disabled={loading}
                                >
                                    <CheckCircle2 className="w-5 h-5 mr-2" />
                                    {loading ? 'Processing…' : 'Confirm Check-In'}
                                </Button>
                            )}

                            {result.checked_in_at && (
                                <div className="w-full text-center p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                                    <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-600 mb-2" />
                                    <p className="font-semibold text-emerald-800">Checked In</p>
                                    <p className="text-sm text-emerald-600">
                                        {new Date(result.checked_in_at).toLocaleString()}
                                    </p>
                                </div>
                            )}

                            {result.status === 'cancelled' && (
                                <div className="w-full text-center p-4 bg-red-50 rounded-lg border border-red-200">
                                    <XCircle className="w-8 h-8 mx-auto text-red-600 mb-2" />
                                    <p className="font-semibold text-red-800">Registration Cancelled</p>
                                    <p className="text-sm text-red-600">This registration has been cancelled and cannot be checked in.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </AdminLayout>
    );
}
