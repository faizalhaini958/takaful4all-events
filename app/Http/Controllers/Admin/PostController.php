<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePostRequest;
use App\Models\Post;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class PostController extends Controller
{
    public function index(): Response
    {
        $type = request('type');

        $query = Post::with('media')->latest();

        if (in_array($type, ['podcast', 'webinar', 'article', 'agent360'])) {
            $query->where('type', $type);
        }

        return Inertia::render('Admin/Posts/Index', [
            'posts'      => $query->paginate(15)->withQueryString(),
            'activeType' => $type ?? 'all',
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Posts/Create');
    }

    public function store(StorePostRequest $request): RedirectResponse
    {
        Post::create($request->validated());

        $this->clearHomeCache();

        return redirect()->route('admin.posts.index')
            ->with('success', 'Post created successfully.');
    }

    public function edit(Post $post): Response
    {
        return Inertia::render('Admin/Posts/Edit', [
            'post' => $post->load('media'),
        ]);
    }

    public function update(StorePostRequest $request, Post $post): RedirectResponse
    {
        $post->update($request->validated());

        $this->clearHomeCache();

        return redirect()->route('admin.posts.index')
            ->with('success', 'Post updated successfully.');
    }

    public function duplicate(Post $post): RedirectResponse
    {
        $newPost = $post->replicate(['slug']);
        $newPost->title        = 'Copy of ' . $post->title;
        $newPost->is_published = false;
        $newPost->save();

        $this->clearHomeCache();

        return redirect()->route('admin.posts.edit', $newPost)
            ->with('success', 'Post duplicated. You are now editing the copy.');
    }

    public function destroy(Post $post): RedirectResponse
    {
        $post->delete();

        $this->clearHomeCache();

        return redirect()->route('admin.posts.index')
            ->with('success', 'Post deleted.');
    }

    private function clearHomeCache(): void
    {
        Cache::forget('home.podcasts');
        Cache::forget('home.webinars');
        Cache::forget('home.agent360');
    }
}
