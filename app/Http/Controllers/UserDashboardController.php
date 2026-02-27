<?php

namespace App\Http\Controllers;

use App\Models\EventRegistration;
use App\Models\UserPaymentMethod;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class UserDashboardController extends Controller
{
    // ─── Dashboard ────────────────────────────────────────────────────────────

    public function index(Request $request): Response
    {
        $email = $request->user()->email;

        $registrations = EventRegistration::where('email', $email)
            ->with(['event', 'ticket'])
            ->latest()
            ->get();

        $upcomingRegistrations = $registrations
            ->filter(fn ($r) => $r->event && $r->event->start_at?->isFuture() && $r->status !== 'cancelled')
            ->take(5)
            ->values();

        $recentOrders = $registrations->take(5)->values();

        return Inertia::render('User/Dashboard', [
            'stats' => [
                'totalTickets'   => $registrations->where('status', '!=', 'cancelled')->count(),
                'upcomingEvents' => $upcomingRegistrations->count(),
                'totalOrders'    => $registrations->count(),
                'totalSpent'     => (float) $registrations->where('payment_status', 'paid')->sum('total_amount'),
            ],
            'upcomingRegistrations' => $upcomingRegistrations,
            'recentOrders'         => $recentOrders,
        ]);
    }

    // ─── Profile ──────────────────────────────────────────────────────────────

    public function profile(Request $request): Response
    {
        return Inertia::render('User/Profile', [
            'mustVerifyEmail' => $request->user() instanceof \Illuminate\Contracts\Auth\MustVerifyEmail,
            'status'          => session('status'),
        ]);
    }

    public function updateProfile(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name'  => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email,' . $request->user()->id],
        ]);

        $request->user()->fill($validated);

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return Redirect::route('user.profile');
    }

    public function destroyProfile(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }

    // ─── Tickets ──────────────────────────────────────────────────────────────

    public function tickets(Request $request): Response
    {
        $email = $request->user()->email;

        $query = EventRegistration::where('email', $email)
            ->with(['event.media', 'ticket', 'products.product']);

        // Search filter
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('reference_no', 'like', "%{$search}%")
                  ->orWhereHas('event', fn ($eq) => $eq->where('title', 'like', "%{$search}%"));
            });
        }

        // Status filter
        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $registrations = $query->latest()->paginate(10)->withQueryString();

        return Inertia::render('User/Tickets', [
            'registrations' => $registrations,
            'filters' => [
                'search' => $request->input('search', ''),
                'status' => $request->input('status', ''),
            ],
        ]);
    }

    // ─── Orders ───────────────────────────────────────────────────────────────

    public function orders(Request $request): Response
    {
        $email = $request->user()->email;

        $baseQuery = EventRegistration::where('email', $email);

        $query = (clone $baseQuery)->with(['event', 'ticket', 'products.product']);

        // Search filter
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('reference_no', 'like', "%{$search}%")
                  ->orWhereHas('event', fn ($eq) => $eq->where('title', 'like', "%{$search}%"));
            });
        }

        // Payment status filter
        if ($paymentStatus = $request->input('payment_status')) {
            $query->where('payment_status', $paymentStatus);
        }

        $orders = $query->latest()->paginate(15)->withQueryString();

        return Inertia::render('User/Orders', [
            'orders' => $orders,
            'filters' => [
                'search'         => $request->input('search', ''),
                'payment_status' => $request->input('payment_status', ''),
            ],
            'totals' => [
                'all'      => (clone $baseQuery)->count(),
                'paid'     => (clone $baseQuery)->where('payment_status', 'paid')->count(),
                'pending'  => (clone $baseQuery)->where('payment_status', 'pending')->count(),
                'refunded' => (clone $baseQuery)->where('payment_status', 'refunded')->count(),
            ],
        ]);
    }

    public function orderDetail(Request $request, int $id): Response
    {
        $order = EventRegistration::where('email', $request->user()->email)
            ->with(['event.media', 'ticket', 'products.product'])
            ->findOrFail($id);

        return Inertia::render('User/OrderDetail', [
            'order' => $order,
        ]);
    }

    // ─── Payment Methods ──────────────────────────────────────────────────────

    public function payments(Request $request): Response
    {
        $methods = $request->user()
            ->paymentMethods()
            ->orderByDesc('is_default')
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('User/Payments', [
            'paymentMethods' => $methods,
        ]);
    }

    public function storePayment(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'type'        => ['required', 'in:card,fpx,ewallet'],
            'label'       => ['required', 'string', 'max:100'],
            'card_number' => ['nullable', 'string', 'max:19'],
            'expiry'      => ['nullable', 'string', 'max:5'],
            'bank_name'   => ['nullable', 'string', 'max:100'],
        ]);

        $last4 = null;
        if ($validated['type'] === 'card' && !empty($validated['card_number'])) {
            $last4 = substr(preg_replace('/\s+/', '', $validated['card_number']), -4);
        }

        // Remove default from other methods if this is the first one
        $isFirst = $request->user()->paymentMethods()->count() === 0;

        $request->user()->paymentMethods()->create([
            'type'       => $validated['type'],
            'label'      => $validated['label'],
            'last4'      => $last4,
            'bank_name'  => $validated['bank_name'] ?? null,
            'is_default' => $isFirst,
        ]);

        return Redirect::route('user.payments')->with('success', 'Payment method added.');
    }

    public function setDefaultPayment(Request $request, int $id): RedirectResponse
    {
        $method = $request->user()->paymentMethods()->findOrFail($id);

        // Reset all defaults
        $request->user()->paymentMethods()->update(['is_default' => false]);
        $method->update(['is_default' => true]);

        return Redirect::route('user.payments')->with('success', 'Default payment method updated.');
    }

    public function destroyPayment(Request $request, int $id): RedirectResponse
    {
        $method = $request->user()->paymentMethods()->findOrFail($id);
        $wasDefault = $method->is_default;
        $method->delete();

        // If the deleted method was default, set the first remaining one as default
        if ($wasDefault) {
            $request->user()->paymentMethods()->first()?->update(['is_default' => true]);
        }

        return Redirect::route('user.payments')->with('success', 'Payment method removed.');
    }
}
