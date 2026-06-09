<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContentBanner;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class ContentBannerController extends Controller
{
    public function index(): Response
    {
        $banners = ContentBanner::orderBy('sort_order')->get();

        return Inertia::render('Admin/ContentBanners/Index', [
            'banners' => $banners,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title'       => 'required|string|max:255',
            'subtitle'    => 'nullable|string|max:255',
            'image'       => 'required|image|mimes:jpeg,jpg,png,webp|max:5120|dimensions:min_width=800',
            'button_text' => 'nullable|string|max:100',
            'button_link' => 'nullable|url|max:500',
            'sort_order'  => 'nullable|integer|min:0',
            'is_active'   => 'nullable|boolean',
            'start_date'  => 'nullable|date',
            'end_date'    => 'nullable|date|after_or_equal:start_date',
        ]);

        $manager   = new ImageManager(new Driver());
        $directory = 'content-banners';

        $file     = $request->file('image');
        $filename = Str::uuid() . '.jpg';
        $path     = $directory . '/' . $filename;
        $image    = $manager->read($file->getRealPath());

        if ($image->width() > 1920) {
            $image->scale(width: 1920);
        }
        $image->cover(width: $image->width(), height: (int) round($image->width() * 6 / 16));

        Storage::disk('public')->put($path, $image->toJpeg(85));

        ContentBanner::create([
            'title'       => $validated['title'],
            'subtitle'    => $validated['subtitle'] ?? null,
            'image_path'  => $path,
            'button_text' => $validated['button_text'] ?? null,
            'button_link' => $validated['button_link'] ?? null,
            'sort_order'  => $validated['sort_order'] ?? ContentBanner::max('sort_order') + 1,
            'is_active'   => $validated['is_active'] ?? true,
            'start_date'  => $validated['start_date'] ?? null,
            'end_date'    => $validated['end_date'] ?? null,
            'created_by'  => auth()->id(),
        ]);

        return back()->with('success', 'Content banner created successfully.');
    }

    public function update(Request $request, ContentBanner $banner): RedirectResponse
    {
        $validated = $request->validate([
            'title'       => 'required|string|max:255',
            'subtitle'    => 'nullable|string|max:255',
            'image'       => 'nullable|image|mimes:jpeg,jpg,png,webp|max:5120|dimensions:min_width=800',
            'button_text' => 'nullable|string|max:100',
            'button_link' => 'nullable|url|max:500',
            'sort_order'  => 'nullable|integer|min:0',
            'is_active'   => 'nullable|boolean',
            'start_date'  => 'nullable|date',
            'end_date'    => 'nullable|date|after_or_equal:start_date',
        ]);

        $manager   = new ImageManager(new Driver());
        $directory = 'content-banners';

        if ($request->hasFile('image')) {
            Storage::disk('public')->delete($banner->image_path);

            $file     = $request->file('image');
            $filename = Str::uuid() . '.jpg';
            $path     = $directory . '/' . $filename;
            $image    = $manager->read($file->getRealPath());

            if ($image->width() > 1920) {
                $image->scale(width: 1920);
            }
            $image->cover(width: $image->width(), height: (int) round($image->width() * 6 / 16));

            Storage::disk('public')->put($path, $image->toJpeg(85));
            $banner->image_path = $path;
        }

        $banner->title       = $validated['title'];
        $banner->subtitle    = $validated['subtitle'] ?? null;
        $banner->button_text = $validated['button_text'] ?? null;
        $banner->button_link = $validated['button_link'] ?? null;
        $banner->sort_order  = $validated['sort_order'] ?? $banner->sort_order;
        $banner->is_active   = $validated['is_active'] ?? $banner->is_active;
        $banner->start_date  = $validated['start_date'] ?? null;
        $banner->end_date    = $validated['end_date'] ?? null;
        $banner->save();

        return back()->with('success', 'Content banner updated successfully.');
    }

    public function reorder(Request $request): RedirectResponse
    {
        $request->validate([
            'ids'   => 'required|array',
            'ids.*' => 'integer|exists:content_banners,id',
        ]);

        foreach ($request->ids as $index => $id) {
            ContentBanner::where('id', $id)->update(['sort_order' => $index]);
        }

        return back()->with('success', 'Content banner order updated.');
    }

    public function destroy(ContentBanner $banner): RedirectResponse
    {
        Storage::disk('public')->delete($banner->image_path);
        $banner->delete();

        return back()->with('success', 'Content banner deleted.');
    }
}
