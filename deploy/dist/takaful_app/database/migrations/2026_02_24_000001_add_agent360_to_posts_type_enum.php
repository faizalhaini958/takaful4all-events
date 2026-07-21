<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE posts MODIFY COLUMN type ENUM('podcast','webinar','article','agent360') NOT NULL");
        }
        // SQLite stores ENUMs as TEXT — no schema change required; the new value is already accepted.
    }

    public function down(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE posts MODIFY COLUMN type ENUM('podcast','webinar','article') NOT NULL");
        }
    }
};
