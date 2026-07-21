<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'sqlite') {
            // SQLite doesn't support MODIFY COLUMN — use Schema Builder instead.
            // The initial users table already has role as a string; just update the default.
            Schema::table('users', function (Blueprint $table) {
                $table->string('role')->default('user')->change();
            });
        } else {
            // MySQL / MariaDB: extend the ENUM to include 'user' and update the default
            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'editor', 'user') NOT NULL DEFAULT 'user'");
        }
    }

    public function down(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        DB::statement("UPDATE users SET role = 'editor' WHERE role = 'user'");

        if ($driver !== 'sqlite') {
            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'editor') NOT NULL DEFAULT 'editor'");
        }
    }
};
