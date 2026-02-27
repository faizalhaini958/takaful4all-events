<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Add 'user' to the role enum and change default to 'user'
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'editor', 'user') NOT NULL DEFAULT 'user'");

        // Convert any existing 'editor' users who are not actual editors to 'user'
        // (We keep explicit admin/editor accounts, only change users that were assigned
        //  'editor' as a placeholder because 'user' didn't exist.)
    }

    public function down(): void
    {
        // Convert 'user' roles back to 'editor' before shrinking the enum
        DB::statement("UPDATE users SET role = 'editor' WHERE role = 'user'");
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'editor') NOT NULL DEFAULT 'editor'");
    }
};
