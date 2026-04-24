<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('event_registrations', function (Blueprint $table) {
            $table->index(['status', 'event_id'], 'event_registrations_status_event_id_index');
        });

        Schema::table('events', function (Blueprint $table) {
            $table->index(['is_published', 'start_at'], 'events_is_published_start_at_index');
        });

        Schema::table('posts', function (Blueprint $table) {
            $table->index(['is_published', 'type', 'published_at'], 'posts_is_published_type_published_at_index');
        });

        Schema::table('event_registration_attendees', function (Blueprint $table) {
            $table->index(['registration_id', 'checked_in_at'], 'event_registration_attendees_registration_checkin_index');
        });
    }

    public function down(): void
    {
        Schema::table('event_registration_attendees', function (Blueprint $table) {
            $table->dropIndex('event_registration_attendees_registration_checkin_index');
        });

        Schema::table('posts', function (Blueprint $table) {
            $table->dropIndex('posts_is_published_type_published_at_index');
        });

        Schema::table('events', function (Blueprint $table) {
            $table->dropIndex('events_is_published_start_at_index');
        });

        Schema::table('event_registrations', function (Blueprint $table) {
            $table->dropIndex('event_registrations_status_event_id_index');
        });
    }
};