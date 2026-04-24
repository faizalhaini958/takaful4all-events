<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RestrictAdminFromUserDashboard
{
    /**
     * Prevent administrative roles from accessing customer dashboard routes.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && in_array($user->role, ['admin', 'editor', 'checkin_staff'])) {
            return redirect()->route('admin.dashboard');
        }

        return $next($request);
    }
}
