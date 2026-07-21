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
            // SQLite: role is already a string column from earlier migrations — just update data
            DB::table('users')->where('role', 'user')->update(['role' => 'public']);
        } else {
            // MySQL: expand enum to include all values (keep 'user' temporarily for existing data)
            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'editor', 'user', 'company', 'public') NOT NULL DEFAULT 'public'");

            // Migrate existing 'user' role to 'public'
            DB::table('users')->where('role', 'user')->update(['role' => 'public']);

            // Now remove 'user' from the enum
            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'editor', 'company', 'public') NOT NULL DEFAULT 'public'");
        }

        Schema::table('users', function (Blueprint $table) {
            $table->string('company_name')->nullable()->after('role');
            $table->string('company_registration_no')->nullable()->after('company_name');
            $table->text('company_address')->nullable()->after('company_registration_no');
            $table->string('company_phone')->nullable()->after('company_address');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['company_name', 'company_registration_no', 'company_address', 'company_phone']);
        });

        $driver = Schema::getConnection()->getDriverName();

        if ($driver !== 'sqlite') {
            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'editor') NOT NULL DEFAULT 'editor'");
        }
    }
};
