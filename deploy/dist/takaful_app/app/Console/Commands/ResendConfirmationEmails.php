<?php

namespace App\Console\Commands;

use App\Mail\RegistrationConfirmationMail;
use App\Models\EventRegistration;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class ResendConfirmationEmails extends Command
{
    protected $signature = 'email:resend-confirmations
                            {--dry-run : Show what would be sent without actually sending}';

    protected $description = 'Resend confirmation emails to confirmed registrations that never received one';

    public function handle(): int
    {
        $registrations = EventRegistration::whereIn('status', ['confirmed', 'attended'])
            ->whereNull('confirmation_email_sent_at')
            ->get();

        if ($registrations->isEmpty()) {
            $this->info('No pending confirmation emails to send.');
            return self::SUCCESS;
        }

        $this->info("Found {$registrations->count()} registration(s) without confirmation email.");

        if ($this->option('dry-run')) {
            $this->table(
                ['Reference', 'Name', 'Email', 'Payment Status', 'Status'],
                $registrations->map(fn ($r) => [
                    $r->reference_no,
                    $r->name,
                    $r->email,
                    $r->payment_status,
                    $r->status,
                ])->toArray()
            );
            return self::SUCCESS;
        }

        $queued = 0;
        $failed = 0;

        foreach ($registrations as $registration) {
            try {
                Mail::to($registration->email)
                    ->queue(new RegistrationConfirmationMail($registration));

                $registration->updateQuietly(['confirmation_email_sent_at' => now()]);
                $queued++;

                $this->line("  <info>Queued:</info> {$registration->reference_no} — {$registration->email}");
            } catch (\Throwable $e) {
                $failed++;
                $this->error("  Failed: {$registration->reference_no} — {$e->getMessage()}");
            }
        }

        $this->info("Done. {$queued} queued, {$failed} failed.");

        return self::SUCCESS;
    }
}
