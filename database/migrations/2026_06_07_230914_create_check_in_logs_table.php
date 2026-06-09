<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('check_in_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained('events')->cascadeOnDelete();
            $table->foreignId('registration_id')->constrained('event_registrations')->cascadeOnDelete();
            $table->foreignId('attendee_id')->nullable()->constrained('event_registration_attendees')->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action'); // checked_in, checked_out
            $table->dateTime('performed_at');
            $table->json('meta_json')->nullable();
            $table->timestamps();

            $table->index(['event_id', 'performed_at']);
            $table->index('registration_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('check_in_logs');
    }
};
