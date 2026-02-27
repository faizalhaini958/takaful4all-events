<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EventRegistrationProduct extends Model
{
    protected $fillable = [
        'registration_id',
        'product_id',
        'variant',
        'quantity',
        'unit_price',
    ];

    protected $casts = [
        'quantity'   => 'integer',
        'unit_price' => 'decimal:2',
    ];

    // ─── Relationships ────────────────────────────────────────────────────────

    public function registration(): BelongsTo
    {
        return $this->belongsTo(EventRegistration::class, 'registration_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(EventProduct::class, 'product_id');
    }
}
