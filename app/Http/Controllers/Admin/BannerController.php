<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Banner;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class BannerController extends Controller
{
    public function index(): Response
    {
        $banners = Banner::orderBy('sort_order')->get();

        return Inertia::render('Admin/Banners/Index', [
            'banners' => $banners,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title'      => 'required|string|max:255',
            'image'      => 'required|image|mimes:jpeg,jpg,png,webp|max:5120|dimensions:min_width=800',
            'link_url'   => 'nullable|url|max:500',
            'sort_order'  => 'nullable|integer|min:0',
            'is_active'  => 'nullable|boolean',
        ]);

        $file      = $request->file('image');
        $filename  = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $directory = 'banners';
        $path      = $directory . '/' . $filename;

        $manager = new ImageManager(new Driver());
        $image   = $manager->read($file->getRealPath());

        if ($image->width() > 1920) {
            $image->scale(width: 1920);
        }

        Storage::disk('public')->put($path, $image->toJpeg(85));

        Banner::create([
            'title'      => $validated['title'],
            'image_path' => $path,
            'link_url'   => $validated['link_url'] ?? null,
            'sort_order' => $validated['sort_order'] ?? Banner::max('sort_order') + 1,
            'is_active'  => $validated['is_active'] ?? true,
        ]);

        Cache::forget('home.banners');

        return back()->with('success', 'Banner created successfully.');
    }

    public function update(Request $request, Banner $banner): RedirectResponse
    {
        $validated = $request->validate([
            'title'      => 'required|string|max:255',
            'image'      => 'nullable|image|mimes:jpeg,jpg,png,webp|max:5120|dimensions:min_width=800',
            'link_url'   => 'nullable|url|max:500',
            'sort_order' => 'nullable|integer|min:0',
            'is_active'  => 'nullable|boolean',
        ]);

        if ($request->hasFile('image')) {
            // Delete old image
            Storage::disk('public')->delete($banner->image_path);

            $file      = $request->file('image');
            $filename  = Str::uuid() . '.' . $file->getClientOriginalExtension();
            $directory = 'banners';
            $path      = $directory . '/' . $filename;

            $manager = new ImageManager(new Driver());
            $image   = $manager->read($file->getRealPath());

            if ($image->width() > 1920) {
                $image->scale(width: 1920);
            }

            Storage::disk('public')->put($path, $image->toJpeg(85));
            $banner->image_path = $path;
        }

        $banner->title      = $validated['title'];
        $banner->link_url   = $validated['link_url'] ?? null;
        $banner->sort_order = $validated['sort_order'] ?? $banner->sort_order;
        $banner->is_active  = $validated['is_active'] ?? $banner->is_active;
        $banner->save();

        Cache::forget('home.banners');

        return back()->with('success', 'Banner updated successfully.');
    }

    public function reorder(Request $request): RedirectResponse
    {
        $request->validate([
            'ids'   => 'required|array',
            'ids.*' => 'integer|exists:banners,id',
        ]);

        foreach ($request->ids as $index => $id) {
            Banner::where('id', $id)->update(['sort_order' => $index]);
        }

        Cache::forget('home.banners');

        return back()->with('success', 'Banner order updated.');
    }

    public function destroy(Banner $banner): RedirectResponse
    {
        Storage::disk('public')->delete($banner->image_path);
        $banner->delete();

        Cache::forget('home.banners');

        return back()->with('success', 'Banner deleted.');
    }
}
