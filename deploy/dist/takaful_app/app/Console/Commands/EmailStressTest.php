<?php

namespace App\Console\Commands;

use App\Mail\BroadcastMail;
use App\Mail\RegistrationConfirmationMail;
use App\Models\EventRegistration;
use App\Models\Media;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class EmailStressTest extends Command
{
    protected $signature = 'email:stress-test
                            {count=10 : Number of emails to queue}
                            {--id=1 : Registration ID to use as template (non-broadcast mode)}
                            {--send : Use send() instead of queue() (sync)}
                            {--delay : Add a random delay between dispatches}
                            {--broadcast : Test BroadcastMail with images instead of registration mails}
                            {--recipients=5 : Number of recipients per broadcast (broadcast mode)}
                            {--images=2 : Number of images to include per broadcast body}';

    protected $description = 'Stress test email compose by queuing multiple emails';

    public function handle(): int
    {
        $useSend  = $this->option('send');
        $addDelay = $this->option('delay');

        if ($this->option('broadcast')) {
            return $this->handleBroadcastStress();
        }

        $count      = (int) $this->argument('count');
        $templateId = (int) $this->option('id');

        $registration = EventRegistration::with(['event', 'ticket', 'attendees', 'invoice'])
            ->findOrFail($templateId);

        $this->info("Using template: Registration #{$templateId} ({$registration->reference_no})");
        $this->info("Email to: {$registration->email}");
        $this->info("Queuing {$count} emails...");
        $this->warnMode($useSend);
        $this->newLine();

        $start   = microtime(true);
        $bar     = $this->output->createProgressBar($count);
        $bar->start();

        $success = 0;
        $failed  = 0;

        for ($i = 1; $i <= $count; $i++) {
            try {
                $mailable = new RegistrationConfirmationMail($registration);

                if ($useSend) {
                    Mail::to($registration->email)->send($mailable);
                } else {
                    Mail::to($registration->email)->queue($mailable);
                }

                $success++;

                if ($addDelay) {
                    usleep(random_int(10000, 100000));
                }
            } catch (\Throwable $e) {
                $failed++;
                $this->newLine();
                $this->error("  Failed email #{$i}: {$e->getMessage()}");
            }

            $bar->advance();
        }

        $bar->finish();
        $elapsed = round(microtime(true) - $start, 3);

        $this->reportResults($count, $success, $failed, $elapsed, $useSend);

        return self::SUCCESS;
    }

    private function handleBroadcastStress(): int
    {
        $count          = (int) $this->argument('count');
        $recipientsPer  = (int) $this->option('recipients');
        $imageCount     = (int) $this->option('images');
        $useSend        = $this->option('send');
        $addDelay       = $this->option('delay');

        $mediaItems = Media::limit($imageCount)->get();

        if ($mediaItems->isEmpty()) {
            $this->error('No media found in the library. Upload at least one image first.');
            return self::FAILURE;
        }

        $users = User::select('id', 'name', 'email')->limit($recipientsPer)->get();

        if ($users->isEmpty()) {
            $this->error('No users found in the database.');
            return self::FAILURE;
        }

        $this->info('╔══════════════════════════════════════╗');
        $this->info('║   BROADCAST EMAIL STRESS TEST        ║');
        $this->info('╚══════════════════════════════════════╝');
        $this->newLine();
        $this->table(
            ['Parameter', 'Value'],
            [
                ['Broadcasts to queue', $count],
                ['Recipients per broadcast', $recipientsPer],
                ['Total emails generated', $count * $recipientsPer],
                ['Images per email', $imageCount],
                ['Media IDs used', $mediaItems->pluck('id')->implode(', ')],
                ['Image sizes', $mediaItems->map(fn ($m) => $this->formatSize($m->size))->implode(', ')],
                ['Mode', $useSend ? 'send() sync' : 'queue() async'],
            ]
        );

        if (!$this->confirm('Proceed with stress test?', true)) {
            return self::SUCCESS;
        }

        $this->newLine();
        $this->info('Generating email body with images...');

        $imageHtml = $mediaItems->map(function (Media $media) {
            $sizeLabel = $media->size !== null && $media->size <= 102400
                ? 'CID (small)'
                : 'URL (large)';
            return sprintf(
                '<img src="%s" data-media-id="%d" alt="%s" style="max-width:100%%;height:auto"><br>',
                e($media->url),
                $media->id,
                e($media->title ?? 'image-' . $media->id)
            );
        })->implode("\n");

        $body = sprintf(
            '<p>Dear {{name}},</p><p>This is a stress test broadcast (#{{email}}).</p>%s<p>Thank you.</p>',
            $imageHtml
        );

        $subject = 'Stress Test Broadcast — ' . date('H:i:s');

        $this->line("  Subject: <info>{$subject}</info>");
        $this->line("  Body length: " . strlen($body) . " chars");
        $this->line("  Image tags: " . $imageCount);
        $this->newLine();

        $start         = microtime(true);
        $totalSuccess  = 0;
        $totalFailed   = 0;
        $queueJobsBefore = DB::table('jobs')->count();
        $memoryStart   = memory_get_usage(true);

        $bar = $this->output->createProgressBar($count);
        $bar->start();

        for ($i = 1; $i <= $count; $i++) {
            try {
                foreach ($users as $user) {
                    $replacements = ['{{name}}' => $user->name, '{{email}}' => $user->email];
                    $personalizedBody = str_replace(array_keys($replacements), array_values($replacements), $body);

                    $mailable = new BroadcastMail($subject, $personalizedBody, $user);

                    if ($useSend) {
                        Mail::to($user)->send($mailable);
                    } else {
                        Mail::to($user)->queue($mailable);
                    }

                    $totalSuccess++;
                }

                if ($addDelay) {
                    usleep(random_int(5000, 50000));
                }
            } catch (\Throwable $e) {
                $totalFailed += $recipientsPer;
                $this->newLine();
                $this->error("  Failed broadcast #{$i}: {$e->getMessage()}");
            }

            $bar->advance();
        }

        $bar->finish();
        $elapsed        = round(microtime(true) - $start, 3);
        $memoryEnd      = memory_get_usage(true);
        $queueJobsAfter = DB::table('jobs')->count();

        $stats = [
            ['Broadcasts dispatched', $count],
            ['Total emails', $totalSuccess + $totalFailed],
            ['Success', $totalSuccess],
            ['Failed', $totalFailed],
            ['Elapsed', "{$elapsed}s"],
            ['Per broadcast', round($elapsed / max($count, 1) * 1000, 2) . 'ms'],
            ['Rate', round($count / max($elapsed, 0.001), 1) . ' broadcasts/s'],
            ['Total email rate', round(($totalSuccess + $totalFailed) / max($elapsed, 0.001), 1) . ' emails/s'],
            ['Memory peak', $this->formatSize(memory_get_peak_usage(true))],
            ['Memory delta', $this->formatSize($memoryEnd - $memoryStart)],
            ['Queue jobs (before)', $queueJobsBefore],
            ['Queue jobs (after)', $queueJobsAfter],
            ['Queue delta', $queueJobsAfter - $queueJobsBefore],
        ];

        if (!$useSend) {
            $stats[] = ['Est. processing time*', $this->estimateQueueTime($totalSuccess) . 's'];
        }

        $this->newLine(2);
        $this->table(['Metric', 'Value'], $stats);

        if (!$useSend) {
            $this->newLine();
            $this->comment('* Estimated at ~50ms per job (single worker).');
            $this->comment('  Run: php artisan queue:work --timeout=300');
        }

        return self::SUCCESS;
    }

    private function warnMode(bool $useSend): void
    {
        if ($useSend) {
            $this->warn('Mode: send() — synchronous, bypasses queue');
        } else {
            $this->info('Mode: queue() — pushes to queue (worker needed)');
        }
    }

    private function reportResults(int $count, int $success, int $failed, float $elapsed, bool $useSend): void
    {
        $this->newLine(2);
        $this->table(
            ['Metric', 'Value'],
            [
                ['Total', $count],
                ['Success', $success],
                ['Failed', $failed],
                ['Elapsed', "{$elapsed}s"],
                ['Per email', round($elapsed / max($count, 1) * 1000, 2) . 'ms'],
                ['Rate', round($count / max($elapsed, 0.001), 1) . ' emails/s'],
                ['Mode', $useSend ? 'send()' : 'queue()'],
            ]
        );

        if (!$useSend) {
            $this->comment("\nRun 'php artisan queue:work' to process the queued emails.");
        }
    }

    private function formatSize(?int $bytes): string
    {
        if ($bytes === null) {
            return 'N/A';
        }

        if ($bytes < 1024) {
            return "{$bytes} B";
        }

        if ($bytes < 1048576) {
            return round($bytes / 1024, 1) . ' KB';
        }

        return round($bytes / 1048576, 1) . ' MB';
    }

    private function estimateQueueTime(int $totalEmails): string
    {
        return (string) round($totalEmails * 0.05);
    }
}
