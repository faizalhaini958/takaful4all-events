<?php

namespace App\Http\Controllers;

use App\Models\Post;
use Inertia\Inertia;
use Inertia\Response;

class PostController extends Controller
{
    public function webinars(): Response
    {
        $webinars = Post::published()
            ->ofType('webinar')
            ->with('media')
            ->latest('published_at')
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('Public/Posts/Webinars', [
            'webinars' => $webinars,
        ]);
    }

    public function podcasts(): Response
    {
        $podcasts = Post::published()
            ->ofType('podcast')
            ->with('media')
            ->latest('published_at')
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('Public/Posts/Podcasts', [
            'podcasts' => $podcasts,
        ]);
    }

    public function agent360(): Response
    {
        $posts = Post::published()
            ->ofType('agent360')
            ->with('media')
            ->latest('published_at')
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('Public/Posts/Agent360', [
            'posts' => $posts,
        ]);
    }
}
