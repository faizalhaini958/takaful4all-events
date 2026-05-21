<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── event_tickets — eligibility rule columns ──────────────────────────
        Schema::table('event_tickets', function (Blueprint $table) {
            $table->unsignedTinyInteger('min_age')->nullable()->after('is_active');
            $table->unsignedTinyInteger('max_age')->nullable()->after('min_age');
            $table->string('allowed_gender', 10)->nullable()->after('max_age'); // 'male' | 'female' | null
        });
    }

    public function down(): void
    {
        Schema::table('event_tickets', function (Blueprint $table) {
            $table->dropColumn(['min_age', 'max_age', 'allowed_gender']);
        });
    }
};
