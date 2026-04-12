<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('event_tickets', function (Blueprint $table) {
            $table->foreignId('event_zone_id')->nullable()->after('event_id')
                ->constrained('event_zones')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('event_tickets', function (Blueprint $table) {
            $table->dropConstrainedForeignId('event_zone_id');
        });
    }
};
