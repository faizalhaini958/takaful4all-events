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
     * Test the API connection with the provided credentials.
     */
    public static function testConnection(string $secretKey, string $brandId): array
    {
        try {
            $response = Http::withToken($secretKey)
                ->timeout(10)
                ->get("https://gate.chip-in.asia/api/v1/payment_methods/", [
                    'brand_id' => $brandId,
                ]);

            if ($response->successful()) {
                return ['success' => true, 'message' => 'Connection successful'];
            }

            return [
                'success' => false,
                'message' => 'API returned status ' . $response->status() . ': ' . ($response->json('__all__') ?? 'Unknown error'),
            ];
        } catch (\Throwable $e) {
            return ['success' => false, 'message' => 'Connection failed: ' . $e->getMessage()];
        }
    }
}
