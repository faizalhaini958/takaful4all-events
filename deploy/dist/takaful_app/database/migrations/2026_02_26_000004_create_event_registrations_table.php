<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('event_registrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained('events')->cascadeOnDelete();
            $table->foreignId('ticket_id')->constrained('event_tickets')->cascadeOnDelete();
            $table->string('reference_no', 20)->unique();   // e.g. "EVT-20260226-ABC1"
            $table->string('name');
            $table->string('email');
            $table->string('phone', 30)->nullable();
            $table->string('company')->nullable();
            $table->string('job_title')->nullable();
            $table->string('dietary_requirements')->nullable();
            $table->enum('status', ['pending', 'confirmed', 'cancelled', 'waitlisted', 'attended'])->default('pending');
            $table->unsignedInteger('quantity')->default(1);
            $table->decimal('subtotal', 10, 2)->default(0);       // ticket cost
            $table->decimal('products_total', 10, 2)->default(0); // products cost
            $table->decimal('total_amount', 10, 2)->default(0);   // grand total
            $table->enum('payment_status', ['na', 'pending', 'paid', 'refunded'])->default('na');
            $table->string('payment_method')->nullable();
            $table->string('payment_reference')->nullable();
            $table->text('notes')->nullable();
            $table->dateTime('checked_in_at')->nullable();
            $table->json('meta_json')->nullable();
            $table->timestamps();

            $table->index('event_id');
            $table->index('ticket_id');
            $table->index('reference_no');
            $table->index('email');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('event_registrations');
    }
};
