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
    public function upload(UploadedFile $file): Media
    {
        $filename  = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $directory = 'media/' . now()->format('Y/m');
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

        // Store relative URL path instead of absolute URL
        $url = '/storage/' . $path;

        return Media::create([
            'disk'   => 'public',
            'path'   => $path,
            'url'    => $url,
            'mime'   => $file->getMimeType(),
            'size'   => Storage::disk('public')->size($path),
            'width'  => $width,
            'height' => $height,
            'title'  => pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME),
        ]);
    }

    public function delete(Media $media): void
    {
        Storage::disk($media->disk)->delete($media->path);
        $media->delete();
    }
}
