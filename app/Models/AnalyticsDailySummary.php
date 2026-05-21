<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AnalyticsDailySummary extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'date',
        'metric_key',
        'value',
    ];

    protected $casts = [
        'date'  => 'date',
        'value' => 'integer',
    ];
}
