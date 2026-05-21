<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('analytics_events', function (Blueprint $table) {
            $table->id();
            $table->uuid('session_id');
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('event_type', 50);
            $table->string('event_category', 100);
            $table->string('event_label', 255)->nullable();
            $table->json('event_data')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('session_id')->references('id')->on('visitor_sessions')->cascadeOnDelete();
            $table->index('session_id');
            $table->index(['event_type', 'event_category']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('analytics_events');
    }
};
