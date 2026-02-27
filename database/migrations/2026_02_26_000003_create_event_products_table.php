<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('event_products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained('events')->cascadeOnDelete();
            $table->string('name');                           // e.g. "Official T-Shirt"
            $table->text('description')->nullable();
            $table->decimal('price', 10, 2)->default(0);
            $table->string('currency', 10)->default('MYR');
            $table->json('variants_json')->nullable();       // e.g. [{"label":"Size","options":["S","M","L","XL"]}]
            $table->unsignedInteger('stock')->nullable();     // null = unlimited
            $table->foreignId('media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index('event_id');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('event_products');
    }
};
