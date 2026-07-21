<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Invoice extends Model
{
    protected $fillable = [
        'registration_id',
        'user_id',
        'invoice_number',
        'company_name',
        'company_registration_no',
        'subtotal',
        'discount_amount',
        'total_amount',
        'issued_at',
        'pdf_path',
        'meta_json',
    ];

    protected $casts = [
        'subtotal'        => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'total_amount'    => 'decimal:2',
        'issued_at'       => 'datetime',
        'meta_json'       => 'array',
    ];

    // ─── Relationships ────────────────────────────────────────────────────────

    public function registration(): BelongsTo
    {
        return $this->belongsTo(EventRegistration::class, 'registration_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Generate a unique invoice number in the format INV-YYYYMMDD-XXXX.
     */
    public static function generateInvoiceNumber(): string
    {
        do {
            $number = 'INV-' . now()->format('Ymd') . '-' . strtoupper(Str::random(4));
        } while (self::where('invoice_number', $number)->exists());

        return $number;
    }
}
