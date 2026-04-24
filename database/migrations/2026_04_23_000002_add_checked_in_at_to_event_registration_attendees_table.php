<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('event_registration_attendees', function (Blueprint $table) {
            $table->dateTime('checked_in_at')->nullable()->after('dietary_requirements');
            $table->index('checked_in_at');
        });
    }

    public function down(): void
    {
        Schema::table('event_registration_attendees', function (Blueprint $table) {
            $table->dropIndex(['checked_in_at']);
            $table->dropColumn('checked_in_at');
        });
    }
};
