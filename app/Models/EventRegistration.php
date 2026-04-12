<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;

class EventRegistration extends Model
{
    protected $fillable = [
        'event_id',
        'ticket_id',
        'user_id',
        'reference_no',
        'name',
        'email',
        'phone',
        'company',
        'job_title',
        'dietary_requirements',
        'status',
        'quantity',
        'subtotal',
        'discount_amount',
        'products_total',
        'total_amount',
        'payment_status',
        'payment_method',
        'payment_reference',
        'notes',
        'checked_in_at',
        'meta_json',
    ];

    protected $casts = [
        'quantity'        => 'integer',
        'subtotal'        => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'products_total'  => 'decimal:2',
        'total_amount'    => 'decimal:2',
        'checked_in_at'   => 'datetime',
        'meta_json'       => 'array',
    ];

    // ─── Boot ─────────────────────────────────────────────────────────────────

    protected static function booted(): void
    {
        static::creating(function (EventRegistration $reg) {
            if (empty($reg->reference_no)) {
                $reg->reference_no = self::generateReferenceNo();
            }
        });
    }

    public static function generateReferenceNo(): string
    {
        do {
            $ref = 'EVT-' . now()->format('Ymd') . '-' . strtoupper(Str::random(4));
        } while (self::where('reference_no', $ref)->exists());

        return $ref;
    }

    // ─── Relationships ────────────────────────────────────────────────────────

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(EventTicket::class, 'ticket_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function products(): HasMany
    {
        return $this->hasMany(EventRegistrationProduct::class, 'registration_id');
    }

    public function invoice(): HasOne
    {
        return $this->hasOne(Invoice::class, 'registration_id');
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopeConfirmed(Builder $query): Builder
    {
        return $query->where('status', 'confirmed');
    }

    public function scopeAttended(Builder $query): Builder
    {
        return $query->where('status', 'attended');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->whereNotIn('status', ['cancelled']);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    public function markAsCheckedIn(): void
    {
        $this->update([
            'status'        => 'attended',
            'checked_in_at' => now(),
        ]);
    }

    public function markAsCancelled(): void
    {
        $this->update(['status' => 'cancelled']);
    }
}
