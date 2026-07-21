<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update all absolute URLs to relative paths
        DB::table('media')
            ->whereNotNull('url')
            ->where(function ($query) {
                $query->where('url', 'like', 'http://localhost%')
                      ->orWhere('url', 'like', 'https://localhost%')
                      ->orWhere('url', 'like', 'http://127.0.0.1%');
            })
            ->get()
            ->each(function ($media) {
                $parsedUrl = parse_url($media->url);
                $relativePath = $parsedUrl['path'] ?? '';

                if ($relativePath) {
                    DB::table('media')
                        ->where('id', $media->id)
                        ->update(['url' => $relativePath]);
                }
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Cannot reliably reverse this migration
        // as we don't know the original absolute URLs
    }
};
