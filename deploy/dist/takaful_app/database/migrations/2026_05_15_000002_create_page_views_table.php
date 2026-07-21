<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('page_views', function (Blueprint $table) {
            $table->id();
            $table->uuid('session_id');
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('route_name', 100)->nullable();
            $table->string('url', 500);
            $table->string('referrer_domain', 255)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('session_id')->references('id')->on('visitor_sessions')->cascadeOnDelete();
            $table->index('session_id');
            $table->index('route_name');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('page_views');
    }
};
