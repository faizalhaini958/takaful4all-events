<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('event_registration_products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('registration_id')->constrained('event_registrations')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('event_products')->cascadeOnDelete();
            $table->string('variant')->nullable();            // e.g. "L", "Red / XL"
            $table->unsignedInteger('quantity')->default(1);
            $table->decimal('unit_price', 10, 2)->default(0);
            $table->timestamps();

            $table->index('registration_id');
            $table->index('product_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('event_registration_products');
    }
};
