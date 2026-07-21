<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Symfony\Component\HttpFoundation\Response;

class VerifyRecaptcha
{
    /**
     * Minimum reCAPTCHA v3 score to accept (0.0 = bot, 1.0 = human).
     */
    private const SCORE_THRESHOLD = 0.5;

    public function handle(Request $request, Closure $next): Response
    {
        $secretKey = config('services.recaptcha.secret');

        // Skip verification when running tests/locally or if no key is configured yet.
        if (app()->environment('testing', 'local') || empty($secretKey)) {
            return $next($request);
        }

        $token = $request->input('recaptcha_token');

        // If no token (e.g. ad blocker blocked reCAPTCHA script), allow through silently.
        if (empty($token)) {
            return $next($request);
        }

        $response = Http::timeout(5)->asForm()->post('https://www.google.com/recaptcha/api/siteverify', [
            'secret'   => $secretKey,
            'response' => $token,
            'remoteip' => $request->ip(),
        ]);

        // If Google API is unreachable, allow through rather than blocking all users.
        if (!$response->successful()) {
            return $next($request);
        }

        $result = $response->json();

        if (!($result['success'] ?? false) || ($result['score'] ?? 0) < self::SCORE_THRESHOLD) {
            return $this->fail($request, 'CAPTCHA score too low. Your request was flagged as suspicious.');
        }

        return $next($request);
    }

    private function fail(Request $request, string $message): Response
    {
        if ($request->expectsJson() || $request->header('X-Inertia')) {
            return back()->withErrors(['recaptcha_token' => $message]);
        }

        return back()->withErrors(['recaptcha_token' => $message]);
    }
}
