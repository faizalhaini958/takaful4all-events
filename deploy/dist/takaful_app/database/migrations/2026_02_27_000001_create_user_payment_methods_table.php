<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_payment_methods', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['card', 'fpx', 'ewallet'])->default('card');
            $table->string('label');               // user display label
            $table->string('last4', 4)->nullable(); // last 4 digits of card
            $table->string('bank_name')->nullable();
            $table->boolean('is_default')->default(false);
            $table->json('meta_json')->nullable();  // extra details
            $table->timestamps();

            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_payment_methods');
    }
};
