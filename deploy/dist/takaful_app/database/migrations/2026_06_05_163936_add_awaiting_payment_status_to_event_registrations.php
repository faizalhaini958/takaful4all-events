<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::getConnection()->getDriverName() === 'sqlite') {
            return;
        }

        DB::statement("ALTER TABLE event_registrations MODIFY COLUMN status ENUM('pending', 'awaiting_payment', 'confirmed', 'cancelled', 'waitlisted', 'attended') NOT NULL DEFAULT 'pending'");
    }

    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() === 'sqlite') {
            return;
        }

        DB::statement("ALTER TABLE event_registrations MODIFY COLUMN status ENUM('pending', 'confirmed', 'cancelled', 'waitlisted', 'attended') NOT NULL DEFAULT 'pending'");
    }
};
