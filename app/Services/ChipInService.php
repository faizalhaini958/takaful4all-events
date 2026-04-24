<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\Setting;

class ChipInService
{
    protected string $baseUrl = 'https://gate.chip-in.asia/api/v1';
    protected bool $isTestMode = false;
    protected ?string $secretKey;
    protected ?string $brandId;

    public function __construct()
    {
        $settings = Setting::getCached('chipin');
        $this->isTestMode = ($settings['is_test_mode'] ?? '1') === '1';
        $this->baseUrl = self::resolveBaseUrl($this->isTestMode);
        $this->secretKey = $settings['secret_key'] ?? null;
        $this->brandId   = $settings['brand_id']   ?? null;
    }

    /**
     * Whether Chip-In is running in test mode from settings.
     */
    public function isTestMode(): bool
    {
        return $this->isTestMode;
    }

    /**
     * Check if the service is configured.
     */
    public function isConfigured(): bool
    {
        return ! empty($this->secretKey) && ! empty($this->brandId);
    }

    /**
     * Create a purchase (payment).
     */
    public function createPurchase(array $data): array
    {
        $payload = array_merge([
            'brand_id' => $this->brandId,
        ], $data);

        if ($this->isTestMode) {
            // Hint to gateway that this purchase is intended for test mode.
            $payload['is_test'] = true;
        }

        $response = Http::withToken($this->secretKey)
            ->post("{$this->baseUrl}/purchases/", $payload);

        // Backward-compatibility: some gateway versions may reject unknown `is_test` field.
        if ($response->failed() && $this->isTestMode) {
            $errorBody = $response->json();
            $errorText = is_array($errorBody) ? json_encode($errorBody) : (string) $response->body();
            if (str_contains(strtolower((string) $errorText), 'is_test')) {
                unset($payload['is_test']);
                $response = Http::withToken($this->secretKey)
                    ->post("{$this->baseUrl}/purchases/", $payload);
            }
        }

        if ($response->failed()) {
            Log::error('ChipIn createPurchase failed', [
                'status' => $response->status(),
                'body'   => $response->json(),
            ]);

            return [
                'success' => false,
                'error'   => $response->json('__all__', 'Payment creation failed'),
                'status'  => $response->status(),
            ];
        }

        return [
            'success'      => true,
            'data'         => $response->json(),
            'checkout_url' => $response->json('checkout_url'),
            'is_test'      => self::normalizeBool($response->json('is_test', false)),
        ];
    }

    /**
     * Retrieve a purchase by ID.
     */
    public function getPurchase(string $purchaseId): array
    {
        $response = Http::withToken($this->secretKey)
            ->get("{$this->baseUrl}/purchases/{$purchaseId}/");

        if ($response->failed()) {
            return ['success' => false, 'error' => 'Failed to retrieve purchase'];
        }

        return ['success' => true, 'data' => $response->json()];
    }

    /**
     * Verify webhook payload using the public key.
     */
    public static function verifyWebhookSignature(string $payload, string $signature, string $publicKey): bool
    {
        try {
            $publicKeyResource = openssl_pkey_get_public($publicKey);
            if (! $publicKeyResource) {
                return false;
            }

            $decodedSignature = base64_decode($signature);
            $result = openssl_verify($payload, $decodedSignature, $publicKeyResource, OPENSSL_ALGO_SHA256);

            return $result === 1;
        } catch (\Throwable $e) {
            Log::error('ChipIn webhook signature verification failed', ['error' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * List webhook endpoints for the current brand.
     */
    public function listWebhookEndpoints(): array
    {
        $response = Http::withToken($this->secretKey)
            ->get("{$this->baseUrl}/webhook_endpoints/", [
                'brand_id' => $this->brandId,
            ]);

        if ($response->failed()) {
            Log::error('ChipIn listWebhookEndpoints failed', [
                'status' => $response->status(),
                'body'   => $response->body(),
            ]);
            return ['success' => false, 'error' => 'Failed to list webhook endpoints'];
        }

        return ['success' => true, 'data' => $response->json('results', $response->json())];
    }

    /**
     * Create a webhook endpoint.
     */
    public function createWebhookEndpoint(string $url, array $events = []): array
    {
        $payload = [
            'brand_id' => $this->brandId,
            'url'      => $url,
            'events'   => $events ?: [
                'purchase.paid',
                'purchase.payment_failure',
                'purchase.cancelled',
                'payment.refunded',
                'purchase.pending_execute',
            ],
        ];

        $response = Http::withToken($this->secretKey)
            ->post("{$this->baseUrl}/webhook_endpoints/", $payload);

        if ($response->failed()) {
            $raw = $response->json('__all__') ?? $response->json('detail') ?? $response->json('error') ?? 'Webhook creation failed';
            if (is_array($raw)) {
                $raw = implode(' ', array_map(fn($v) => is_array($v) ? json_encode($v) : (string) $v, $raw));
            }

            Log::error('ChipIn createWebhookEndpoint failed', [
                'status' => $response->status(),
                'body'   => $response->body(),
            ]);

            return [
                'success' => false,
                'error'   => (string) $raw,
                'status'  => $response->status(),
            ];
        }

        return ['success' => true, 'data' => $response->json()];
    }

    /**
     * Delete a webhook endpoint by ID.
     */
    public function deleteWebhookEndpoint(string $endpointId): array
    {
        $response = Http::withToken($this->secretKey)
            ->delete("{$this->baseUrl}/webhook_endpoints/{$endpointId}/");

        if ($response->failed()) {
            return ['success' => false, 'error' => 'Failed to delete webhook endpoint'];
        }

        return ['success' => true];
    }

    /**
     * Test the API connection with the provided credentials.
     */
    public static function testConnection(string $secretKey, string $brandId, ?bool $isTestMode = null): array
    {
        try {
            if ($isTestMode === null) {
                $isTestMode = Setting::get('chipin', 'is_test_mode', '1') === '1';
            }

            $baseUrl = self::resolveBaseUrl($isTestMode);

            $response = Http::withToken($secretKey)
                ->timeout(10)
                ->get("{$baseUrl}/payment_methods/", [
                    'brand_id' => $brandId,
                    'currency' => 'MYR',
                ]);

            Log::debug('ChipIn testConnection response', [
                'status' => $response->status(),
                'body'   => $response->body(),
            ]);

            if ($response->successful()) {
                return ['success' => true, 'message' => 'Connection successful'];
            }

            $body = $response->json() ?? [];
            $raw  = $body['__all__'] ?? $body['detail'] ?? $body['message'] ?? $body['error'] ?? null;

            if (is_array($raw)) {
                $raw = implode(' ', array_map(
                    fn($v) => is_array($v) ? json_encode($v) : (string) $v,
                    $raw
                ));
            }

            $errorMsg = is_array($raw) ? json_encode($raw) : ($raw ? (string) $raw : 'HTTP ' . $response->status());

            return ['success' => false, 'message' => 'Connection failed: ' . $errorMsg];
        } catch (\Throwable $e) {
            Log::error('ChipIn testConnection exception', [
                'class'   => get_class($e),
                'message' => $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
            ]);
            return ['success' => false, 'message' => 'Connection failed: ' . $e->getMessage()];
        }
    }

    /**
     * Resolve API base URL based on mode.
     */
    private static function resolveBaseUrl(bool $isTestMode): string
    {
        $liveBaseUrl = rtrim((string) config('services.chipin.base_url', 'https://gate.chip-in.asia/api/v1'), '/');
        $testBaseUrl = rtrim((string) config('services.chipin.test_base_url', $liveBaseUrl), '/');

        return $isTestMode ? $testBaseUrl : $liveBaseUrl;
    }

    /**
     * Normalize mixed boolean-like API values safely.
     */
    private static function normalizeBool(mixed $value): bool
    {
        if (is_bool($value)) {
            return $value;
        }

        if (is_int($value) || is_float($value)) {
            return ((int) $value) === 1;
        }

        if (is_string($value)) {
            $normalized = strtolower(trim($value));

            if (in_array($normalized, ['1', 'true', 'yes', 'on'], true)) {
                return true;
            }

            if (in_array($normalized, ['0', 'false', 'no', 'off', ''], true)) {
                return false;
            }
        }

        return false;
    }
}
