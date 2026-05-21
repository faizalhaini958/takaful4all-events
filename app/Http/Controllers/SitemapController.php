<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Http\Response;

class SitemapController extends Controller
{
    public function index(): Response
    {
        $events = Event::where('is_published', true)
            ->orderBy('updated_at', 'desc')
            ->get(['slug', 'updated_at']);

        $staticPages = [
            ['url' => '/',         'priority' => '1.0', 'changefreq' => 'daily'],
            ['url' => '/events',   'priority' => '0.9', 'changefreq' => 'daily'],
            ['url' => '/webinars', 'priority' => '0.7', 'changefreq' => 'weekly'],
            ['url' => '/agent360', 'priority' => '0.7', 'changefreq' => 'weekly'],
            ['url' => '/content',  'priority' => '0.7', 'changefreq' => 'weekly'],
            ['url' => '/about',    'priority' => '0.5', 'changefreq' => 'monthly'],
            ['url' => '/contact',  'priority' => '0.5', 'changefreq' => 'monthly'],
        ];

        $xml = view('sitemap', compact('events', 'staticPages'))->render();

        return response($xml, 200)->header('Content-Type', 'application/xml');
    }
}
