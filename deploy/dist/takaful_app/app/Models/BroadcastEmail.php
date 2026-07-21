<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BroadcastEmail extends Model
{
    protected $fillable = [
        'user_id',
        'subject',
        'body',
        'recipient_type',
        'recipient_label',
        'recipient_count',
    ];

    protected $casts = [
        'recipient_count' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
