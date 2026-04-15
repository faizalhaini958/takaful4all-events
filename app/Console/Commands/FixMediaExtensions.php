<?php

namespace App\Console\Commands;

use App\Models\Media;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class FixMediaExtensions extends Command
{
    protected $signature = 'media:fix-extensions';
    protected $description = 'Rename media files with wrong extensions to .jpg (all stored as JPEG)';

    public function handle(): int
    {
        $media = Media::all();
        $fixed = 0;

        foreach ($media as $item) {
            $ext = pathinfo($item->path, PATHINFO_EXTENSION);

            if (strtolower($ext) === 'jpg') {
                continue;
            }

            $disk = Storage::disk($item->disk);
            if (!$disk->exists($item->path)) {
                $this->warn("Missing file: {$item->path} (ID {$item->id})");
                continue;
            }

            $newPath = preg_replace('/\.[^.]+$/', '.jpg', $item->path);
            $disk->move($item->path, $newPath);

            $newUrl = '/storage/' . $newPath;

            // Fix thumbnail too
            $newThumb = null;
            if ($item->thumbnail_path && $disk->exists($item->thumbnail_path)) {
                $newThumb = preg_replace('/\.[^.]+$/', '.jpg', $item->thumbnail_path);
                if ($newThumb !== $item->thumbnail_path) {
                    $disk->move($item->thumbnail_path, $newThumb);
                }
            }

            $item->update([
                'path'           => $newPath,
                'url'            => $newUrl,
                'thumbnail_path' => $newThumb ?? $item->thumbnail_path,
                'mime'           => 'image/jpeg',
            ]);

            $fixed++;
            $this->info("Fixed: {$item->path} → {$newPath}");
        }

        $this->info("Done. Fixed {$fixed} file(s).");

        return 0;
    }
}
