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
        $manager = new ImageManager(new Driver());
        $image   = $manager->read($file->getRealPath());

        if ($image->width() > 1920) {
            $image->scale(width: 1920);
        }

        $width  = $image->width();
        $height = $image->height();

        // Preserve original format (WebP stays WebP, PNG stays PNG, etc.)
        $sourceMime = $file->getMimeType();
        $format     = $this->resolveFormat($sourceMime);

        $directory = $folder ?? ('media/' . now()->format('Y/m'));
        $filename  = Str::uuid() . '.' . $format['extension'];
        $path      = $directory . '/' . $filename;

        Storage::disk('public')->put(
            $path,
            $format['quality'] !== null
                ? $image->{$format['method']}($format['quality'])
                : $image->{$format['method']}()
        );

        // Generate 400×225 thumbnail (always JPEG for universal browser support)
        $thumbnailPath = null;
        if ($image->width() >= 400) {
            $thumbnail     = $manager->read($file->getRealPath());
            $thumbnail->cover(400, 225);
            $thumbFilename = pathinfo($filename, PATHINFO_FILENAME) . '_thumb.jpg';
            $thumbnailPath = $directory . '/' . $thumbFilename;
            Storage::disk('public')->put($thumbnailPath, $thumbnail->toJpeg(80));
        }

        $url = '/storage/' . $path;

        return Media::create([
            'disk'           => 'public',
            'path'           => $path,
            'thumbnail_path' => $thumbnailPath,
            'url'            => $url,
            'mime'           => $sourceMime,
            'size'           => Storage::disk('public')->size($path),
            'width'          => $width,
            'height'         => $height,
            'title'          => pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME),
        ]);
    }

    /**
     * Map a MIME type to encoding method, file extension, and quality.
     */
    private function resolveFormat(string $mime): array
    {
        return match ($mime) {
            'image/webp' => ['method' => 'toWebp', 'extension' => 'webp', 'quality' => 80],
            'image/png'  => ['method' => 'toPng',  'extension' => 'png',  'quality' => null],
            default      => ['method' => 'toJpeg', 'extension' => 'jpg',  'quality' => 85],
        };
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
