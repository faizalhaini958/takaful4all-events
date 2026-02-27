<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserPaymentMethod extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'label',
        'last4',
        'bank_name',
        'is_default',
        'meta_json',
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'meta_json'  => 'array',
    ];

    // ─── Relationships ────────────────────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
