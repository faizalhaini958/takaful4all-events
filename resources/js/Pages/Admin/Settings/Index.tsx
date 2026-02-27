import { useForm, usePage, router } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Button } from '@/Components/ui/button';
import { Switch } from '@/Components/ui/switch';
import { Badge } from '@/Components/ui/badge';
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
} from 'lucide-react';

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

interface Props {
    tab: string;
    smtp: SmtpSettings;
    chipin: ChipInSettings;
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
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
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
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Send className="h-5 w-5" />
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

    return (
        <div className="space-y-6">
            {/* API Credentials */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
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

                        <div className="flex items-center justify-between rounded-lg border p-4">
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

                        <div className="flex items-center justify-between rounded-lg border p-4">
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
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Webhook className="h-5 w-5" />
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
                            <div className="flex-1 rounded-md border bg-muted/50 px-3 py-2 text-sm font-mono">
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
                            Copy this URL and add it as a webhook endpoint in your Chip-In dashboard.
                        </p>
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
                        <div className="rounded-md border bg-muted/30 p-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                {[
                                    { event: 'purchase.paid', description: 'Payment completed successfully' },
                                    { event: 'purchase.payment_failure', description: 'Payment attempt failed' },
                                    { event: 'purchase.cancelled', description: 'Purchase was cancelled' },
                                    { event: 'purchase.pending_execute', description: 'Payment is processing' },
                                    { event: 'payment.refunded', description: 'Payment was refunded' },
                                ].map(item => (
                                    <div key={item.event} className="flex items-start gap-2">
                                        <Shield className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
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
                    <div className="rounded-lg border border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/30 p-4">
                        <div className="flex gap-3">
                            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                            <div className="space-y-2 text-sm">
                                <p className="font-medium text-blue-900 dark:text-blue-200">Webhook Setup Instructions</p>
                                <ol className="list-decimal list-inside space-y-1 text-blue-800 dark:text-blue-300">
                                    <li>Go to your <a href="https://portal.chip-in.asia/collect/developers" target="_blank" rel="noopener noreferrer" className="underline">Chip-In Developer Portal</a></li>
                                    <li>Navigate to the Webhooks section</li>
                                    <li>Create a new webhook with the URL shown above</li>
                                    <li>Select the events: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded text-xs">purchase.paid</code>, <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded text-xs">purchase.payment_failure</code>, <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded text-xs">purchase.cancelled</code>, <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded text-xs">payment.refunded</code></li>
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

export default function SettingsIndex({ tab, smtp, chipin }: Props) {
    return (
        <AdminLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">System Settings</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your email and payment gateway configurations.
                    </p>
                </div>

                <Tabs defaultValue={tab} className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="smtp" className="gap-2">
                            <Mail className="h-4 w-4" />
                            SMTP Mail
                        </TabsTrigger>
                        <TabsTrigger value="payment" className="gap-2">
                            <CreditCard className="h-4 w-4" />
                            Payment Gateway
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="smtp">
                        <SmtpSettingsTab smtp={smtp} />
                    </TabsContent>

                    <TabsContent value="payment">
                        <ChipInSettingsTab chipin={chipin} />
                    </TabsContent>
                </Tabs>
            </div>
        </AdminLayout>
    );
}
