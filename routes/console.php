<?php

use App\Console\Commands\AggregateAnalytics;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Aggregate yesterday's analytics data every day at 01:00
Schedule::command(AggregateAnalytics::class)->dailyAt('01:00');
