<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class EventRegistration extends Model
{
    use LogsActivity;

    protected $fillable = [
        'event_id',
        'ticket_id',
        'user_id',
        'promo_code_id',
        'promo_code_discount',
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
        'confirmation_email_sent_at',
    ];

    protected $casts = [
        'quantity'            => 'integer',
        'subtotal'            => 'decimal:2',
        'discount_amount'     => 'decimal:2',
        'promo_code_discount' => 'decimal:2',
        'products_total'      => 'decimal:2',
        'total_amount'        => 'decimal:2',
        'checked_in_at'             => 'datetime',
        'meta_json'                 => 'array',
        'confirmation_email_sent_at' => 'datetime',
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

    public function attendees(): HasMany
    {
        return $this->hasMany(EventRegistrationAttendee::class, 'registration_id')
            ->orderBy('attendee_no');
    }

    public function invoice(): HasOne
    {
        return $this->hasOne(Invoice::class, 'registration_id');
    }

    public function promoCode(): BelongsTo
    {
        return $this->belongsTo(PromoCode::class, 'promo_code_id');
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

    public function scopeExcludeStalePending(Builder $query, int $graceMinutes = 30): Builder
    {
        $cutoff = now()->subMinutes($graceMinutes);

        return $query->whereNot(function (Builder $q) use ($cutoff) {
            $q->where('status', 'awaiting_payment')
              ->where('created_at', '<', $cutoff);
        });
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

    public function ensureAttendeesExist(): void
    {
        $payloads = $this->buildAttendeePayloads();
        $emails = collect($payloads)
            ->pluck('email')
            ->filter()
            ->map(fn ($email) => strtolower(trim((string) $email)))
            ->unique()
            ->values();

        $usersByEmail = User::query()
            ->when(
                $emails->isNotEmpty(),
                fn (Builder $query) => $query->whereIn('email', $emails->all()),
                fn (Builder $query) => $query->whereRaw('1 = 0')
            )
            ->get()
            ->keyBy(fn (User $user) => strtolower($user->email));

        foreach ($payloads as $payload) {
            $emailKey = strtolower(trim((string) ($payload['email'] ?? '')));
            $matchedUser = $emailKey !== '' ? $usersByEmail->get($emailKey) : null;

            $this->attendees()->updateOrCreate(
                ['attendee_no' => $payload['attendee_no']],
                [
                    'user_id' => $matchedUser?->id,
                    'name' => $payload['name'],
                    'email' => $payload['email'],
                    'phone' => $payload['phone'],
                    'company' => $payload['company'],
                    'job_title' => $payload['job_title'],
                    'dietary_requirements' => $payload['dietary_requirements'],
                    'meta_json' => ! empty($payload['custom_fields'])
                        ? ['custom_fields' => $payload['custom_fields']]
                        : null,
                ]
            );
        }
    }

    private function buildAttendeePayloads(): array
    {
        $attendees = [[
            'attendee_no' => 1,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'company' => $this->company,
            'job_title' => $this->job_title,
            'dietary_requirements' => $this->dietary_requirements,
            'custom_fields' => is_array($this->meta_json) ? ($this->meta_json['custom_fields'] ?? null) : null,
        ]];

        $additionalAttendees = [];
        if (is_array($this->meta_json) && is_array($this->meta_json['attendees'] ?? null)) {
            $additionalAttendees = array_values(array_filter(
                $this->meta_json['attendees'],
                static fn ($attendee) => is_array($attendee)
            ));
        }

        foreach ($additionalAttendees as $index => $attendee) {
            $attendees[] = [
                'attendee_no' => $index + 2,
                'name' => $attendee['name'] ?? ('Attendee ' . ($index + 2)),
                'email' => $attendee['email'] ?? '',
                'phone' => $attendee['phone'] ?? null,
                'company' => $attendee['company'] ?? null,
                'job_title' => $attendee['job_title'] ?? null,
                'dietary_requirements' => $attendee['dietary_requirements'] ?? null,
                'custom_fields' => $attendee['custom_fields'] ?? null,
            ];
        }

        $seatCount = max((int) $this->quantity, count($attendees));
        for ($attendeeNo = count($attendees) + 1; $attendeeNo <= $seatCount; $attendeeNo++) {
            $attendees[] = [
                'attendee_no' => $attendeeNo,
                'name' => 'Attendee ' . $attendeeNo,
                'email' => '',
                'phone' => null,
                'company' => null,
                'job_title' => null,
                'dietary_requirements' => null,
            ];
        }

        return $attendees;
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['status', 'payment_status', 'name', 'email', 'total_amount'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('registration');
    }
}
