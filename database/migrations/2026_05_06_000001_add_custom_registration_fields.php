<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── events table ─────────────────────────────────────────────────────
        Schema::table('events', function (Blueprint $table) {
            $table->string('event_category', 50)->nullable()->after('is_published');
            $table->json('registration_fields')->nullable()->after('event_category');
        });

        // ── event_registration_attendees table ───────────────────────────────
        // meta_json is declared in the model but was never added in any migration.
        // Fixed columns (company, job_title, dietary_requirements) are kept for
        // backward compatibility with existing registrations.
        Schema::table('event_registration_attendees', function (Blueprint $table) {
            $table->json('meta_json')->nullable()->after('dietary_requirements');
        });
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn(['event_category', 'registration_fields']);
        });

        Schema::table('event_registration_attendees', function (Blueprint $table) {
            $table->dropColumn('meta_json');
        });
    }
};
