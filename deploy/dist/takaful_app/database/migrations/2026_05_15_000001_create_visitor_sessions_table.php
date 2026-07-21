<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('visitor_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('ip_hash', 64)->nullable();
            $table->enum('device_type', ['mobile', 'tablet', 'desktop'])->default('desktop');
            $table->string('browser', 50)->default('other');
            $table->char('country_code', 2)->nullable();
            $table->string('referrer_domain', 255)->nullable();
            $table->string('utm_source', 100)->nullable();
            $table->string('utm_medium', 100)->nullable();
            $table->string('utm_campaign', 100)->nullable();
            $table->unsignedInteger('page_count')->default(0);
            $table->timestamp('started_at')->useCurrent();
            $table->timestamp('last_seen_at')->useCurrent()->useCurrentOnUpdate();

            $table->index('user_id');
            $table->index('started_at');
            $table->index('last_seen_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('visitor_sessions');
    }
};
