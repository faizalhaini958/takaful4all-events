<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventRegistration;
use App\Models\PromoCode;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PromoCodeController extends Controller
{
    public function index(Request $request): Response
    {
        $query = PromoCode::query()->with(['event:id,title', 'creator:id,name']);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where('code', 'like', "%{$search}%");
        }

        if ($request->filled('event_id')) {
            $query->where('event_id', $request->input('event_id'));
        }

        $promoCodes = $query->latest()->paginate(15)->withQueryString();
        $events = Event::select('id', 'title')->orderBy('title')->get();

        // Stats
        $stats = [
            'total_codes'       => PromoCode::count(),
            'active_codes'      => PromoCode::where('is_active', true)->count(),
            'total_redemptions' => EventRegistration::whereNotNull('promo_code_id')->whereNotIn('status', ['cancelled'])->count(),
            'total_discounted'  => EventRegistration::whereNotNull('promo_code_id')->whereNotIn('status', ['cancelled'])->sum('promo_code_discount'),
        ];

        return Inertia::render('Admin/PromoCodes/Index', [
            'promo_codes' => $promoCodes,
            'events'      => $events,
            'filters'     => $request->only(['search', 'event_id']),
            'stats'       => $stats,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'code'              => 'required|string|max:50|unique:promo_codes,code',
            'discount_type'     => 'required|in:percentage,fixed',
            'discount_value'    => 'required|numeric|min:0',
            'max_uses'          => 'nullable|integer|min:1',
            'max_uses_per_user' => 'nullable|integer|min:1',
            'min_order_amount'  => 'nullable|numeric|min:0',
            'event_id'          => 'nullable|exists:events,id',
            'starts_at'         => 'nullable|date',
            'expires_at'        => 'nullable|date|after_or_equal:starts_at',
            'is_active'         => 'boolean',
        ]);

        $validated['code'] = strtoupper(trim($validated['code']));
        $validated['created_by'] = $request->user()->id;

        PromoCode::create($validated);

        return back()->with('success', 'Promo code created successfully.');
    }

    public function update(Request $request, PromoCode $promoCode): RedirectResponse
    {
        $validated = $request->validate([
            'code'              => 'required|string|max:50|unique:promo_codes,code,' . $promoCode->id,
            'discount_type'     => 'required|in:percentage,fixed',
            'discount_value'    => 'required|numeric|min:0',
            'max_uses'          => 'nullable|integer|min:1',
            'max_uses_per_user' => 'nullable|integer|min:1',
            'min_order_amount'  => 'nullable|numeric|min:0',
            'event_id'          => 'nullable|exists:events,id',
            'starts_at'         => 'nullable|date',
            'expires_at'        => 'nullable|date|after_or_equal:starts_at',
            'is_active'         => 'boolean',
        ]);

        $validated['code'] = strtoupper(trim($validated['code']));
        $promoCode->update($validated);

        return back()->with('success', 'Promo code updated successfully.');
    }

    public function destroy(PromoCode $promoCode): RedirectResponse
    {
        $promoCode->delete();

        return back()->with('success', 'Promo code deleted.');
    }

    public function show(PromoCode $promoCode): Response
    {
        $promoCode->load(['event:id,title', 'creator:id,name']);

        $registrations = EventRegistration::with(['event:id,title,slug', 'ticket:id,name', 'user:id,name,email'])
            ->where('promo_code_id', $promoCode->id)
            ->orderByDesc('created_at')
            ->paginate(20)
            ->withQueryString();

        $totalDiscount = EventRegistration::where('promo_code_id', $promoCode->id)
            ->whereNotIn('status', ['cancelled'])
            ->sum('promo_code_discount');

        $redemptionCount = EventRegistration::where('promo_code_id', $promoCode->id)
            ->whereNotIn('status', ['cancelled'])
            ->count();

        return Inertia::render('Admin/PromoCodes/Show', [
            'promo_code'        => $promoCode,
            'registrations'     => $registrations,
            'total_discount'    => $totalDiscount,
            'redemption_count'  => $redemptionCount,
        ]);
    }
}
