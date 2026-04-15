<?php

namespace App\Services;

use App\Models\Media;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class MediaService
{
    public function upload(UploadedFile $file, ?string $folder = null): Media
    {
        // Always use .jpg extension since we convert everything to JPEG
        $filename  = Str::uuid() . '.jpg';
        $directory = $folder ?? ('media/' . now()->format('Y/m'));
        $path      = $directory . '/' . $filename;

        // Process with Intervention Image (resize if wider than 1920px)
        $manager = new ImageManager(new Driver());
        $image   = $manager->read($file->getRealPath());

        if ($image->width() > 1920) {
            $image->scale(width: 1920);
        }

        $width  = $image->width();
        $height = $image->height();

        Storage::disk('public')->put($path, $image->toJpeg(85));

        // Generate 400×225 thumbnail for listing pages
        $thumbnailPath = null;
        if ($image->width() >= 400) {
            $thumbnail     = $manager->read($file->getRealPath());
            $thumbnail->cover(400, 225);
            $thumbFilename = pathinfo($filename, PATHINFO_FILENAME) . '_thumb.jpg';
            $thumbnailPath = $directory . '/' . $thumbFilename;
            Storage::disk('public')->put($thumbnailPath, $thumbnail->toJpeg(80));
        }

        // Store relative URL path instead of absolute URL
        $url = '/storage/' . $path;

        return Media::create([
            'disk'           => 'public',
            'path'           => $path,
            'thumbnail_path' => $thumbnailPath,
            'url'            => $url,
            'mime'           => 'image/jpeg',
            'size'           => Storage::disk('public')->size($path),
            'width'          => $width,
            'height'         => $height,
            'title'          => pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME),
        ]);
    }

    public function delete(Media $media): void
    {
        Storage::disk($media->disk)->delete($media->path);

        if ($media->thumbnail_path) {
            Storage::disk($media->disk)->delete($media->thumbnail_path);
        }
        $media->delete();
    }
}
