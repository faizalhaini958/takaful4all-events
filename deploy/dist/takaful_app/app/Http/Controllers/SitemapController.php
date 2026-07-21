<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Page;
use App\Models\Post;
use Illuminate\Http\Response;

class SitemapController extends Controller
{
    public function index(): Response
    {
        $events = Event::where('is_published', true)
            ->orderBy('updated_at', 'desc')
            ->get(['slug', 'updated_at']);

        $posts = Post::where('is_published', true)
            ->orderBy('updated_at', 'desc')
            ->get(['slug', 'updated_at']);

        $pages = Page::where('is_published', true)
            ->whereNotIn('slug', ['about', 'contact'])
            ->orderBy('updated_at', 'desc')
            ->get(['slug', 'updated_at']);

        $staticPages = [
            ['url' => '/',          'priority' => '1.0', 'changefreq' => 'daily'],
            ['url' => '/events',    'priority' => '0.9', 'changefreq' => 'daily'],
            ['url' => '/webinars',  'priority' => '0.7', 'changefreq' => 'weekly'],
            ['url' => '/agent360',  'priority' => '0.7', 'changefreq' => 'weekly'],
            ['url' => '/content',   'priority' => '0.7', 'changefreq' => 'weekly'],
            ['url' => '/about',     'priority' => '0.5', 'changefreq' => 'monthly'],
            ['url' => '/contact',   'priority' => '0.5', 'changefreq' => 'monthly'],
        ];

        $categoryPages = [
            ['url' => '/events?category=conference',    'priority' => '0.8', 'changefreq' => 'daily'],
            ['url' => '/events?category=workshop',      'priority' => '0.8', 'changefreq' => 'daily'],
            ['url' => '/events?category=sports',        'priority' => '0.7', 'changefreq' => 'weekly'],
            ['url' => '/events?category=exhibition',    'priority' => '0.7', 'changefreq' => 'weekly'],
            ['url' => '/events?category=entertainment', 'priority' => '0.7', 'changefreq' => 'weekly'],
            ['url' => '/events?category=dinner',        'priority' => '0.7', 'changefreq' => 'weekly'],
        ];

        $statusPages = [
            ['url' => '/events?status=upcoming', 'priority' => '0.8', 'changefreq' => 'daily'],
            ['url' => '/events?status=past',     'priority' => '0.6', 'changefreq' => 'weekly'],
        ];

        $typePages = [
            ['url' => '/content?type=webinar',  'priority' => '0.7', 'changefreq' => 'weekly'],
            ['url' => '/content?type=agent360', 'priority' => '0.7', 'changefreq' => 'weekly'],
            ['url' => '/content?type=podcast',  'priority' => '0.7', 'changefreq' => 'weekly'],
        ];

        $xml = view('sitemap', compact('events', 'posts', 'pages', 'staticPages', 'categoryPages', 'statusPages', 'typePages'))->render();

        return response($xml, 200)->header('Content-Type', 'application/xml');
    }
}
