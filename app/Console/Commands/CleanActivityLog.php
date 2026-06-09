<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Spatie\Activitylog\Models\Activity;

class CleanActivityLog extends Command
{
    protected $signature = 'activitylog:clean {--days=90 : Delete logs older than this many days}';

    protected $description = 'Clean up old activity log entries';

    public function handle(): int
    {
        $days = (int) $this->option('days');
        $cutoff = now()->subDays($days);

        $count = Activity::where('created_at', '<', $cutoff)->count();

        if ($count === 0) {
            $this->info('No old activity log entries to clean.');
            return self::SUCCESS;
        }

        Activity::where('created_at', '<', $cutoff)->delete();

        $this->info("Deleted {$count} activity log entries older than {$days} days.");

        return self::SUCCESS;
    }
}
