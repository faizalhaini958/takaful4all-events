<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Models\ShippingZone;
use App\Services\ChipInService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;

class SettingController extends Controller
{
    /**
     * Show the settings page.
     */
    public function index(Request $request): Response
    {
        $tab = $request->query('tab', 'smtp');

        return Inertia::render('Admin/Settings/Index', [
            'tab'            => $tab,
            'smtp'           => Setting::getGroup('smtp'),
            'chipin'         => $this->getChipInSettings(),
            'general'        => Setting::getGroup('general'),
            'booking'        => Setting::getGroup('booking'),
            'notifications'  => Setting::getGroup('notifications'),
            'invoicing'      => Setting::getGroup('invoicing'),
            'localisation'   => Setting::getGroup('localisation'),
            'shippingZones'  => ShippingZone::ordered()->get(),
        ]);
    }

    /**
     * Update SMTP settings.
     */
    public function updateSmtp(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'host'        => 'required|string|max:255',
            'port'        => 'required|integer|min:1|max:65535',
            'encryption'  => 'nullable|in:tls,ssl,none',
            'username'    => 'nullable|string|max:255',
            'password'    => 'nullable|string|max:255',
            'from_address' => 'required|email|max:255',
            'from_name'   => 'required|string|max:255',
        ]);

        // Convert 'none' encryption to null
        if (($validated['encryption'] ?? null) === 'none') {
            $validated['encryption'] = null;
        }

        Setting::setGroup('smtp', $validated, ['password']);

        return back()->with('success', 'SMTP settings updated successfully.');
    }

    /**
     * Send a test email using the current SMTP settings.
     */
    public function testSmtp(Request $request): RedirectResponse
    {
        $request->validate([
            'test_email' => 'required|email',
        ]);

        $smtp = Setting::getGroup('smtp');

        if (empty($smtp['host']) || empty($smtp['from_address'])) {
            return back()->with('error', 'Please save SMTP settings first.');
        }

        try {
            // Temporarily override mail config
            config([
                'mail.mailers.smtp.host'       => $smtp['host'],
                'mail.mailers.smtp.port'       => (int) $smtp['port'],
                'mail.mailers.smtp.encryption' => $smtp['encryption'] ?: null,
                'mail.mailers.smtp.username'   => $smtp['username'],
                'mail.mailers.smtp.password'   => $smtp['password'],
                'mail.from.address'            => $smtp['from_address'],
                'mail.from.name'               => $smtp['from_name'],
            ]);

            Mail::raw('This is a test email from your Takaful Events system. Your SMTP configuration is working correctly!', function ($message) use ($request, $smtp) {
                $message->to($request->test_email)
                    ->from($smtp['from_address'], $smtp['from_name'])
                    ->subject('SMTP Test - Takaful Events');
            });

            return back()->with('success', 'Test email sent successfully to ' . $request->test_email);
        } catch (\Throwable $e) {
            return back()->with('error', 'Failed to send test email: ' . $e->getMessage());
        }
    }

    /**
     * Update Chip-In payment gateway settings.
     */
    public function updateChipIn(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'secret_key'       => 'required|string|max:500',
            'brand_id'         => 'required|string|max:100',
            'webhook_secret'   => 'nullable|string|max:5000',
            'success_redirect' => 'nullable|url|max:500',
            'failure_redirect' => 'nullable|url|max:500',
            'send_receipt'     => 'nullable|in:0,1',
            'is_test_mode'     => 'nullable|in:0,1',
        ]);

        Setting::setGroup('chipin', $validated, ['secret_key', 'webhook_secret']);

        return back()->with('success', 'Payment gateway settings updated successfully.');
    }

    /**
     * Test Chip-In API connection.
     */
    public function testChipIn(Request $request): RedirectResponse
    {
        $request->validate([
            'secret_key' => 'required|string',
            'brand_id'   => 'required|string',
        ]);

        $result = ChipInService::testConnection(
            $request->secret_key,
            $request->brand_id
        );

        if ($result['success']) {
            return back()->with('success', 'Chip-In API connection successful!');
        }

        return back()->with('error', $result['message']);
    }

    /**
     * Update General settings.
     */
    public function updateGeneral(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'site_name'          => 'nullable|string|max:255',
            'site_logo'          => 'nullable|string|max:500',
            'footer_text'        => 'nullable|string|max:1000',
            'contact_email'      => 'nullable|email|max:255',
            'contact_phone'      => 'nullable|string|max:50',
        ]);

        Setting::setGroup('general', $validated);

        return back()->with('success', 'General settings updated successfully.');
    }

    /**
     * Update Booking Rules settings.
     */
    public function updateBooking(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'default_max_attendees'      => 'nullable|integer|min:1|max:10000',
            'default_require_approval'   => 'nullable|in:0,1',
            'registration_cutoff_hours'  => 'nullable|integer|min:0|max:720',
            'waitlist_enabled'           => 'nullable|in:0,1',
        ]);

        Setting::setGroup('booking', $validated);

        return back()->with('success', 'Booking rules updated successfully.');
    }

    /**
     * Update Notification settings.
     */
    public function updateNotifications(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'send_confirmation_email' => 'nullable|in:0,1',
            'send_reminder_email'     => 'nullable|in:0,1',
            'reminder_hours'          => 'nullable|integer|min:1|max:168',
            'send_cancellation_email' => 'nullable|in:0,1',
        ]);

        Setting::setGroup('notifications', $validated);

        return back()->with('success', 'Notification settings updated successfully.');
    }

    /**
     * Update Invoicing settings.
     */
    public function updateInvoicing(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'company_name'            => 'nullable|string|max:255',
            'company_registration_no' => 'nullable|string|max:100',
            'company_address'         => 'nullable|string|max:1000',
            'invoice_prefix'          => 'nullable|string|max:20',
            'tax_rate'                => 'nullable|numeric|min:0|max:100',
        ]);

        Setting::setGroup('invoicing', $validated);

        return back()->with('success', 'Invoicing settings updated successfully.');
    }

    /**
     * Update Localisation settings.
     */
    public function updateLocalisation(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'default_locale'   => 'required|in:en,ms',
            'enable_en'        => 'nullable|in:0,1',
            'enable_ms'        => 'nullable|in:0,1',
        ]);

        Setting::setGroup('localisation', $validated);

        return back()->with('success', 'Localisation settings updated successfully.');
    }

    /**
     * Check existing Chip-In webhook endpoints.
     */
    public function checkChipInWebhook(): JsonResponse
    {
        $chipIn = new ChipInService();

        if (! $chipIn->isConfigured()) {
            return response()->json(['error' => 'Chip-In is not configured.'], 422);
        }

        $result = $chipIn->listWebhookEndpoints();

        if (! $result['success']) {
            return response()->json(['error' => $result['error']], 500);
        }

        $webhookUrl = url('/webhooks/chipin');
        $endpoints  = $result['data'] ?? [];
        $existing   = collect($endpoints)->first(fn ($ep) => ($ep['url'] ?? '') === $webhookUrl);

        return response()->json([
            'endpoints'    => $endpoints,
            'webhook_url'  => $webhookUrl,
            'is_registered' => ! empty($existing),
            'existing'     => $existing,
        ]);
    }

    /**
     * Register the webhook URL with Chip-In.
     */
    public function createChipInWebhook(): JsonResponse
    {
        $chipIn = new ChipInService();

        if (! $chipIn->isConfigured()) {
            return response()->json(['error' => 'Chip-In is not configured.'], 422);
        }

        $webhookUrl = url('/webhooks/chipin');

        // Check if already registered
        $listResult = $chipIn->listWebhookEndpoints();
        if ($listResult['success']) {
            $existing = collect($listResult['data'] ?? [])->first(fn ($ep) => ($ep['url'] ?? '') === $webhookUrl);
            if ($existing) {
                return response()->json([
                    'message'  => 'Webhook URL is already registered.',
                    'endpoint' => $existing,
                ]);
            }
        }

        $result = $chipIn->createWebhookEndpoint($webhookUrl);

        if (! $result['success']) {
            return response()->json(['error' => $result['error']], 500);
        }

        return response()->json([
            'message'  => 'Webhook URL registered successfully.',
            'endpoint' => $result['data'],
        ]);
    }

    /**
     * Get Chip-In settings (with secrets masked for display).
     */
    private function getChipInSettings(): array
    {
        $settings = Setting::getGroup('chipin');

        return [
            'secret_key'       => $settings['secret_key'] ?? '',
            'brand_id'         => $settings['brand_id'] ?? '',
            'webhook_secret'   => $settings['webhook_secret'] ?? '',
            'success_redirect' => $settings['success_redirect'] ?? '',
            'failure_redirect' => $settings['failure_redirect'] ?? '',
            'send_receipt'     => $settings['send_receipt'] ?? '0',
            'is_test_mode'     => $settings['is_test_mode'] ?? '1',
        ];
    }
}
