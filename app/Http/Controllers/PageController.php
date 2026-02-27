<?php

namespace App\Http\Controllers;

use App\Models\Page;
use Inertia\Inertia;
use Inertia\Response;

class PageController extends Controller
{
    public function show(string $slug): Response
    {
        $page = Page::published()->where('slug', $slug)->firstOrFail();

        return Inertia::render('Public/Page', [
            'page' => $page,
        ]);
    }
}
