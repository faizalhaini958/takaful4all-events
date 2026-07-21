<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('event_tickets', function (Blueprint $table) {
            $table->unsignedInteger('early_bird_qty')->nullable()->after('early_bird_end_at');
        });
    }

    public function down(): void
    {
        Schema::table('event_tickets', function (Blueprint $table) {
            $table->dropColumn('early_bird_qty');
        });
    }
};
