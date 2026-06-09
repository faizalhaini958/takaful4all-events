import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Badge } from '@/Components/ui/badge';
import { Link } from '@inertiajs/react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, QrCode, Search, CheckCircle2, XCircle, AlertCircle, UserCheck, Camera, Keyboard, Video, VideoOff, FileText } from 'lucide-react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { type Event } from '@/types';
import { registrationStatusBadge, paymentStatusBadge } from '@/lib/status-colors';

interface ScanLogEntry {
    id: string;
    name: string;
    reference: string;
    ticket: string | null;
    status: 'checked_in' | 'already_in' | 'not_found';
    time: Date;
}

interface Props {
    event: Event;
    checked_in_count: number;
}

interface LookupResult {
    id: number;
    reference_no: string;
    attendee_no: number;
    name: string;
    email: string;
    phone: string | null;
    company: string | null;
    ticket: string | null;
    quantity: number;
    status: string;
    payment_status: string;
    checked_in_at: string | null;
    meta_json: Record<string, string | number | boolean | null> | null;
}

type MessageType = 'success' | 'error' | 'warning';
type ScanMode = 'manual' | 'camera';

function playBeep(type: 'success' | 'warning' | 'error') {
    try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === 'success') {
            // Two short ascending tones
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.12);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.3);
        } else if (type === 'warning') {
            // Single mid-tone blip
            osc.frequency.setValueAtTime(660, ctx.currentTime);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.25);
        } else {
            // Low buzz for error
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(220, ctx.currentTime);
            gain.gain.setValueAtTime(0.25, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.35);
        }

        osc.onended = () => ctx.close();
    } catch {
        // AudioContext not supported — silently ignore
    }
}

export default function EventCheckIn({ event, checked_in_count }: Props) {
    const [reference, setReference] = useState('');
    const [attendeeNo, setAttendeeNo] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<LookupResult | null>(null);
    const [message, setMessage] = useState<{ type: MessageType; text: string } | null>(null);
    const [checkedInCount, setCheckedInCount] = useState(checked_in_count);
    const [scanMode, setScanMode] = useState<ScanMode>('manual');
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraPaused, setCameraPaused] = useState(false);
    const [scannerFlash, setScannerFlash] = useState<'success' | 'error' | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [cardFlash, setCardFlash] = useState<'success' | 'error' | null>(null);
    const [scanLog, setScanLog] = useState<ScanLogEntry[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const scannerContainerId = 'qr-reader';
    // Guard to prevent double-lookup from rapid scans
    const lookupInProgress = useRef(false);

    function flash(type: 'success' | 'error') {
        setCardFlash(type);
        setTimeout(() => setCardFlash(null), 700);
    }

    function handleScanNext() {
        setReference('');
        setResult(null);
        setMessage(null);
        setAttendeeNo(null);
        if (scanMode === 'manual') {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }

    // Extract reference/attendee from QR value (JSON payload, confirmation URL, or attendee code suffix).
    const parseInput = useCallback((value: string): { reference: string; attendeeNo: number | null } => {
        const raw = value.trim();

        try {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object' && parsed.ref) {
                return {
                    reference: String(parsed.ref),
                    attendeeNo: parsed.attendee_no ? Number(parsed.attendee_no) : null,
                };
            }
        } catch {
            // not JSON payload, continue to URL/raw parsing
        }

        // URL style: /confirmation/EVT-YYYYMMDD-XXXX or /confirmation/EVT-YYYYMMDD-XXXX-01
        const urlMatch = raw.match(/confirmation\/(EVT-\d{8}-[A-Z0-9]{4})(?:-(\d{1,3}))?/i);
        if (urlMatch) {
            return {
                reference: urlMatch[1].toUpperCase(),
                attendeeNo: urlMatch[2] ? Number(urlMatch[2]) : null,
            };
        }

        // Manual style: EVT-YYYYMMDD-XXXX-01 (attendee-specific code)
        const attendeeCodeMatch = raw.match(/^(EVT-\d{8}-[A-Z0-9]{4})-(\d{1,3})$/i);
        if (attendeeCodeMatch) {
            return {
                reference: attendeeCodeMatch[1].toUpperCase(),
                attendeeNo: Number(attendeeCodeMatch[2]),
            };
        }

        // Base registration reference
        return { reference: raw.toUpperCase(), attendeeNo: null };
    }, []);

    const doLookup = useCallback(async (ref: string, attendeeNoArg: number | null = null) => {
        if (!ref.trim() || lookupInProgress.current) return;

        lookupInProgress.current = true;
        setLoading(true);
        setMessage(null);
        setResult(null);
        setReference(ref);
        setAttendeeNo(attendeeNoArg);

        try {
            const res = await fetch(`/admin/events/${event.slug}/check-in/lookup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ reference: ref.trim(), attendee_no: attendeeNoArg }),
            });

            const data = await res.json();

            if (data.found) {
                setResult(data.registration);
                if (data.registration.checked_in_at) {
                    playBeep('warning');
                    flash('error');
                    setScannerFlash('error');
                    setTimeout(() => setScannerFlash(null), 1200);
                    setMessage({ type: 'warning', text: `Already checked in at ${new Date(data.registration.checked_in_at).toLocaleTimeString()}` });
                    setScanLog(prev => [{ id: crypto.randomUUID(), name: data.registration.name, reference: data.registration.reference_no, ticket: data.registration.ticket, status: 'already_in' as const, time: new Date() }, ...prev].slice(0, 10));
                } else {
                    playBeep('success');
                    flash('success');
                    setScannerFlash('success');
                    setTimeout(() => setScannerFlash(null), 1200);
                }
            } else {
                playBeep('error');
                flash('error');
                setScannerFlash('error');
                setTimeout(() => setScannerFlash(null), 1200);
                setMessage({ type: 'error', text: data.message || 'Registration not found.' });
                setScanLog(prev => [{ id: crypto.randomUUID(), name: '—', reference: ref, ticket: null, status: 'not_found' as const, time: new Date() }, ...prev].slice(0, 10));
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
        const parsed = parseInput(reference);
        await doLookup(parsed.reference, parsed.attendeeNo ?? attendeeNo);
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
                body: JSON.stringify({ reference: result.reference_no, attendee_no: result.attendee_no }),
            });

            const data = await res.json();

            if (data.success) {
                playBeep('success');
                flash('success');
                setMessage({ type: 'success', text: data.message });
                const checkedInResult = result ? { ...result, checked_in_at: new Date().toISOString(), status: 'attended' } : null;
                setResult(checkedInResult);
                setCheckedInCount(c => c + 1);
                if (result) {
                    setScanLog(prev => [{ id: crypto.randomUUID(), name: result.name, reference: result.reference_no, ticket: result.ticket, status: 'checked_in' as const, time: new Date() }, ...prev].slice(0, 10));
                }
                // Auto-clear and resume camera scanning after check-in
                if (scanMode === 'camera') {
                    setTimeout(() => {
                        setReference('');
                        setResult(null);
                        setMessage(null);
                        resumeScanner();
                    }, 2000);
                }
            } else {
                playBeep('error');
                flash('error');
                setMessage({ type: 'error', text: data.message });
            }
        } catch {
            playBeep('error');
            flash('error');
            setMessage({ type: 'error', text: 'Check-in failed. Please try again.' });
        } finally {
            setLoading(false);
        }
    }

    function handleInputChange(value: string) {
        setReference(value);
        const parsed = parseInput(value);
        setAttendeeNo(parsed.attendeeNo);
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
        setCameraPaused(false);
    }, []);

    // Pause the scanner (keep camera running, stop decoding) after a QR is found
    const pauseScanner = useCallback(() => {
        const scanner = scannerRef.current;
        if (scanner) {
            try {
                const state = scanner.getState();
                if (state === Html5QrcodeScannerState.SCANNING) {
                    scanner.pause(true); // true = pause rendering too
                }
            } catch {
                // ignore
            }
        }
        setCameraPaused(true);
    }, []);

    // Resume decoding after cancel/check-in
    const resumeScanner = useCallback(() => {
        const scanner = scannerRef.current;
        if (scanner) {
            try {
                const state = scanner.getState();
                if (state === Html5QrcodeScannerState.PAUSED) {
                    scanner.resume();
                }
            } catch {
                // ignore
            }
        }
        setCameraPaused(false);
        lookupInProgress.current = false;
    }, []);

    // Cancel current scan result and resume camera
    const cancelScan = useCallback(() => {
        setReference('');
        setResult(null);
        setMessage(null);
        setAttendeeNo(null);
        setScannerFlash(null);
        resumeScanner();
        if (scanMode === 'manual') {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [resumeScanner, scanMode]);

    const startCamera = useCallback(async () => {
        setCameraError(null);
        setCameraPaused(false);

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
                    if (lookupInProgress.current) return; // already processing
                    // Pause immediately so camera freezes while we show result
                    if (scannerRef.current) {
                        try {
                            const st = scannerRef.current.getState();
                            if (st === Html5QrcodeScannerState.SCANNING) {
                                scannerRef.current.pause(true);
                            }
                        } catch { /* */ }
                    }
                    setCameraPaused(true);
                    playBeep('success');
                    const parsed = parseInput(decodedText);
                    doLookup(parsed.reference, parsed.attendeeNo);
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
            setCameraPaused(false);
        }
    }, [parseInput, doLookup]);

    // Stop camera when switching away from camera mode or unmounting
    useEffect(() => {
        if (scanMode !== 'camera') {
            stopCamera();
        }
        return () => { stopCamera(); };
    }, [scanMode, stopCamera]); // eslint-disable-line react-hooks/exhaustive-deps

    function handleModeSwitch(mode: ScanMode) {
        setScanMode(mode);
        setMessage(null);
        setResult(null);
        setReference('');
        setAttendeeNo(null);
        setCameraError(null);
        if (mode === 'manual') {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }

    // Enter key to confirm check-in
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter' && result && !result.checked_in_at && result.status !== 'cancelled' && !loading) {
                // Don't fire if focus is inside a form input
                if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;
                e.preventDefault();
                handleCheckIn();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [result, loading]); // eslint-disable-line react-hooks/exhaustive-deps

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
                <div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1.5 flex-wrap">
                        <Link href="/admin" className="hover:text-foreground transition-colors">Dashboard</Link>
                        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                        <Link href="/admin/events" className="hover:text-foreground transition-colors">Events</Link>
                        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-foreground font-medium truncate max-w-[160px]">{event.title}</span>
                        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-foreground font-medium">Check‑In</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-foreground">Event Check-In</h1>
                            <p className="text-sm text-muted-foreground">{event.title}</p>
                        </div>
                        <Button variant="outline" size="sm" className="gap-1.5" asChild>
                            <Link href={`/admin/events/${event.slug}/check-in/log`}>
                                <FileText className="w-4 h-4" />
                                View Log
                            </Link>
                        </Button>
                        <div className="text-right">
                            <Badge variant="secondary" className="text-sm">
                                <UserCheck className="w-4 h-4 mr-1" /> {checkedInCount} checked in
                            </Badge>
                            {event.max_attendees && (
                                <p className="text-xs text-muted-foreground mt-1">{event.max_attendees} capacity</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Progress bar */}
                {event.max_attendees && (
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Check-in progress</span>
                            <span>{checkedInCount} / {event.max_attendees} ({Math.round((checkedInCount / event.max_attendees) * 100)}%)</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, (checkedInCount / event.max_attendees) * 100)}%` }}
                            />
                        </div>
                    </div>
                )}

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
                            <div className="relative">
                                <div
                                    id={scannerContainerId}
                                    style={{ minHeight: cameraActive ? '300px' : '0', display: cameraActive ? 'block' : 'none' }}
                                    className={`rounded-lg overflow-hidden transition-all duration-300 ${
                                        scannerFlash === 'success'
                                            ? 'ring-4 ring-emerald-400 ring-offset-2'
                                            : scannerFlash === 'error'
                                            ? 'ring-4 ring-red-400 ring-offset-2'
                                            : ''
                                    }`}
                                />
                                {/* Paused overlay */}
                                {cameraPaused && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg pointer-events-none">
                                        <div className="bg-white/90 rounded-full px-4 py-2 flex items-center gap-2 shadow-lg">
                                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-sm font-semibold text-gray-800">QR Detected — Paused</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {cameraActive && (
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-xs text-muted-foreground">
                                        {cameraPaused
                                            ? 'Scanner paused. Check in or cancel to resume.'
                                            : 'Point your camera at a QR code to scan automatically'}
                                    </p>
                                    <div className="flex gap-2 flex-shrink-0">
                                        {cameraPaused && (
                                            <Button variant="outline" size="sm" onClick={cancelScan} className="border-amber-300 text-amber-700 hover:bg-amber-50">
                                                <XCircle className="w-3.5 h-3.5 mr-1.5" /> Cancel
                                            </Button>
                                        )}
                                        <Button variant="outline" size="sm" onClick={stopCamera}>
                                            <VideoOff className="w-3.5 h-3.5 mr-1.5" /> Stop
                                        </Button>
                                    </div>
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
                    <Card className={`transition-all duration-300 ${cardFlash === 'success' ? 'ring-2 ring-emerald-400' : cardFlash === 'error' ? 'ring-2 ring-red-400' : ''}`}>
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

                            {result.meta_json && (() => {
                                const fields: Record<string, unknown> =
                                    (result.meta_json.custom_fields && typeof result.meta_json.custom_fields === 'object')
                                        ? (result.meta_json.custom_fields as Record<string, unknown>)
                                        : result.meta_json;
                                const entries = Object.entries(fields).filter(([, v]) => v !== null && v !== undefined && v !== '');
                                if (entries.length === 0) return null;

                                const formatLabel = (key: string) =>
                                    key.replace(/_/g, ' ')
                                        .replace(/\btshirt\b/gi, 'T-Shirt')
                                        .replace(/\bic\b/gi, 'IC')
                                        .replace(/\b\w/g, c => c.toUpperCase());

                                const formatValue = (value: unknown) => {
                                    if (typeof value === 'boolean') return value ? '✓ Yes' : '✗ No';
                                    const str = String(value);
                                    if (str.toLowerCase() === 'true') return '✓ Yes';
                                    if (str.toLowerCase() === 'false') return '✗ No';
                                    return str;
                                };

                                // Separate waiver/agree fields from regular fields
                                const regular = entries.filter(([k]) => !k.toLowerCase().includes('waiver') && !k.toLowerCase().includes('agree'));
                                const waiver = entries.filter(([k]) => k.toLowerCase().includes('waiver') || k.toLowerCase().includes('agree'));

                                return (
                                    <div className="border-t pt-4 space-y-3 text-sm">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Registration Details</p>
                                        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                                            {regular.map(([key, value]) => (
                                                <div key={key}>
                                                    <p className="text-xs text-muted-foreground">{formatLabel(key)}</p>
                                                    <p className="font-medium">{formatValue(value)}</p>
                                                </div>
                                            ))}
                                        </div>
                                        {waiver.map(([key, value]) => (
                                            <div key={key} className="flex items-center gap-2 pt-1 border-t text-xs text-muted-foreground">
                                                <span>{formatLabel(key)}:</span>
                                                <span className={`font-semibold ${formatValue(value).startsWith('✓') ? 'text-emerald-600' : 'text-red-500'}`}>
                                                    {formatValue(value)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}

                            {!result.checked_in_at && result.status !== 'cancelled' && (
                                <div className="flex flex-col gap-2">
                                    <Button
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-lg py-6"
                                        onClick={handleCheckIn}
                                        disabled={loading}
                                    >
                                        <CheckCircle2 className="w-5 h-5 mr-2" />
                                        {loading ? 'Processing…' : 'Confirm Check-In'}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full border-red-200 text-red-600 hover:bg-red-50"
                                        onClick={cancelScan}
                                        disabled={loading}
                                    >
                                        <XCircle className="w-4 h-4 mr-2" /> Cancel & Scan Again
                                    </Button>
                                </div>
                            )}

                            {result.checked_in_at && (
                                <div className="space-y-3">
                                    <div className="w-full text-center p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                                        <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-600 mb-2" />
                                        <p className="font-semibold text-emerald-800">Checked In</p>
                                        <p className="text-sm text-emerald-600">
                                            {new Date(result.checked_in_at).toLocaleString()}
                                        </p>
                                    </div>
                                    <Button variant="outline" className="w-full" onClick={handleScanNext}>
                                        <QrCode className="w-4 h-4 mr-2" /> Scan Next Attendee
                                    </Button>
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
                {/* Recent scan log */}
                {scanLog.length > 0 && (
                    <Card>
                        <CardHeader className="pb-2 pt-4 px-4">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <UserCheck className="w-4 h-4" /> Recent Scans
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 pb-2">
                            <div className="divide-y max-h-56 overflow-y-auto">
                                {scanLog.map(entry => (
                                    <div key={entry.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${entry.status === 'checked_in' ? 'bg-emerald-500' :
                                                entry.status === 'already_in' ? 'bg-amber-400' :
                                                    'bg-red-400'
                                            }`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{entry.name}</p>
                                            <p className="text-xs text-muted-foreground font-mono">{entry.reference}</p>
                                        </div>
                                        {entry.ticket && (
                                            <span className="text-xs bg-muted px-2 py-0.5 rounded flex-shrink-0">{entry.ticket}</span>
                                        )}
                                        <div className="text-right flex-shrink-0">
                                            <p className={`text-xs font-medium ${entry.status === 'checked_in' ? 'text-emerald-600' :
                                                    entry.status === 'already_in' ? 'text-amber-600' :
                                                        'text-red-500'
                                                }`}>
                                                {entry.status === 'checked_in' ? '✓ In' : entry.status === 'already_in' ? '⚠ Dup' : '✗ Not found'}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {entry.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AdminLayout>
    );
}
