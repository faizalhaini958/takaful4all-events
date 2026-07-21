<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->boolean('rsvp_enabled')->default(false)->after('is_published');
            $table->dateTime('rsvp_deadline')->nullable()->after('rsvp_enabled');
            $table->unsignedInteger('max_attendees')->nullable()->after('rsvp_deadline');
            $table->boolean('require_approval')->default(false)->after('max_attendees');
        });
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn(['rsvp_enabled', 'rsvp_deadline', 'max_attendees', 'require_approval']);
        });
    }
};
