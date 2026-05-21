<?php

namespace App\Providers;

use App\Models\EventRegistration;
use App\Models\Setting;
use App\Observers\EventRegistrationObserver;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Fix DomPDF "Cannot resolve public path" on shared hosting
        // Allows explicit public path override via APP_PUBLIC_PATH env variable
        $this->app->bind('path.public', function () {
            return env('APP_PUBLIC_PATH', base_path('public'));
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        EventRegistration::observe(EventRegistrationObserver::class);

        // Load SMTP settings from database and override config
        $this->configureMail();

        $this->configureRateLimiting();
    }

    protected function configureRateLimiting(): void
    {
        // Event registration: 5 submissions per IP per 10 minutes
        RateLimiter::for('event-registration', function (Request $request) {
            return Limit::perMinutes(10, 5)
                ->by($request->ip())
                ->response(function () {
                    return back()->withErrors([
                        'rate_limit' => 'Too many registration attempts. Please wait a few minutes before trying again.',
                    ]);
                });
        });

        // User account registration: 5 attempts per IP per 10 minutes
        RateLimiter::for('user-registration', function (Request $request) {
            return Limit::perMinutes(10, 5)
                ->by($request->ip())
                ->response(function () {
                    return back()->withErrors([
                        'rate_limit' => 'Too many registration attempts. Please wait a few minutes before trying again.',
                    ]);
                });
        });

        // Forgot password: 5 requests per IP per 10 minutes
        RateLimiter::for('forgot-password', function (Request $request) {
            return Limit::perMinutes(10, 5)
                ->by($request->ip());
        });
    }

    /**
     * Configure mail settings from database.
     */
    protected function configureMail(): void
    {
        try {
            $smtp = Setting::getCached('smtp');

            if (! empty($smtp['host'])) {
                Config::set('mail.mailers.smtp.host', $smtp['host']);
            }
            if (! empty($smtp['port'])) {
                Config::set('mail.mailers.smtp.port', $smtp['port']);
            }
            if (! empty($smtp['username'])) {
                Config::set('mail.mailers.smtp.username', $smtp['username']);
            }
            if (! empty($smtp['password'])) {
                Config::set('mail.mailers.smtp.password', $smtp['password']);
            }
            if (! empty($smtp['encryption'])) {
                Config::set('mail.mailers.smtp.encryption', $smtp['encryption']);
            }
            if (! empty($smtp['from_address'])) {
                Config::set('mail.from.address', $smtp['from_address']);
            }
            if (! empty($smtp['from_name'])) {
                Config::set('mail.from.name', $smtp['from_name']);
            }
        } catch (\Throwable $e) {
            // Silently fail if database not available (e.g., during migrations)
            report($e);
        }
    }
}
