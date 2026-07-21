<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Symfony\Component\HttpFoundation\RedirectResponse as SymfonyRedirectResponse;
use Throwable;

class GoogleAuthController extends Controller
{
    /**
     * Redirect the user to Google's OAuth consent screen.
     */
    public function redirect(Request $request): SymfonyRedirectResponse
    {
        // Store return_to in session so we can use it after the OAuth callback
        $returnTo = $request->query('return_to');
        if ($returnTo && is_string($returnTo) && preg_match('#^/[^/]#', $returnTo)) {
            session()->put('google_oauth_return_to', $returnTo);
        }

        return Socialite::driver('google')
            ->scopes(['openid', 'profile', 'email'])
            ->redirect();
    }

    /**
     * Handle the OAuth callback from Google.
     */
    public function callback(): RedirectResponse
    {
        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (Throwable $e) {
            return redirect()->route('login')->withErrors([
                'email' => __('Unable to sign in with Google. Please try again.'),
            ]);
        }

        $email = $googleUser->getEmail();

        if (! $email) {
            return redirect()->route('login')->withErrors([
                'email' => __('Your Google account did not return an email address.'),
            ]);
        }

        // Match by google_id first, then fall back to email to link existing accounts.
        $user = User::where('google_id', $googleUser->getId())->first()
            ?? User::where('email', $email)->first();

        if ($user) {
            $updates = [];

            if (empty($user->google_id)) {
                $updates['google_id'] = $googleUser->getId();
            }
            if (empty($user->avatar) && $googleUser->getAvatar()) {
                $updates['avatar'] = $googleUser->getAvatar();
            }
            if (empty($user->email_verified_at)) {
                $updates['email_verified_at'] = now();
            }

            if (! empty($updates)) {
                $user->forceFill($updates)->save();
            }
        } else {
            $user = User::create([
                'name' => $googleUser->getName() ?: Str::before($email, '@'),
                'email' => $email,
                'google_id' => $googleUser->getId(),
                'avatar' => $googleUser->getAvatar(),
                'password' => null,
                'role' => 'public',
                'email_verified_at' => now(),
            ]);
        }

        Auth::login($user, remember: true);

        request()->session()->regenerate();

        // Honor return_to from session (set in redirect() method, e.g. from registration page)
        $returnTo = session()->pull('google_oauth_return_to');
        if ($returnTo && is_string($returnTo) && preg_match('#^/[^/]#', $returnTo)) {
            return redirect($returnTo);
        }

        $redirectRoute = in_array($user->role, ['admin', 'checkin_staff'], true)
            ? route('admin.dashboard', absolute: false)
            : route('user.dashboard', absolute: false);

        return redirect()->intended($redirectRoute);
    }
}
