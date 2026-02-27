<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('media', function (Blueprint $table) {
            $table->id();
            $table->string('disk', 50)->default('public');
            $table->string('path', 500);
            $table->string('url', 500);
            $table->string('alt', 255)->nullable();
            $table->string('title', 255)->nullable();
            $table->string('mime', 100)->nullable();
            $table->bigInteger('size')->nullable();
            $table->integer('width')->nullable();
            $table->integer('height')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('media');
    }
};
