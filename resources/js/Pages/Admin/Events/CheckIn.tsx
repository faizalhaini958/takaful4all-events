import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Badge } from '@/Components/ui/badge';
import { Link } from '@inertiajs/react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, QrCode, Search, CheckCircle2, XCircle, AlertCircle, UserCheck, Camera, Keyboard, Video, VideoOff } from 'lucide-react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
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
type ScanMode = 'manual' | 'camera';

export default function EventCheckIn({ event }: Props) {
    const [reference, setReference] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<LookupResult | null>(null);
    const [message, setMessage] = useState<{ type: MessageType; text: string } | null>(null);
    const [checkedInCount, setCheckedInCount] = useState(0);
    const [scanMode, setScanMode] = useState<ScanMode>('manual');
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const scannerContainerId = 'qr-reader';
    // Guard to prevent double-lookup from rapid scans
    const lookupInProgress = useRef(false);

    // Extract reference from QR URL (handles full URLs like /events/.../confirmation/EVT-...)
    const parseInput = useCallback((value: string): string => {
        const match = value.match(/confirmation\/(EVT-[A-Z0-9-]+)/i);
        return match ? match[1] : value;
    }, []);

    const doLookup = useCallback(async (ref: string) => {
        if (!ref.trim() || lookupInProgress.current) return;

        lookupInProgress.current = true;
        setLoading(true);
        setMessage(null);
        setResult(null);
        setReference(ref);

        try {
            const res = await fetch(`/admin/events/${event.slug}/check-in/lookup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ reference: ref.trim() }),
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
            lookupInProgress.current = false;
        }
    }, [event.slug]);

    async function handleLookup(e?: React.FormEvent) {
        e?.preventDefault();
        await doLookup(reference);
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
                    if (scanMode === 'manual') {
                        inputRef.current?.focus();
                    }
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

    function handleInputChange(value: string) {
        const parsed = parseInput(value);
        setReference(parsed);
    }

    // ── Camera scanner management ──

    const stopCamera = useCallback(async () => {
        const scanner = scannerRef.current;
        if (scanner) {
            try {
                const state = scanner.getState();
                if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
                    await scanner.stop();
                }
            } catch {
                // ignore stop errors
            }
            try {
                scanner.clear();
            } catch {
                // ignore clear errors
            }
            scannerRef.current = null;
        }
        setCameraActive(false);
    }, []);

    const startCamera = useCallback(async () => {
        setCameraError(null);

        // Ensure any previous scanner is fully stopped
        if (scannerRef.current) {
            try { await scannerRef.current.stop(); } catch { /* */ }
            try { scannerRef.current.clear(); } catch { /* */ }
            scannerRef.current = null;
        }

        // Show container first so it has dimensions before camera starts
        setCameraActive(true);

        // Give DOM time to render the visible container
        await new Promise(r => setTimeout(r, 300));

        const container = document.getElementById(scannerContainerId);
        if (!container) {
            setCameraError('Scanner container not found.');
            setCameraActive(false);
            return;
        }

        try {
            const scanner = new Html5Qrcode(scannerContainerId);
            scannerRef.current = scanner;

            await scanner.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                (decodedText) => {
                    const parsed = parseInput(decodedText);
                    doLookup(parsed);
                },
                () => {
                    // ignore scan failures (no QR in frame)
                },
            );
        } catch (err: any) {
            const msg = typeof err === 'string' ? err : err?.message ?? 'Unknown error';
            if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
                setCameraError('Camera permission denied. Please allow camera access in your browser settings and try again.');
            } else if (msg.includes('NotFoundError') || msg.includes('no camera')) {
                setCameraError('No camera found on this device.');
            } else if (msg.includes('NotReadableError') || msg.includes('in use')) {
                setCameraError('Camera is already in use by another app. Close other camera apps and try again.');
            } else {
                setCameraError(`Camera error: ${msg}`);
            }
            scannerRef.current = null;
            setCameraActive(false);
        }
    }, [parseInput, doLookup]);

    // Stop camera when switching away from camera mode or unmounting
    useEffect(() => {
        if (scanMode !== 'camera') {
            stopCamera();
        }
        return () => { stopCamera(); };
    }, [scanMode, stopCamera]);

    function handleModeSwitch(mode: ScanMode) {
        setScanMode(mode);
        setMessage(null);
        setResult(null);
        setReference('');
        setCameraError(null);
        if (mode === 'manual') {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
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
                    <Link href="/admin/events" className="text-muted-foreground hover:text-foreground transition-colors">
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

                {/* Mode Switcher */}
                <div className="flex gap-2">
                    <Button
                        variant={scanMode === 'manual' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleModeSwitch('manual')}
                        className="flex-1"
                    >
                        <Keyboard className="w-4 h-4 mr-1.5" />
                        USB / Bluetooth Scanner
                    </Button>
                    <Button
                        variant={scanMode === 'camera' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleModeSwitch('camera')}
                        className="flex-1"
                    >
                        <Camera className="w-4 h-4 mr-1.5" />
                        Camera Scanner
                    </Button>
                </div>

                {/* Manual / USB / Bluetooth Scanner */}
                {scanMode === 'manual' && (
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
                            <p className="text-xs text-muted-foreground mt-2">
                                Use a USB or Bluetooth barcode scanner, or type the reference number manually.
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Camera Scanner */}
                {scanMode === 'camera' && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Camera className="w-5 h-5" /> Camera QR Scanner
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {!cameraActive && !cameraError && (
                                <div className="text-center py-8">
                                    <Video className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Use your device camera to scan attendee QR codes
                                    </p>
                                    <Button onClick={startCamera} size="lg">
                                        <Camera className="w-4 h-4 mr-2" /> Start Camera
                                    </Button>
                                </div>
                            )}

                            {cameraError && (
                                <div className="text-center py-8">
                                    <VideoOff className="w-12 h-12 mx-auto text-destructive/40 mb-3" />
                                    <p className="text-sm text-destructive font-medium mb-4">{cameraError}</p>
                                    <Button onClick={startCamera} variant="outline">
                                        Try Again
                                    </Button>
                                </div>
                            )}

                            {/* Container must always be in DOM and visible when camera is active */}
                            <div
                                id={scannerContainerId}
                                style={{ minHeight: cameraActive ? '300px' : '0', display: cameraActive ? 'block' : 'none' }}
                                className="rounded-lg overflow-hidden"
                            />

                            {cameraActive && (
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-muted-foreground">
                                        Point your camera at a QR code to scan automatically
                                    </p>
                                    <Button variant="outline" size="sm" onClick={stopCamera}>
                                        <VideoOff className="w-3.5 h-3.5 mr-1.5" /> Stop Camera
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

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
