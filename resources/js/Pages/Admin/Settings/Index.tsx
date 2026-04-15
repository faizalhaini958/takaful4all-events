import { useForm, usePage, router } from '@inertiajs/react';
import { FormEvent, useState, useMemo } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Button } from '@/Components/ui/button';
import { Switch } from '@/Components/ui/switch';
import { Badge } from '@/Components/ui/badge';
import { Textarea } from '@/Components/ui/textarea';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import {
    Mail,
    CreditCard,
    Send,
    TestTube,
    Loader2,
    Eye,
    EyeOff,
    Webhook,
    ExternalLink,
    Copy,
    Check,
    Shield,
    AlertCircle,
    Settings,
    CalendarCheck,
    Bell,
    FileText,
    Globe,
    Truck,
    Plus,
    Pencil,
    Trash2,
    X,
    Search,
} from 'lucide-react';
import { ShippingZone } from '@/types';

interface SmtpSettings {
    host: string;
    port: string;
    encryption: string;
    username: string;
    password: string;
    from_address: string;
    from_name: string;
}

interface ChipInSettings {
    secret_key: string;
    brand_id: string;
    webhook_secret: string;
    success_redirect: string;
    failure_redirect: string;
    send_receipt: string;
    is_test_mode: string;
}

interface GeneralSettings {
    site_name: string;
    site_logo: string;
    footer_text: string;
    contact_email: string;
    contact_phone: string;
}

interface BookingSettings {
    default_max_attendees: string;
    default_require_approval: string;
    registration_cutoff_hours: string;
    waitlist_enabled: string;
}

interface NotificationSettings {
    send_confirmation_email: string;
    send_reminder_email: string;
    reminder_hours: string;
    send_cancellation_email: string;
}

interface InvoicingSettings {
    company_name: string;
    company_registration_no: string;
    company_address: string;
    invoice_prefix: string;
    tax_rate: string;
}

interface LocalisationSettings {
    default_locale: string;
    enable_en: string;
    enable_ms: string;
}

interface Props {
    tab: string;
    smtp: SmtpSettings;
    chipin: ChipInSettings;
    general: GeneralSettings;
    booking: BookingSettings;
    notifications: NotificationSettings;
    invoicing: InvoicingSettings;
    localisation: LocalisationSettings;
    shippingZones: ShippingZone[];
}

function SmtpSettingsTab({ smtp }: { smtp: SmtpSettings }) {
    const [showPassword, setShowPassword] = useState(false);
    const [testEmail, setTestEmail] = useState('');
    const [testing, setTesting] = useState(false);

    const form = useForm({
        host: smtp.host || '',
        port: smtp.port || '587',
        encryption: smtp.encryption || 'tls',
        username: smtp.username || '',
        password: smtp.password || '',
        from_address: smtp.from_address || '',
        from_name: smtp.from_name || '',
    });

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        form.post(route('admin.settings.smtp'), {
            preserveScroll: true,
        });
    }

    function handleTest(e: FormEvent) {
        e.preventDefault();
        setTesting(true);
        router.post(route('admin.settings.smtp.test'), { test_email: testEmail }, {
            preserveScroll: true,
            onFinish: () => setTesting(false),
        });
    }

    return (
        <div className="space-y-6">
            <Card className="rounded-xl border-border/60">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5 text-primary" />
                        SMTP Configuration
                    </CardTitle>
                    <CardDescription>
                        Configure your outgoing email server settings. These settings will be used to send all system emails including registration confirmations and notifications.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="smtp-host">SMTP Host</Label>
                                <Input
                                    id="smtp-host"
                                    placeholder="smtp.gmail.com"
                                    value={form.data.host}
                                    onChange={e => form.setData('host', e.target.value)}
                                />
                                {form.errors.host && (
                                    <p className="text-sm text-destructive">{form.errors.host}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="smtp-port">Port</Label>
                                <Input
                                    id="smtp-port"
                                    type="number"
                                    placeholder="587"
                                    value={form.data.port}
                                    onChange={e => form.setData('port', e.target.value)}
                                />
                                {form.errors.port && (
                                    <p className="text-sm text-destructive">{form.errors.port}</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="smtp-encryption">Encryption</Label>
                            <Select
                                value={form.data.encryption}
                                onValueChange={val => form.setData('encryption', val)}
                            >
                                <SelectTrigger id="smtp-encryption">
                                    <SelectValue placeholder="Select encryption" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="tls">TLS</SelectItem>
                                    <SelectItem value="ssl">SSL</SelectItem>
                                    <SelectItem value="none">None</SelectItem>
                                </SelectContent>
                            </Select>
                            {form.errors.encryption && (
                                <p className="text-sm text-destructive">{form.errors.encryption}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="smtp-username">Username</Label>
                                <Input
                                    id="smtp-username"
                                    placeholder="your-email@gmail.com"
                                    value={form.data.username}
                                    onChange={e => form.setData('username', e.target.value)}
                                />
                                {form.errors.username && (
                                    <p className="text-sm text-destructive">{form.errors.username}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="smtp-password">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="smtp-password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={form.data.password}
                                        onChange={e => form.setData('password', e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {form.errors.password && (
                                    <p className="text-sm text-destructive">{form.errors.password}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="smtp-from-address">From Address</Label>
                                <Input
                                    id="smtp-from-address"
                                    type="email"
                                    placeholder="noreply@yoursite.com"
                                    value={form.data.from_address}
                                    onChange={e => form.setData('from_address', e.target.value)}
                                />
                                {form.errors.from_address && (
                                    <p className="text-sm text-destructive">{form.errors.from_address}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="smtp-from-name">From Name</Label>
                                <Input
                                    id="smtp-from-name"
                                    placeholder="Takaful Events"
                                    value={form.data.from_name}
                                    onChange={e => form.setData('from_name', e.target.value)}
                                />
                                {form.errors.from_name && (
                                    <p className="text-sm text-destructive">{form.errors.from_name}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button type="submit" disabled={form.processing}>
                                {form.processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save SMTP Settings
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Test Email */}
            <Card className="rounded-xl border-border/60">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Send className="h-5 w-5 text-primary" />
                        Send Test Email
                    </CardTitle>
                    <CardDescription>
                        Verify your SMTP configuration by sending a test email. Make sure to save your settings first.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleTest} className="flex items-end gap-3">
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="test-email">Recipient Email</Label>
                            <Input
                                id="test-email"
                                type="email"
                                placeholder="test@example.com"
                                value={testEmail}
                                onChange={e => setTestEmail(e.target.value)}
                                required
                            />
                        </div>
                        <Button type="submit" variant="outline" disabled={testing || !testEmail}>
                            {testing ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <TestTube className="mr-2 h-4 w-4" />
                            )}
                            Send Test
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

function ChipInSettingsTab({ chipin }: { chipin: ChipInSettings }) {
    const [showSecretKey, setShowSecretKey] = useState(false);
    const [showWebhookSecret, setShowWebhookSecret] = useState(false);
    const [copied, setCopied] = useState(false);
    const [testingConnection, setTestingConnection] = useState(false);
    const [checkingWebhook, setCheckingWebhook] = useState(false);
    const [registeringWebhook, setRegisteringWebhook] = useState(false);
    const [webhookStatus, setWebhookStatus] = useState<null | { is_registered: boolean; endpoints: any[] }>(null);
    const [webhookMessage, setWebhookMessage] = useState<string | null>(null);

    const webhookUrl = `${window.location.origin}/webhooks/chipin`;

    const form = useForm({
        secret_key: chipin.secret_key || '',
        brand_id: chipin.brand_id || '',
        webhook_secret: chipin.webhook_secret || '',
        success_redirect: chipin.success_redirect || '',
        failure_redirect: chipin.failure_redirect || '',
        send_receipt: chipin.send_receipt || '0',
        is_test_mode: chipin.is_test_mode || '1',
    });

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        form.post(route('admin.settings.chipin'), {
            preserveScroll: true,
        });
    }

    function handleTestConnection() {
        setTestingConnection(true);
        router.post(route('admin.settings.chipin.test'), {
            secret_key: form.data.secret_key,
            brand_id: form.data.brand_id,
        }, {
            preserveScroll: true,
            onFinish: () => setTestingConnection(false),
        });
    }

    function copyWebhookUrl() {
        navigator.clipboard.writeText(webhookUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    function checkWebhookStatus() {
        setCheckingWebhook(true);
        setWebhookMessage(null);
        fetch(route('admin.settings.chipin.webhook.check'), {
            headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        })
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    setWebhookMessage(data.error);
                } else {
                    setWebhookStatus(data);
                    setWebhookMessage(data.is_registered ? 'Webhook is registered with Chip-In.' : 'Webhook is NOT registered with Chip-In.');
                }
            })
            .catch(() => setWebhookMessage('Failed to check webhook status.'))
            .finally(() => setCheckingWebhook(false));
    }

    function registerWebhook() {
        setRegisteringWebhook(true);
        setWebhookMessage(null);
        const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;
        fetch(route('admin.settings.chipin.webhook.create'), {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': csrfToken || '',
            },
        })
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    setWebhookMessage(data.error);
                } else {
                    setWebhookMessage(data.message);
                    setWebhookStatus(prev => prev ? { ...prev, is_registered: true } : { is_registered: true, endpoints: [] });
                }
            })
            .catch(() => setWebhookMessage('Failed to register webhook.'))
            .finally(() => setRegisteringWebhook(false));
    }

    return (
        <div className="space-y-6">
            {/* API Credentials */}
            <Card className="rounded-xl border-border/60">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5 text-primary" />
                                Chip-In API Credentials
                            </CardTitle>
                            <CardDescription>
                                Enter your Chip-In API credentials. Get them from{' '}
                                <a
                                    href="https://portal.chip-in.asia/collect/developers/api-keys"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline inline-flex items-center gap-1"
                                >
                                    Chip-In Developer Portal
                                    <ExternalLink className="h-3 w-3" />
                                </a>
                            </CardDescription>
                        </div>
                        <Badge variant={form.data.is_test_mode === '1' ? 'outline' : 'default'}>
                            {form.data.is_test_mode === '1' ? 'Test Mode' : 'Live Mode'}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="chipin-secret-key">Secret Key</Label>
                            <div className="relative">
                                <Input
                                    id="chipin-secret-key"
                                    type={showSecretKey ? 'text' : 'password'}
                                    placeholder="Enter your Chip-In secret key"
                                    value={form.data.secret_key}
                                    onChange={e => form.setData('secret_key', e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowSecretKey(!showSecretKey)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {form.errors.secret_key && (
                                <p className="text-sm text-destructive">{form.errors.secret_key}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="chipin-brand-id">Brand ID</Label>
                            <Input
                                id="chipin-brand-id"
                                placeholder="e.g. 409eb80e-3782-4b1d-afa8-b779759266a5"
                                value={form.data.brand_id}
                                onChange={e => form.setData('brand_id', e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Find your Brand ID at{' '}
                                <a
                                    href="https://portal.chip-in.asia/collect/developers/brands"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                >
                                    portal.chip-in.asia/collect/developers/brands
                                </a>
                            </p>
                            {form.errors.brand_id && (
                                <p className="text-sm text-destructive">{form.errors.brand_id}</p>
                            )}
                        </div>

                        <div className="flex items-center justify-between rounded-xl border border-border/60 p-4">
                            <div className="space-y-0.5">
                                <Label htmlFor="chipin-test-mode" className="text-base">Test Mode</Label>
                                <p className="text-sm text-muted-foreground">
                                    Enable test mode to use sandbox credentials. No real payments will be processed.
                                </p>
                            </div>
                            <Switch
                                id="chipin-test-mode"
                                checked={form.data.is_test_mode === '1'}
                                onCheckedChange={(checked) => form.setData('is_test_mode', checked ? '1' : '0')}
                            />
                        </div>

                        <div className="flex items-center justify-between rounded-xl border border-border/60 p-4">
                            <div className="space-y-0.5">
                                <Label htmlFor="chipin-send-receipt" className="text-base">Send Receipt</Label>
                                <p className="text-sm text-muted-foreground">
                                    Automatically send payment receipts to customers via Chip-In after successful payment.
                                </p>
                            </div>
                            <Switch
                                id="chipin-send-receipt"
                                checked={form.data.send_receipt === '1'}
                                onCheckedChange={(checked) => form.setData('send_receipt', checked ? '1' : '0')}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="chipin-success-redirect">Success Redirect URL</Label>
                                <Input
                                    id="chipin-success-redirect"
                                    type="url"
                                    placeholder="https://yoursite.com/payment/success"
                                    value={form.data.success_redirect}
                                    onChange={e => form.setData('success_redirect', e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Customer will be redirected here after successful payment.
                                </p>
                                {form.errors.success_redirect && (
                                    <p className="text-sm text-destructive">{form.errors.success_redirect}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="chipin-failure-redirect">Failure Redirect URL</Label>
                                <Input
                                    id="chipin-failure-redirect"
                                    type="url"
                                    placeholder="https://yoursite.com/payment/failed"
                                    value={form.data.failure_redirect}
                                    onChange={e => form.setData('failure_redirect', e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Customer will be redirected here after failed payment.
                                </p>
                                {form.errors.failure_redirect && (
                                    <p className="text-sm text-destructive">{form.errors.failure_redirect}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3 justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleTestConnection}
                                disabled={testingConnection || !form.data.secret_key || !form.data.brand_id}
                            >
                                {testingConnection ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <TestTube className="mr-2 h-4 w-4" />
                                )}
                                Test Connection
                            </Button>
                            <Button type="submit" disabled={form.processing}>
                                {form.processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Payment Settings
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Webhook Configuration */}
            <Card className="rounded-xl border-border/60">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Webhook className="h-5 w-5 text-primary" />
                        Webhook Configuration
                    </CardTitle>
                    <CardDescription>
                        Configure your Chip-In webhook to receive real-time payment notifications. Register this URL in your{' '}
                        <a
                            href="https://portal.chip-in.asia/collect/developers"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1"
                        >
                            Chip-In Dashboard
                            <ExternalLink className="h-3 w-3" />
                        </a>
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Webhook URL */}
                    <div className="space-y-2">
                        <Label>Webhook URL</Label>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 rounded-xl border border-border/60 bg-muted/50 px-3 py-2 text-sm font-mono">
                                {webhookUrl}
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={copyWebhookUrl}
                            >
                                {copied ? (
                                    <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                    <Copy className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Copy this URL and add it as a webhook endpoint in your Chip-In dashboard, or use the buttons below to manage it automatically.
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={checkWebhookStatus}
                                disabled={checkingWebhook || !chipin.secret_key}
                            >
                                {checkingWebhook ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Search className="mr-2 h-4 w-4" />
                                )}
                                Check Status
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                onClick={registerWebhook}
                                disabled={registeringWebhook || !chipin.secret_key || (webhookStatus?.is_registered === true)}
                            >
                                {registeringWebhook ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Plus className="mr-2 h-4 w-4" />
                                )}
                                Register Webhook
                            </Button>
                        </div>
                        {webhookMessage && (
                            <div className={`mt-2 flex items-center gap-2 text-sm ${webhookStatus?.is_registered ? 'text-green-600' : 'text-amber-600'}`}>
                                {webhookStatus?.is_registered ? (
                                    <Check className="h-4 w-4" />
                                ) : (
                                    <AlertCircle className="h-4 w-4" />
                                )}
                                {webhookMessage}
                            </div>
                        )}
                    </div>

                    {/* Webhook Secret */}
                    <div className="space-y-2">
                        <Label htmlFor="chipin-webhook-secret">Webhook Public Key (Optional)</Label>
                        <div className="relative">
                            <Input
                                id="chipin-webhook-secret"
                                type={showWebhookSecret ? 'text' : 'password'}
                                placeholder="PEM-encoded RSA public key for signature verification"
                                value={form.data.webhook_secret}
                                onChange={e => form.setData('webhook_secret', e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                {showWebhookSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            If provided, webhook payloads will be verified using this public key. You can find this key when creating a webhook in the Chip-In portal.
                        </p>
                    </div>

                    {/* Supported Events */}
                    <div className="space-y-3">
                        <Label>Supported Webhook Events</Label>
                        <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                {[
                                    { event: 'purchase.paid', description: 'Payment completed successfully' },
                                    { event: 'purchase.payment_failure', description: 'Payment attempt failed' },
                                    { event: 'purchase.cancelled', description: 'Purchase was cancelled' },
                                    { event: 'purchase.pending_execute', description: 'Payment is processing' },
                                    { event: 'payment.refunded', description: 'Payment was refunded' },
                                ].map(item => (
                                    <div key={item.event} className="flex items-start gap-2">
                                        <Shield className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                                        <div>
                                            <code className="text-xs font-mono bg-muted px-1 py-0.5 rounded">{item.event}</code>
                                            <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Setup Instructions */}
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                        <div className="flex gap-3">
                            <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                            <div className="space-y-2 text-sm">
                                <p className="font-medium text-foreground">Webhook Setup Instructions</p>
                                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                                    <li>Go to your <a href="https://portal.chip-in.asia/collect/developers" target="_blank" rel="noopener noreferrer" className="underline">Chip-In Developer Portal</a></li>
                                    <li>Navigate to the Webhooks section</li>
                                    <li>Create a new webhook with the URL shown above</li>
                                    <li>Select the events: <code className="bg-primary/10 px-1 rounded text-xs">purchase.paid</code>, <code className="bg-primary/10 px-1 rounded text-xs">purchase.payment_failure</code>, <code className="bg-primary/10 px-1 rounded text-xs">purchase.cancelled</code>, <code className="bg-primary/10 px-1 rounded text-xs">payment.refunded</code></li>
                                    <li>Copy the public key and paste it in the field above for signature verification</li>
                                    <li>Save the webhook configuration</li>
                                </ol>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// ─── General Settings Tab ─────────────────────────────────────────────────────

function GeneralSettingsTab({ general }: { general: GeneralSettings }) {
    const form = useForm({
        site_name: general.site_name || '',
        site_logo: general.site_logo || '',
        footer_text: general.footer_text || '',
        contact_email: general.contact_email || '',
        contact_phone: general.contact_phone || '',
    });

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        form.post(route('admin.settings.general'), { preserveScroll: true });
    }

    return (
        <Card className="rounded-xl border-border/60">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    General Settings
                </CardTitle>
                <CardDescription>
                    Configure basic site information displayed across the platform.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="site-name">Site Name</Label>
                            <Input
                                id="site-name"
                                placeholder="Takaful Events"
                                value={form.data.site_name}
                                onChange={e => form.setData('site_name', e.target.value)}
                            />
                            {form.errors.site_name && <p className="text-sm text-destructive">{form.errors.site_name}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="site-logo">Site Logo URL</Label>
                            <Input
                                id="site-logo"
                                placeholder="/images/logo.png"
                                value={form.data.site_logo}
                                onChange={e => form.setData('site_logo', e.target.value)}
                            />
                            {form.errors.site_logo && <p className="text-sm text-destructive">{form.errors.site_logo}</p>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="footer-text">Footer Text</Label>
                        <Textarea
                            id="footer-text"
                            placeholder="© 2026 Malaysian Takaful Association. All rights reserved."
                            value={form.data.footer_text}
                            onChange={e => form.setData('footer_text', e.target.value)}
                            rows={3}
                        />
                        {form.errors.footer_text && <p className="text-sm text-destructive">{form.errors.footer_text}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="contact-email">Contact Email</Label>
                            <Input
                                id="contact-email"
                                type="email"
                                placeholder="event@malaysiantakaful.com.my"
                                value={form.data.contact_email}
                                onChange={e => form.setData('contact_email', e.target.value)}
                            />
                            {form.errors.contact_email && <p className="text-sm text-destructive">{form.errors.contact_email}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contact-phone">Contact Phone</Label>
                            <Input
                                id="contact-phone"
                                placeholder="+60 3-2034 6268"
                                value={form.data.contact_phone}
                                onChange={e => form.setData('contact_phone', e.target.value)}
                            />
                            {form.errors.contact_phone && <p className="text-sm text-destructive">{form.errors.contact_phone}</p>}
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={form.processing}>
                            {form.processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save General Settings
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

// ─── Booking Rules Tab ────────────────────────────────────────────────────────

function BookingSettingsTab({ booking }: { booking: BookingSettings }) {
    const form = useForm({
        default_max_attendees: booking.default_max_attendees || '',
        default_require_approval: booking.default_require_approval || '0',
        registration_cutoff_hours: booking.registration_cutoff_hours || '',
        waitlist_enabled: booking.waitlist_enabled || '0',
    });

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        form.post(route('admin.settings.booking'), { preserveScroll: true });
    }

    return (
        <Card className="rounded-xl border-border/60">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CalendarCheck className="h-5 w-5 text-primary" />
                    Booking Rules
                </CardTitle>
                <CardDescription>
                    Default rules applied to new events. Individual events can override these.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="max-attendees">Default Max Attendees per Registration</Label>
                            <Input
                                id="max-attendees"
                                type="number"
                                min="1"
                                placeholder="10"
                                value={form.data.default_max_attendees}
                                onChange={e => form.setData('default_max_attendees', e.target.value)}
                            />
                            {form.errors.default_max_attendees && <p className="text-sm text-destructive">{form.errors.default_max_attendees}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cutoff-hours">Registration Cutoff (hours before event)</Label>
                            <Input
                                id="cutoff-hours"
                                type="number"
                                min="0"
                                placeholder="24"
                                value={form.data.registration_cutoff_hours}
                                onChange={e => form.setData('registration_cutoff_hours', e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Close registration this many hours before the event starts. 0 = no cutoff.
                            </p>
                            {form.errors.registration_cutoff_hours && <p className="text-sm text-destructive">{form.errors.registration_cutoff_hours}</p>}
                        </div>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-border/60 p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="require-approval" className="text-base">Require Approval</Label>
                            <p className="text-sm text-muted-foreground">
                                New registrations require admin approval before confirmation.
                            </p>
                        </div>
                        <Switch
                            id="require-approval"
                            checked={form.data.default_require_approval === '1'}
                            onCheckedChange={(checked) => form.setData('default_require_approval', checked ? '1' : '0')}
                        />
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-border/60 p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="waitlist" className="text-base">Enable Waitlist</Label>
                            <p className="text-sm text-muted-foreground">
                                Allow users to join a waitlist when tickets are sold out.
                            </p>
                        </div>
                        <Switch
                            id="waitlist"
                            checked={form.data.waitlist_enabled === '1'}
                            onCheckedChange={(checked) => form.setData('waitlist_enabled', checked ? '1' : '0')}
                        />
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={form.processing}>
                            {form.processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Booking Rules
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

// ─── Notification Settings Tab ────────────────────────────────────────────────

function NotificationSettingsTab({ notifications }: { notifications: NotificationSettings }) {
    const form = useForm({
        send_confirmation_email: notifications.send_confirmation_email || '1',
        send_reminder_email: notifications.send_reminder_email || '0',
        reminder_hours: notifications.reminder_hours || '24',
        send_cancellation_email: notifications.send_cancellation_email || '1',
    });

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        form.post(route('admin.settings.notifications'), { preserveScroll: true });
    }

    return (
        <Card className="rounded-xl border-border/60">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    Email Notifications
                </CardTitle>
                <CardDescription>
                    Control which automated emails are sent to registrants.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex items-center justify-between rounded-xl border border-border/60 p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="confirmation-email" className="text-base">Confirmation Email</Label>
                            <p className="text-sm text-muted-foreground">
                                Send a confirmation email when a registration is approved or paid.
                            </p>
                        </div>
                        <Switch
                            id="confirmation-email"
                            checked={form.data.send_confirmation_email === '1'}
                            onCheckedChange={(checked) => form.setData('send_confirmation_email', checked ? '1' : '0')}
                        />
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-border/60 p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="reminder-email" className="text-base">Reminder Email</Label>
                            <p className="text-sm text-muted-foreground">
                                Send a reminder email before the event starts.
                            </p>
                        </div>
                        <Switch
                            id="reminder-email"
                            checked={form.data.send_reminder_email === '1'}
                            onCheckedChange={(checked) => form.setData('send_reminder_email', checked ? '1' : '0')}
                        />
                    </div>

                    {form.data.send_reminder_email === '1' && (
                        <div className="space-y-2 ml-4 pl-4 border-l-2 border-primary/30">
                            <Label htmlFor="reminder-hours">Reminder Hours Before Event</Label>
                            <Input
                                id="reminder-hours"
                                type="number"
                                min="1"
                                max="168"
                                placeholder="24"
                                value={form.data.reminder_hours}
                                onChange={e => form.setData('reminder_hours', e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                How many hours before the event to send the reminder (1–168).
                            </p>
                            {form.errors.reminder_hours && <p className="text-sm text-destructive">{form.errors.reminder_hours}</p>}
                        </div>
                    )}

                    <div className="flex items-center justify-between rounded-xl border border-border/60 p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="cancellation-email" className="text-base">Cancellation Email</Label>
                            <p className="text-sm text-muted-foreground">
                                Send an email when a registration is cancelled.
                            </p>
                        </div>
                        <Switch
                            id="cancellation-email"
                            checked={form.data.send_cancellation_email === '1'}
                            onCheckedChange={(checked) => form.setData('send_cancellation_email', checked ? '1' : '0')}
                        />
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={form.processing}>
                            {form.processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Notification Settings
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

// ─── Invoicing Settings Tab ───────────────────────────────────────────────────

function InvoicingSettingsTab({ invoicing }: { invoicing: InvoicingSettings }) {
    const form = useForm({
        company_name: invoicing.company_name || '',
        company_registration_no: invoicing.company_registration_no || '',
        company_address: invoicing.company_address || '',
        invoice_prefix: invoicing.invoice_prefix || 'INV',
        tax_rate: invoicing.tax_rate || '',
    });

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        form.post(route('admin.settings.invoicing'), { preserveScroll: true });
    }

    return (
        <Card className="rounded-xl border-border/60">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Invoice Settings
                </CardTitle>
                <CardDescription>
                    Company details and formatting options printed on invoices.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="inv-company-name">Company Name</Label>
                            <Input
                                id="inv-company-name"
                                placeholder="Malaysian Takaful Association"
                                value={form.data.company_name}
                                onChange={e => form.setData('company_name', e.target.value)}
                            />
                            {form.errors.company_name && <p className="text-sm text-destructive">{form.errors.company_name}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="inv-reg-no">Company Registration No.</Label>
                            <Input
                                id="inv-reg-no"
                                placeholder="e.g. 200501012345"
                                value={form.data.company_registration_no}
                                onChange={e => form.setData('company_registration_no', e.target.value)}
                            />
                            {form.errors.company_registration_no && <p className="text-sm text-destructive">{form.errors.company_registration_no}</p>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="inv-address">Company Address</Label>
                        <Textarea
                            id="inv-address"
                            placeholder="Full company address for invoice header"
                            value={form.data.company_address}
                            onChange={e => form.setData('company_address', e.target.value)}
                            rows={3}
                        />
                        {form.errors.company_address && <p className="text-sm text-destructive">{form.errors.company_address}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="inv-prefix">Invoice Prefix</Label>
                            <Input
                                id="inv-prefix"
                                placeholder="INV"
                                value={form.data.invoice_prefix}
                                onChange={e => form.setData('invoice_prefix', e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Prefix for invoice numbers, e.g. INV-20260001
                            </p>
                            {form.errors.invoice_prefix && <p className="text-sm text-destructive">{form.errors.invoice_prefix}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="inv-tax">Tax Rate (%)</Label>
                            <Input
                                id="inv-tax"
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                placeholder="0"
                                value={form.data.tax_rate}
                                onChange={e => form.setData('tax_rate', e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Leave empty or 0 for no tax.
                            </p>
                            {form.errors.tax_rate && <p className="text-sm text-destructive">{form.errors.tax_rate}</p>}
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={form.processing}>
                            {form.processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Invoice Settings
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

// ─── Localisation Settings Tab ────────────────────────────────────────────────

function LocalisationSettingsTab({ localisation }: { localisation: LocalisationSettings }) {
    const form = useForm({
        default_locale: localisation.default_locale || 'en',
        enable_en: localisation.enable_en || '1',
        enable_ms: localisation.enable_ms || '1',
    });

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        form.post(route('admin.settings.localisation'), { preserveScroll: true });
    }

    return (
        <Card className="rounded-xl border-border/60">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" />
                    Localisation Settings
                </CardTitle>
                <CardDescription>
                    Manage language options and default locale for the platform.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="default-locale">Default Language</Label>
                        <Select
                            value={form.data.default_locale}
                            onValueChange={val => form.setData('default_locale', val)}
                        >
                            <SelectTrigger id="default-locale">
                                <SelectValue placeholder="Select default language" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="ms">Bahasa Melayu</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Language used for new visitors and guests without a preference.
                        </p>
                        {form.errors.default_locale && <p className="text-sm text-destructive">{form.errors.default_locale}</p>}
                    </div>

                    <div className="space-y-4">
                        <Label>Available Languages</Label>

                        <div className="flex items-center justify-between rounded-xl border border-border/60 p-4">
                            <div className="space-y-0.5">
                                <Label htmlFor="enable-en" className="text-base">English</Label>
                                <p className="text-sm text-muted-foreground">Enable English language on the public site.</p>
                            </div>
                            <Switch
                                id="enable-en"
                                checked={form.data.enable_en === '1'}
                                onCheckedChange={(checked) => form.setData('enable_en', checked ? '1' : '0')}
                            />
                        </div>

                        <div className="flex items-center justify-between rounded-xl border border-border/60 p-4">
                            <div className="space-y-0.5">
                                <Label htmlFor="enable-ms" className="text-base">Bahasa Melayu</Label>
                                <p className="text-sm text-muted-foreground">Enable Bahasa Melayu language on the public site.</p>
                            </div>
                            <Switch
                                id="enable-ms"
                                checked={form.data.enable_ms === '1'}
                                onCheckedChange={(checked) => form.setData('enable_ms', checked ? '1' : '0')}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={form.processing}>
                            {form.processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Localisation Settings
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

// ─── Country List ─────────────────────────────────────────────────────────────

const COUNTRIES: { code: string; name: string }[] = [
    { code: 'AF', name: 'Afghanistan' },
    { code: 'AL', name: 'Albania' },
    { code: 'DZ', name: 'Algeria' },
    { code: 'AR', name: 'Argentina' },
    { code: 'AU', name: 'Australia' },
    { code: 'AT', name: 'Austria' },
    { code: 'BH', name: 'Bahrain' },
    { code: 'BD', name: 'Bangladesh' },
    { code: 'BE', name: 'Belgium' },
    { code: 'BN', name: 'Brunei' },
    { code: 'KH', name: 'Cambodia' },
    { code: 'CA', name: 'Canada' },
    { code: 'CN', name: 'China' },
    { code: 'CO', name: 'Colombia' },
    { code: 'HR', name: 'Croatia' },
    { code: 'CZ', name: 'Czech Republic' },
    { code: 'DK', name: 'Denmark' },
    { code: 'EG', name: 'Egypt' },
    { code: 'FI', name: 'Finland' },
    { code: 'FR', name: 'France' },
    { code: 'DE', name: 'Germany' },
    { code: 'GR', name: 'Greece' },
    { code: 'HK', name: 'Hong Kong' },
    { code: 'HU', name: 'Hungary' },
    { code: 'IN', name: 'India' },
    { code: 'ID', name: 'Indonesia' },
    { code: 'IR', name: 'Iran' },
    { code: 'IQ', name: 'Iraq' },
    { code: 'IE', name: 'Ireland' },
    { code: 'IL', name: 'Israel' },
    { code: 'IT', name: 'Italy' },
    { code: 'JP', name: 'Japan' },
    { code: 'JO', name: 'Jordan' },
    { code: 'KZ', name: 'Kazakhstan' },
    { code: 'KE', name: 'Kenya' },
    { code: 'KR', name: 'South Korea' },
    { code: 'KW', name: 'Kuwait' },
    { code: 'LA', name: 'Laos' },
    { code: 'LB', name: 'Lebanon' },
    { code: 'MY', name: 'Malaysia' },
    { code: 'MV', name: 'Maldives' },
    { code: 'MX', name: 'Mexico' },
    { code: 'MM', name: 'Myanmar' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'NZ', name: 'New Zealand' },
    { code: 'NG', name: 'Nigeria' },
    { code: 'NO', name: 'Norway' },
    { code: 'OM', name: 'Oman' },
    { code: 'PK', name: 'Pakistan' },
    { code: 'PH', name: 'Philippines' },
    { code: 'PL', name: 'Poland' },
    { code: 'PT', name: 'Portugal' },
    { code: 'QA', name: 'Qatar' },
    { code: 'RO', name: 'Romania' },
    { code: 'RU', name: 'Russia' },
    { code: 'SA', name: 'Saudi Arabia' },
    { code: 'SG', name: 'Singapore' },
    { code: 'ZA', name: 'South Africa' },
    { code: 'ES', name: 'Spain' },
    { code: 'LK', name: 'Sri Lanka' },
    { code: 'SE', name: 'Sweden' },
    { code: 'CH', name: 'Switzerland' },
    { code: 'TW', name: 'Taiwan' },
    { code: 'TH', name: 'Thailand' },
    { code: 'TR', name: 'Turkey' },
    { code: 'AE', name: 'United Arab Emirates' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'US', name: 'United States' },
    { code: 'UZ', name: 'Uzbekistan' },
    { code: 'VN', name: 'Vietnam' },
    { code: 'YE', name: 'Yemen' },
];

function countryName(code: string): string {
    return COUNTRIES.find(c => c.code === code)?.name ?? code;
}

// ─── Malaysian States ─────────────────────────────────────────────────────────

const MY_STATES: { code: string; name: string; region: 'west' | 'east' }[] = [
    // West Malaysia (Peninsular)
    { code: 'JHR', name: 'Johor', region: 'west' },
    { code: 'KDH', name: 'Kedah', region: 'west' },
    { code: 'KTN', name: 'Kelantan', region: 'west' },
    { code: 'MLK', name: 'Melaka', region: 'west' },
    { code: 'NSN', name: 'Negeri Sembilan', region: 'west' },
    { code: 'PHG', name: 'Pahang', region: 'west' },
    { code: 'PNG', name: 'Pulau Pinang', region: 'west' },
    { code: 'PRK', name: 'Perak', region: 'west' },
    { code: 'PLS', name: 'Perlis', region: 'west' },
    { code: 'SGR', name: 'Selangor', region: 'west' },
    { code: 'TRG', name: 'Terengganu', region: 'west' },
    { code: 'KUL', name: 'W.P. Kuala Lumpur', region: 'west' },
    { code: 'PJY', name: 'W.P. Putrajaya', region: 'west' },
    // East Malaysia
    { code: 'SBH', name: 'Sabah', region: 'east' },
    { code: 'SWK', name: 'Sarawak', region: 'east' },
    { code: 'LBN', name: 'W.P. Labuan', region: 'east' },
];

function stateName(code: string): string {
    return MY_STATES.find(s => s.code === code)?.name ?? code;
}

// ─── Shipping Settings Tab ────────────────────────────────────────────────────

function ShippingSettingsTab({ shippingZones }: { shippingZones: ShippingZone[] }) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingZone, setEditingZone] = useState<ShippingZone | null>(null);
    const [countrySearch, setCountrySearch] = useState('');
    const [stateSearch, setStateSearch] = useState('');
    const [deleting, setDeleting] = useState<number | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<ShippingZone | null>(null);

    const form = useForm({
        name: '',
        countries: [] as string[],
        states: [] as string[],
        rate: '',
        rate_type: 'flat' as 'flat' | 'per_item',
        free_shipping_min: '',
        is_active: true,
        sort_order: 0,
    });

    const hasMY = form.data.countries.includes('MY');

    function openCreate() {
        setEditingZone(null);
        form.reset();
        form.setData({
            name: '',
            countries: [],
            states: [],
            rate: '',
            rate_type: 'flat',
            free_shipping_min: '',
            is_active: true,
            sort_order: 0,
        });
        setCountrySearch('');
        setStateSearch('');
        setDialogOpen(true);
    }

    function openEdit(zone: ShippingZone) {
        setEditingZone(zone);
        form.setData({
            name: zone.name,
            countries: zone.countries,
            states: zone.states ?? [],
            rate: String(zone.rate),
            rate_type: zone.rate_type,
            free_shipping_min: zone.free_shipping_min ? String(zone.free_shipping_min) : '',
            is_active: zone.is_active,
            sort_order: zone.sort_order,
        });
        setCountrySearch('');
        setStateSearch('');
        setDialogOpen(true);
    }

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (editingZone) {
            form.put(route('admin.shipping-zones.update', editingZone.id), {
                preserveScroll: true,
                onSuccess: () => setDialogOpen(false),
            });
        } else {
            form.post(route('admin.shipping-zones.store'), {
                preserveScroll: true,
                onSuccess: () => setDialogOpen(false),
            });
        }
    }

    function confirmDelete() {
        if (!deleteTarget) return;
        setDeleting(deleteTarget.id);
        router.delete(route('admin.shipping-zones.destroy', deleteTarget.id), {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(null);
                setDeleteTarget(null);
            },
        });
    }

    function toggleCountry(code: string) {
        const current = form.data.countries;
        if (current.includes(code)) {
            form.setData('countries', current.filter(c => c !== code));
            // Clear states if removing MY
            if (code === 'MY') {
                form.setData('states', []);
            }
        } else {
            form.setData('countries', [...current, code]);
        }
    }

    function removeCountry(code: string) {
        form.setData('countries', form.data.countries.filter(c => c !== code));
        if (code === 'MY') {
            form.setData('states', []);
        }
    }

    function toggleState(code: string) {
        const current = form.data.states;
        if (current.includes(code)) {
            form.setData('states', current.filter(s => s !== code));
        } else {
            form.setData('states', [...current, code]);
        }
    }

    function removeState(code: string) {
        form.setData('states', form.data.states.filter(s => s !== code));
    }

    function selectAllStates(region: 'west' | 'east') {
        const regionCodes = MY_STATES.filter(s => s.region === region).map(s => s.code);
        const currentStates = new Set(form.data.states);
        regionCodes.forEach(c => currentStates.add(c));
        form.setData('states', Array.from(currentStates));
    }

    // All country codes already assigned to other zones (excluding current editing zone)
    const assignedCodes = useMemo(() => {
        const codes = new Set<string>();
        shippingZones.forEach(z => {
            if (editingZone && z.id === editingZone.id) return;
            // Only block country if no states specified (whole-country zone)
            if (!z.states || z.states.length === 0) {
                z.countries.forEach(c => codes.add(c));
            }
        });
        return codes;
    }, [shippingZones, editingZone]);

    // State codes assigned to other zones
    const assignedStates = useMemo(() => {
        const codes = new Set<string>();
        shippingZones.forEach(z => {
            if (editingZone && z.id === editingZone.id) return;
            (z.states ?? []).forEach(s => codes.add(s));
        });
        return codes;
    }, [shippingZones, editingZone]);

    const filteredCountries = useMemo(() => {
        const q = countrySearch.toLowerCase();
        return COUNTRIES.filter(c =>
            c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
        );
    }, [countrySearch]);

    return (
        <div className="space-y-6">
            <Card className="rounded-xl border-border/60">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Truck className="h-5 w-5 text-primary" />
                                Shipping Zones
                            </CardTitle>
                            <CardDescription>
                                Manage shipping zones by country for event product delivery. Each zone defines a shipping rate applied during checkout.
                            </CardDescription>
                        </div>
                        <Button onClick={openCreate}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Zone
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {shippingZones.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Truck className="mx-auto h-12 w-12 mb-3 opacity-30" />
                            <p className="text-lg font-medium">No shipping zones configured</p>
                            <p className="text-sm mt-1">Create a shipping zone to set delivery rates for event products.</p>
                        </div>
                    ) : (
                        <div className="rounded-xl border border-border/60 overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/40 hover:bg-muted/40">
                                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Zone Name</TableHead>
                                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Countries</TableHead>
                                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rate</TableHead>
                                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Free Shipping Min</TableHead>
                                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {shippingZones.map(zone => (
                                    <TableRow key={zone.id}>
                                        <TableCell className="font-medium">{zone.name}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1 max-w-xs">
                                                {zone.countries.slice(0, 5).map(code => (
                                                    <Badge key={code} variant="secondary" className="text-xs">
                                                        {countryName(code)}
                                                    </Badge>
                                                ))}
                                                {zone.countries.length > 5 && (
                                                    <Badge variant="outline" className="text-xs">
                                                        +{zone.countries.length - 5} more
                                                    </Badge>
                                                )}
                                                {zone.states && zone.states.length > 0 && (
                                                    <div className="w-full mt-1 flex flex-wrap gap-1">
                                                        {zone.states.slice(0, 4).map(code => (
                                                            <Badge key={code} variant="outline" className="text-xs">
                                                                {stateName(code)}
                                                            </Badge>
                                                        ))}
                                                        {zone.states.length > 4 && (
                                                            <Badge variant="outline" className="text-xs">
                                                                +{zone.states.length - 4} more
                                                            </Badge>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-mono text-sm">
                                                RM {Number(zone.rate).toFixed(2)}
                                            </span>
                                            <span className="text-xs text-muted-foreground ml-1">
                                                / {zone.rate_type === 'per_item' ? 'item' : 'order'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {zone.free_shipping_min ? (
                                                <span className="text-sm">RM {Number(zone.free_shipping_min).toFixed(2)}</span>
                                            ) : (
                                                <span className="text-sm text-muted-foreground">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                                                zone.is_active
                                                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                                    : 'bg-muted/60 text-muted-foreground border-border'
                                            }`}>
                                                {zone.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => openEdit(zone)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setDeleteTarget(zone)}
                                                    disabled={deleting === zone.id}
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    {deleting === zone.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create / Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingZone ? 'Edit Shipping Zone' : 'Create Shipping Zone'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingZone
                                ? 'Update the shipping zone details and countries.'
                                : 'Define a new shipping zone with countries and delivery rate.'}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="zone-name">Zone Name</Label>
                            <Input
                                id="zone-name"
                                placeholder="e.g. Domestic, Southeast Asia, International"
                                value={form.data.name}
                                onChange={e => form.setData('name', e.target.value)}
                            />
                            {form.errors.name && (
                                <p className="text-sm text-destructive">{form.errors.name}</p>
                            )}
                        </div>

                        {/* Country Selector */}
                        <div className="space-y-2">
                            <Label>Countries</Label>

                            {/* Selected countries */}
                            {form.data.countries.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 p-2 rounded-md border bg-muted/30">
                                    {form.data.countries.map(code => (
                                        <Badge
                                            key={code}
                                            variant="secondary"
                                            className="gap-1 pr-1"
                                        >
                                            {countryName(code)}
                                            <button
                                                type="button"
                                                onClick={() => removeCountry(code)}
                                                className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            )}

                            {/* Search & select */}
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search countries..."
                                    value={countrySearch}
                                    onChange={e => setCountrySearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>

                            <div className="max-h-48 overflow-y-auto rounded-md border p-1 space-y-0.5">
                                {filteredCountries.map(country => {
                                    const isSelected = form.data.countries.includes(country.code);
                                    const isAssigned = assignedCodes.has(country.code);

                                    return (
                                        <button
                                            key={country.code}
                                            type="button"
                                            disabled={isAssigned && !isSelected}
                                            onClick={() => toggleCountry(country.code)}
                                            className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-sm text-left transition-colors ${
                                                isSelected
                                                    ? 'bg-primary/10 text-primary font-medium'
                                                    : isAssigned
                                                        ? 'text-muted-foreground/50 cursor-not-allowed'
                                                        : 'hover:bg-muted'
                                            }`}
                                        >
                                            <span>
                                                {country.name}
                                                <span className="ml-1 text-xs text-muted-foreground">({country.code})</span>
                                            </span>
                                            {isSelected && <Check className="h-4 w-4 text-primary" />}
                                            {isAssigned && !isSelected && (
                                                <span className="text-xs text-muted-foreground">assigned</span>
                                            )}
                                        </button>
                                    );
                                })}
                                {filteredCountries.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-3">
                                        No countries found.
                                    </p>
                                )}
                            </div>

                            {form.errors.countries && (
                                <p className="text-sm text-destructive">{form.errors.countries}</p>
                            )}
                        </div>

                        {/* Malaysian State Selector — shown when MY is selected */}
                        {hasMY && (
                            <div className="space-y-2">
                                <Label>Malaysian States (optional)</Label>
                                <p className="text-xs text-muted-foreground">
                                    Select specific states to create regional zones (e.g. West/East Malaysia). Leave empty to cover all of Malaysia.
                                </p>

                                {/* Selected states */}
                                {form.data.states.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 p-2 rounded-md border bg-muted/30">
                                        {form.data.states.map(code => (
                                            <Badge key={code} variant="secondary" className="gap-1 pr-1">
                                                {stateName(code)}
                                                <button
                                                    type="button"
                                                    onClick={() => removeState(code)}
                                                    className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                )}

                                {/* Quick select buttons */}
                                <div className="flex gap-2">
                                    <Button type="button" variant="outline" size="sm" onClick={() => selectAllStates('west')}>
                                        Select West Malaysia
                                    </Button>
                                    <Button type="button" variant="outline" size="sm" onClick={() => selectAllStates('east')}>
                                        Select East Malaysia
                                    </Button>
                                </div>

                                {/* Search & select */}
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search states..."
                                        value={stateSearch}
                                        onChange={e => setStateSearch(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>

                                <div className="max-h-48 overflow-y-auto rounded-md border p-1 space-y-0.5">
                                    {MY_STATES
                                        .filter(s => {
                                            const q = stateSearch.toLowerCase();
                                            return s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q);
                                        })
                                        .map(state => {
                                            const isSelected = form.data.states.includes(state.code);
                                            const isAssigned = assignedStates.has(state.code);

                                            return (
                                                <button
                                                    key={state.code}
                                                    type="button"
                                                    disabled={isAssigned && !isSelected}
                                                    onClick={() => toggleState(state.code)}
                                                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-sm text-left transition-colors ${
                                                        isSelected
                                                            ? 'bg-primary/10 text-primary font-medium'
                                                            : isAssigned
                                                                ? 'text-muted-foreground/50 cursor-not-allowed'
                                                                : 'hover:bg-muted'
                                                    }`}
                                                >
                                                    <span>
                                                        {state.name}
                                                        <span className="ml-1 text-xs text-muted-foreground">
                                                            ({state.region === 'west' ? 'Peninsular' : 'East'})
                                                        </span>
                                                    </span>
                                                    {isSelected && <Check className="h-4 w-4 text-primary" />}
                                                    {isAssigned && !isSelected && (
                                                        <span className="text-xs text-muted-foreground">assigned</span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                </div>

                                {form.errors.states && (
                                    <p className="text-sm text-destructive">{form.errors.states}</p>
                                )}
                            </div>
                        )}

                        {/* Rate */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="zone-rate">Shipping Rate (RM)</Label>
                                <Input
                                    id="zone-rate"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={form.data.rate}
                                    onChange={e => form.setData('rate', e.target.value)}
                                />
                                {form.errors.rate && (
                                    <p className="text-sm text-destructive">{form.errors.rate}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="zone-rate-type">Rate Type</Label>
                                <Select
                                    value={form.data.rate_type}
                                    onValueChange={val => form.setData('rate_type', val as 'flat' | 'per_item')}
                                >
                                    <SelectTrigger id="zone-rate-type">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="flat">Flat rate per order</SelectItem>
                                        <SelectItem value="per_item">Per item</SelectItem>
                                    </SelectContent>
                                </Select>
                                {form.errors.rate_type && (
                                    <p className="text-sm text-destructive">{form.errors.rate_type}</p>
                                )}
                            </div>
                        </div>

                        {/* Free shipping threshold */}
                        <div className="space-y-2">
                            <Label htmlFor="zone-free-min">Free Shipping Minimum (RM)</Label>
                            <Input
                                id="zone-free-min"
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="Leave empty to disable"
                                value={form.data.free_shipping_min}
                                onChange={e => form.setData('free_shipping_min', e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Orders above this amount qualify for free shipping. Leave empty to disable.
                            </p>
                            {form.errors.free_shipping_min && (
                                <p className="text-sm text-destructive">{form.errors.free_shipping_min}</p>
                            )}
                        </div>

                        {/* Active toggle */}
                        <div className="flex items-center justify-between rounded-xl border border-border/60 p-4">
                            <div className="space-y-0.5">
                                <Label htmlFor="zone-active" className="text-base">Active</Label>
                                <p className="text-sm text-muted-foreground">
                                    Enable this shipping zone for checkout.
                                </p>
                            </div>
                            <Switch
                                id="zone-active"
                                checked={form.data.is_active}
                                onCheckedChange={(checked) => form.setData('is_active', checked)}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={form.processing}>
                                {form.processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingZone ? 'Update Zone' : 'Create Zone'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <Trash2 className="h-5 w-5" />
                            Delete Shipping Zone
                        </DialogTitle>
                        <DialogDescription>
                            This will permanently remove the zone <strong className="text-foreground">{deleteTarget?.name}</strong> and its rate configuration.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={confirmDelete}
                            disabled={deleting === deleteTarget?.id}
                        >
                            {deleting === deleteTarget?.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Zone
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function SettingsIndex({ tab, smtp, chipin, general, booking, notifications, invoicing, localisation, shippingZones }: Props) {
    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                        <Settings className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">System Settings</h1>
                        <p className="text-sm text-muted-foreground">
                            Manage email, payments, booking rules, and localisation.
                        </p>
                    </div>
                </div>

                <Tabs defaultValue={tab} className="space-y-6">
                    <TabsList className="flex-wrap h-auto gap-1 p-1.5">
                        <TabsTrigger value="general" className="gap-2">
                            <Settings className="h-4 w-4" />
                            General
                        </TabsTrigger>
                        <TabsTrigger value="smtp" className="gap-2">
                            <Mail className="h-4 w-4" />
                            SMTP Mail
                        </TabsTrigger>
                        <TabsTrigger value="payment" className="gap-2">
                            <CreditCard className="h-4 w-4" />
                            Payment
                        </TabsTrigger>
                        <TabsTrigger value="booking" className="gap-2">
                            <CalendarCheck className="h-4 w-4" />
                            Booking Rules
                        </TabsTrigger>
                        <TabsTrigger value="notifications" className="gap-2">
                            <Bell className="h-4 w-4" />
                            Notifications
                        </TabsTrigger>
                        <TabsTrigger value="invoicing" className="gap-2">
                            <FileText className="h-4 w-4" />
                            Invoicing
                        </TabsTrigger>
                        <TabsTrigger value="localisation" className="gap-2">
                            <Globe className="h-4 w-4" />
                            Localisation
                        </TabsTrigger>
                        <TabsTrigger value="shipping" className="gap-2">
                            <Truck className="h-4 w-4" />
                            Shipping
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="general">
                        <GeneralSettingsTab general={general} />
                    </TabsContent>

                    <TabsContent value="smtp">
                        <SmtpSettingsTab smtp={smtp} />
                    </TabsContent>

                    <TabsContent value="payment">
                        <ChipInSettingsTab chipin={chipin} />
                    </TabsContent>

                    <TabsContent value="booking">
                        <BookingSettingsTab booking={booking} />
                    </TabsContent>

                    <TabsContent value="notifications">
                        <NotificationSettingsTab notifications={notifications} />
                    </TabsContent>

                    <TabsContent value="invoicing">
                        <InvoicingSettingsTab invoicing={invoicing} />
                    </TabsContent>

                    <TabsContent value="localisation">
                        <LocalisationSettingsTab localisation={localisation} />
                    </TabsContent>

                    <TabsContent value="shipping">
                        <ShippingSettingsTab shippingZones={shippingZones} />
                    </TabsContent>
                </Tabs>
            </div>
        </AdminLayout>
    );
}
