<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Restrict checkin_staff users to only event listing and check-in scanner routes.
 * This middleware is applied to all admin routes and only acts on checkin_staff users.
 */
class RestrictCheckinStaff
{
    /**
     * Allowed route name patterns for checkin_staff role.
     */
    private const ALLOWED_ROUTES = [
        'admin.dashboard',
        'admin.events.index',
        'admin.events.check-in',
        'admin.events.check-in.lookup',
        'admin.events.check-in.confirm',
        'admin.profile.edit',
        'admin.profile.update',
        'admin.profile.destroy',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Only restrict checkin_staff; all other roles pass through
        if (!$user || $user->role !== 'checkin_staff') {
            return $next($request);
        }

        $routeName = $request->route()?->getName();

        if ($routeName && in_array($routeName, self::ALLOWED_ROUTES, true)) {
            return $next($request);
        }

        abort(403, 'You do not have access to this section.');
    }
}
