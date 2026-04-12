<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ShippingZone;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ShippingZoneController extends Controller
{
    /**
     * Store a new shipping zone.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateZone($request);

        ShippingZone::create($validated);

        return back()->with('success', 'Shipping zone created successfully.');
    }

    /**
     * Update an existing shipping zone.
     */
    public function update(Request $request, ShippingZone $zone): RedirectResponse
    {
        $validated = $this->validateZone($request);

        $zone->update($validated);

        return back()->with('success', 'Shipping zone updated successfully.');
    }

    /**
     * Delete a shipping zone.
     */
    public function destroy(ShippingZone $zone): RedirectResponse
    {
        $zone->delete();

        return back()->with('success', 'Shipping zone deleted successfully.');
    }

    /**
     * Validate shipping zone data.
     */
    private function validateZone(Request $request): array
    {
        $validated = $request->validate([
            'name'              => 'required|string|max:255',
            'countries'         => 'required|array|min:1',
            'countries.*'       => 'required|string|size:2',
            'states'            => 'nullable|array',
            'states.*'          => 'required|string|max:10',
            'rate'              => 'required|numeric|min:0|max:99999.99',
            'rate_type'         => 'required|in:flat,per_item',
            'free_shipping_min' => 'nullable|numeric|min:0|max:99999.99',
            'is_active'         => 'boolean',
            'sort_order'        => 'integer|min:0',
        ]);

        $validated['is_active'] = $validated['is_active'] ?? true;
        $validated['sort_order'] = $validated['sort_order'] ?? 0;

        return $validated;
    }
}
