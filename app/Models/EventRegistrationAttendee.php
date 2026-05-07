<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EventRegistrationAttendee extends Model
{
    protected $fillable = [
        'registration_id',
        'user_id',
        'attendee_no',
        'name',
        'email',
        'phone',
        'company',
        'job_title',
        'dietary_requirements',
        'checked_in_at',
        'meta_json',
    ];

    protected $casts = [
        'checked_in_at' => 'datetime',
        'meta_json'     => 'array',
    ];

    public function registration(): BelongsTo
    {
        return $this->belongsTo(EventRegistration::class, 'registration_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function markAsCheckedIn(): void
    {
        $this->update(['checked_in_at' => now()]);
    }
}
