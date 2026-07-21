<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('analytics_daily_summaries', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->string('metric_key', 150);
            $table->unsignedBigInteger('value')->default(0);

            $table->unique(['date', 'metric_key']);
            $table->index('date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('analytics_daily_summaries');
    }
};
