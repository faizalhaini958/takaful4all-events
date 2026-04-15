<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Banner;
use App\Models\Setting;
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
        $general = Setting::getCached('general');

        return Inertia::render('Admin/Banners/Index', [
            'banners'          => $banners,
            'slideshowEnabled' => ($general['slideshow_enabled'] ?? '0') === '1',
        ]);
    }

    public function toggleSlideshow(Request $request): RedirectResponse
    {
        $request->validate([
            'enabled' => 'required|boolean',
        ]);

        Setting::set('general', 'slideshow_enabled', $request->boolean('enabled') ? '1' : '0');
        Cache::forget('settings.general');

        return back()->with('success', $request->boolean('enabled') ? 'Slideshow enabled.' : 'Slideshow disabled.');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title'        => 'required|string|max:255',
            'image'        => 'required|image|mimes:jpeg,jpg,png,webp|max:5120|dimensions:min_width=800',
            'mobile_image' => 'nullable|image|mimes:jpeg,jpg,png,webp|max:5120',
            'link_url'     => 'nullable|url|max:500',
            'sort_order'   => 'nullable|integer|min:0',
            'is_active'    => 'nullable|boolean',
        ]);

        $manager   = new ImageManager(new Driver());
        $directory = 'banners';

        // Desktop image
        $file     = $request->file('image');
        $filename = Str::uuid() . '.jpg';
        $path     = $directory . '/' . $filename;
        $image    = $manager->read($file->getRealPath());

        if ($image->width() > 1920) {
            $image->scale(width: 1920);
        }

        Storage::disk('public')->put($path, $image->toJpeg(85));

        // Mobile image (optional)
        $mobilePath = null;
        if ($request->hasFile('mobile_image')) {
            $mobileFile     = $request->file('mobile_image');
            $mobileFilename = Str::uuid() . '.jpg';
            $mobilePath     = $directory . '/' . $mobileFilename;
            $mobileImage    = $manager->read($mobileFile->getRealPath());

            if ($mobileImage->width() > 1080) {
                $mobileImage->scale(width: 1080);
            }

            Storage::disk('public')->put($mobilePath, $mobileImage->toJpeg(85));
        }

        Banner::create([
            'title'             => $validated['title'],
            'image_path'        => $path,
            'mobile_image_path' => $mobilePath,
            'link_url'          => $validated['link_url'] ?? null,
            'sort_order'        => $validated['sort_order'] ?? Banner::max('sort_order') + 1,
            'is_active'         => $validated['is_active'] ?? true,
        ]);

        Cache::forget('home.banners');

        return back()->with('success', 'Banner created successfully.');
    }

    public function update(Request $request, Banner $banner): RedirectResponse
    {
        $validated = $request->validate([
            'title'        => 'required|string|max:255',
            'image'        => 'nullable|image|mimes:jpeg,jpg,png,webp|max:5120|dimensions:min_width=800',
            'mobile_image' => 'nullable|image|mimes:jpeg,jpg,png,webp|max:5120',
            'link_url'     => 'nullable|url|max:500',
            'sort_order'   => 'nullable|integer|min:0',
            'is_active'    => 'nullable|boolean',
            'remove_mobile_image' => 'nullable|boolean',
        ]);

        $manager   = new ImageManager(new Driver());
        $directory = 'banners';

        // Desktop image
        if ($request->hasFile('image')) {
            Storage::disk('public')->delete($banner->image_path);

            $file     = $request->file('image');
            $filename = Str::uuid() . '.jpg';
            $path     = $directory . '/' . $filename;
            $image    = $manager->read($file->getRealPath());

            if ($image->width() > 1920) {
                $image->scale(width: 1920);
            }

            Storage::disk('public')->put($path, $image->toJpeg(85));
            $banner->image_path = $path;
        }

        // Mobile image
        if ($request->hasFile('mobile_image')) {
            if ($banner->mobile_image_path) {
                Storage::disk('public')->delete($banner->mobile_image_path);
            }

            $mobileFile     = $request->file('mobile_image');
            $mobileFilename = Str::uuid() . '.jpg';
            $mobilePath     = $directory . '/' . $mobileFilename;
            $mobileImage    = $manager->read($mobileFile->getRealPath());

            if ($mobileImage->width() > 1080) {
                $mobileImage->scale(width: 1080);
            }

            Storage::disk('public')->put($mobilePath, $mobileImage->toJpeg(85));
            $banner->mobile_image_path = $mobilePath;
        } elseif ($request->boolean('remove_mobile_image')) {
            if ($banner->mobile_image_path) {
                Storage::disk('public')->delete($banner->mobile_image_path);
            }
            $banner->mobile_image_path = null;
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
        if ($banner->mobile_image_path) {
            Storage::disk('public')->delete($banner->mobile_image_path);
        }
        $banner->delete();

        Cache::forget('home.banners');

        return back()->with('success', 'Banner deleted.');
    }
}
