<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\Setting;

class ChipInService
{
    protected string $baseUrl = 'https://gate.chip-in.asia/api/v1';
    protected ?string $secretKey;
    protected ?string $brandId;

    public function __construct()
    {
        $settings = Setting::getCached('chipin');
        $this->secretKey = $settings['secret_key'] ?? null;
        $this->brandId   = $settings['brand_id']   ?? null;
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

        $response = Http::withToken($this->secretKey)
            ->post("{$this->baseUrl}/purchases/", $payload);

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
    public static function testConnection(string $secretKey, string $brandId): array
    {
        try {
            $response = Http::withToken($secretKey)
                ->timeout(10)
                ->get('https://gate.chip-in.asia/api/v1/payment_methods/', [
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
}
