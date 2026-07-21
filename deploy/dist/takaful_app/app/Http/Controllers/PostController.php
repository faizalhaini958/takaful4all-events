<?php

namespace App\Http\Controllers;

use App\Models\ContentBanner;
use App\Models\Post;
use Inertia\Inertia;
use Inertia\Response;

class PostController extends Controller
{
    private const CONTENT_TYPES = ['webinar', 'agent360', 'podcast'];

    private const TYPE_LABELS = [
        'webinar'  => 'Webinars',
        'agent360' => 'Agent360',
        'podcast'  => 'Podcasts',
    ];

    public function webinars(): Response
    {
        $webinars = Post::published()
            ->ofType('webinar')
            ->with('media')
            ->latest('published_at')
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('Public/Posts/Webinars', [
            'webinars'     => $webinars,
            'canonicalUrl' => url()->current(),
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
            'posts'        => $posts,
            'canonicalUrl' => url()->current(),
        ]);
    }

    public function content(): Response
    {
        $type = request('type');

        $query = Post::published()
            ->with('media')
            ->latest('published_at');

        if ($type && in_array($type, self::CONTENT_TYPES)) {
            $query->ofType($type);
        } else {
            $query->whereIn('type', self::CONTENT_TYPES);
            $type = null;
        }

        $posts = $query->paginate(12)->withQueryString();

        $banners = ContentBanner::published()->get();

        return Inertia::render('Public/Posts/Content', [
            'posts'           => $posts,
            'activeType'      => $type ?? 'all',
            'banners'         => $banners,
            'canonicalUrl'    => $this->buildCanonicalUrl($type),
            'metaTitle'       => $this->buildMetaTitle($type),
            'metaDescription' => $this->buildMetaDescription($type),
        ]);
    }

    private function buildCanonicalUrl(?string $type): string
    {
        if ($type) {
            return route('content.index') . '?type=' . $type;
        }

        return route('content.index');
    }

    private function buildMetaTitle(?string $type): string
    {
        if ($type && isset(self::TYPE_LABELS[$type])) {
            return self::TYPE_LABELS[$type] . ' | Takaful4All Content';
        }

        return 'Content | Takaful4All Events';
    }

    private function buildMetaDescription(?string $type): string
    {
        $labels = [
            'webinar'  => 'webinars',
            'agent360' => 'Agent360 sessions',
            'podcast'  => 'podcasts',
        ];

        if ($type && isset($labels[$type])) {
            return "Watch on-demand {$labels[$type]} from Takaful4All — curated for takaful professionals.";
        }

        return 'Watch on-demand webinars, Agent360 sessions and podcasts from Takaful4All.';
    }

    public function show(Post $post): Response
    {
        abort_unless($post->is_published, 404);

        return Inertia::render('Public/Posts/Show', [
            'post'         => $post->load('media'),
            'canonicalUrl' => url()->current(),
        ]);
    }
}
