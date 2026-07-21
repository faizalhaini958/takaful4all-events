<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('event_tickets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained('events')->cascadeOnDelete();
            $table->string('name');                        // e.g. "Early Bird", "VIP", "Standard"
            $table->text('description')->nullable();
            $table->enum('type', ['free', 'paid'])->default('free');
            $table->decimal('price', 10, 2)->default(0);
            $table->string('currency', 10)->default('MYR');
            $table->unsignedInteger('quantity')->nullable(); // null = unlimited
            $table->unsignedInteger('max_per_order')->default(5);
            $table->dateTime('sale_start_at')->nullable();
            $table->dateTime('sale_end_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index('event_id');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('event_tickets');
    }
};
