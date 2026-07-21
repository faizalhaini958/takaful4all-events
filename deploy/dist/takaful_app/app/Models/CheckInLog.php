<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CheckInLog extends Model
{
    protected $fillable = [
        'event_id',
        'registration_id',
        'attendee_id',
        'user_id',
        'action',
        'performed_at',
        'meta_json',
    ];

    protected $casts = [
        'performed_at' => 'datetime',
        'meta_json'    => 'array',
    ];

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function registration(): BelongsTo
    {
        return $this->belongsTo(EventRegistration::class, 'registration_id');
    }

    public function attendee(): BelongsTo
    {
        return $this->belongsTo(EventRegistrationAttendee::class, 'attendee_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
