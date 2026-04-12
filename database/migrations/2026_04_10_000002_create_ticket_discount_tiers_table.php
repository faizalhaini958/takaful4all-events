<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ticket_discount_tiers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_ticket_id')->constrained('event_tickets')->cascadeOnDelete();
            $table->unsignedInteger('min_quantity');
            $table->enum('discount_type', ['percentage', 'fixed'])->default('percentage');
            $table->decimal('discount_value', 10, 2);
            $table->timestamps();

            $table->unique(['event_ticket_id', 'min_quantity']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ticket_discount_tiers');
    }
};
