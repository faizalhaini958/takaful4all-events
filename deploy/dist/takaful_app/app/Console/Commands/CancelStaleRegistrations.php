<?php

namespace App\Console\Commands;

use App\Models\EventProduct;
use App\Models\EventRegistration;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CancelStaleRegistrations extends Command
{
    protected $signature = 'registrations:cancel-stale
                            {--grace=30 : Grace period in minutes before cancelling}
                            {--dry-run : Show what would be cancelled without making changes}';

    protected $description = 'Cancel unpaid pending registrations older than the grace period';

    public function handle(): int
    {
        $graceMinutes = (int) $this->option('grace');
        $dryRun = $this->option('dry-run');

        $cutoff = now()->subMinutes($graceMinutes);

        $registrations = EventRegistration::with('products')
            ->where('status', 'awaiting_payment')
            ->where('created_at', '<', $cutoff)
            ->get();

        if ($registrations->isEmpty()) {
            $this->info('No stale registrations found.');

            return self::SUCCESS;
        }

        $this->info("Found {$registrations->count()} stale registration(s) older than {$graceMinutes} minutes.");

        foreach ($registrations as $registration) {
            $this->line("  #{$registration->id} {$registration->reference_no} — {$registration->name} ({$registration->email}) — RM {$registration->total_amount}");

            if ($dryRun) {
                continue;
            }

            $registration->update([
                'status'        => 'cancelled',
                'payment_status' => 'na',
                'meta_json'      => array_merge(
                    $registration->meta_json ?? [],
                    ['stale_cancelled_at' => now()->toIso8601String()]
                ),
            ]);

            foreach ($registration->products as $item) {
                EventProduct::where('id', $item->product_id)
                    ->whereNotNull('stock')
                    ->increment('stock', $item->quantity);
            }

            Log::info('Stale registration cancelled', [
                'registration_id' => $registration->id,
                'reference'       => $registration->reference_no,
                'total_amount'    => $registration->total_amount,
            ]);
        }

        if ($dryRun) {
            $this->warn('Dry run — no changes made. Run without --dry-run to cancel.');
        } else {
            $this->info("Cancelled {$registrations->count()} stale registration(s).");
        }

        return self::SUCCESS;
    }
}
