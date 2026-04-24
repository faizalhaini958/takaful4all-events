<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('event_registration_attendees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('registration_id')->constrained('event_registrations')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedInteger('attendee_no')->default(1);
            $table->string('name');
            $table->string('email');
            $table->string('phone', 30)->nullable();
            $table->string('company')->nullable();
            $table->string('job_title')->nullable();
            $table->string('dietary_requirements')->nullable();
            $table->timestamps();

            $table->index('registration_id');
            $table->index('user_id');
            $table->index('email');
            $table->unique(['registration_id', 'attendee_no']);
        });

        // Backfill existing registrations so current attendees can log in and view tickets.
        DB::table('event_registrations')
            ->orderBy('id')
            ->chunkById(200, function ($registrations): void {
                foreach ($registrations as $registration) {
                    $existing = DB::table('event_registration_attendees')
                        ->where('registration_id', $registration->id)
                        ->exists();

                    if ($existing) {
                        continue;
                    }

                    $meta = [];
                    if (!empty($registration->meta_json)) {
                        $decoded = json_decode($registration->meta_json, true);
                        if (is_array($decoded)) {
                            $meta = $decoded;
                        }
                    }

                    $rows = [[
                        'registration_id' => $registration->id,
                        'user_id' => null,
                        'attendee_no' => 1,
                        'name' => $registration->name,
                        'email' => $registration->email,
                        'phone' => $registration->phone,
                        'company' => $registration->company,
                        'job_title' => $registration->job_title,
                        'dietary_requirements' => $registration->dietary_requirements,
                        'created_at' => $registration->created_at,
                        'updated_at' => $registration->updated_at,
                    ]];

                    $additional = $meta['attendees'] ?? [];
                    if (is_array($additional)) {
                        foreach ($additional as $index => $attendee) {
                            if (!is_array($attendee)) {
                                continue;
                            }

                            $rows[] = [
                                'registration_id' => $registration->id,
                                'user_id' => null,
                                'attendee_no' => $index + 2,
                                'name' => $attendee['name'] ?? 'Attendee ' . ($index + 2),
                                'email' => $attendee['email'] ?? '',
                                'phone' => $attendee['phone'] ?? null,
                                'company' => $attendee['company'] ?? null,
                                'job_title' => $attendee['job_title'] ?? null,
                                'dietary_requirements' => $attendee['dietary_requirements'] ?? null,
                                'created_at' => $registration->created_at,
                                'updated_at' => $registration->updated_at,
                            ];
                        }
                    }

                    DB::table('event_registration_attendees')->insert($rows);
                }
            });
    }

    public function down(): void
    {
        Schema::dropIfExists('event_registration_attendees');
    }
};
