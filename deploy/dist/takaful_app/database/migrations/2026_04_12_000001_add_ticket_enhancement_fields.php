<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // ── EventZone enhancements ──────────────────────────────────────
        Schema::table('event_zones', function (Blueprint $table) {
            $table->string('label_color', 7)->default('#ffffff')->after('color');
            $table->json('perks')->nullable()->after('label_color');
            $table->string('image_path')->nullable()->after('perks');
        });

        // ── EventTicket early bird pricing ──────────────────────────────
        Schema::table('event_tickets', function (Blueprint $table) {
            $table->decimal('early_bird_price', 10, 2)->nullable()->after('price');
            $table->timestamp('early_bird_end_at')->nullable()->after('early_bird_price');
        });

        // ── Event venue map ─────────────────────────────────────────────
        Schema::table('events', function (Blueprint $table) {
            $table->foreignId('venue_map_media_id')
                ->nullable()
                ->after('media_id')
                ->constrained('media')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropForeign(['venue_map_media_id']);
            $table->dropColumn('venue_map_media_id');
        });

        Schema::table('event_tickets', function (Blueprint $table) {
            $table->dropColumn(['early_bird_price', 'early_bird_end_at']);
        });

        Schema::table('event_zones', function (Blueprint $table) {
            $table->dropColumn(['label_color', 'perks', 'image_path']);
        });
    }
};
