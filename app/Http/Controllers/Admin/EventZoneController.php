<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventZone;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class EventZoneController extends Controller
{
    /**
     * List zones for an event (rendered as a tab on event edit page).
     */
    public function index(Event $event): Response
    {
        $zones = $event->zones()
            ->withCount('tickets')
            ->orderBy('sort_order')
            ->get();

        return Inertia::render('Admin/Events/Zones', [
            'event' => $event->load('media'),
            'zones' => $zones,
        ]);
    }

    /**
     * Store a new zone for an event.
     */
    public function store(Request $request, Event $event): RedirectResponse
    {
        $validated = $this->validateZone($request);

        if ($request->hasFile('image')) {
            $validated['image_path'] = $request->file('image')
                ->store("events/{$event->id}/zones", 'public');
        }

        $event->zones()->create($validated);

        return redirect()->route('admin.events.zones.index', $event)
            ->with('success', 'Zone created successfully.');
    }

    /**
     * Update an existing zone.
     */
    public function update(Request $request, Event $event, EventZone $zone): RedirectResponse
    {
        $validated = $this->validateZone($request);

        // Handle image upload or removal
        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($zone->image_path) {
                Storage::disk('public')->delete($zone->image_path);
            }
            $validated['image_path'] = $request->file('image')
                ->store("events/{$event->id}/zones", 'public');
        } elseif ($request->boolean('remove_image') && $zone->image_path) {
            Storage::disk('public')->delete($zone->image_path);
            $validated['image_path'] = null;
        }

        $zone->update($validated);

        return redirect()->route('admin.events.zones.index', $event)
            ->with('success', 'Zone updated successfully.');
    }

    /**
     * Delete a zone.
     */
    public function destroy(Event $event, EventZone $zone): RedirectResponse
    {
        // Prevent deleting zones that have tickets assigned
        if ($zone->tickets()->exists()) {
            return redirect()->route('admin.events.zones.index', $event)
                ->with('error', 'Cannot delete a zone that has tickets assigned. Reassign tickets first.');
        }

        // Clean up image
        if ($zone->image_path) {
            Storage::disk('public')->delete($zone->image_path);
        }

        $zone->delete();

        return redirect()->route('admin.events.zones.index', $event)
            ->with('success', 'Zone deleted.');
    }

    /**
     * Shared validation rules for store/update.
     */
    private function validateZone(Request $request): array
    {
        $validated = $request->validate([
            'name'        => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'color'       => ['required', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'label_color' => ['nullable', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'perks'       => ['nullable', 'json'],
            'image'       => ['nullable', 'image', 'max:2048'],
            'capacity'    => ['nullable', 'integer', 'min:1'],
            'sort_order'  => ['nullable', 'integer', 'min:0'],
        ]);

        // Decode perks JSON string to array
        if (isset($validated['perks']) && is_string($validated['perks'])) {
            $validated['perks'] = json_decode($validated['perks'], true) ?: [];
        }

        // Remove image from validated (handled separately)
        unset($validated['image']);

        return $validated;
    }
}
