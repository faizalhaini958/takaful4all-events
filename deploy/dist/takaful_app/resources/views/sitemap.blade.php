<?php echo '<?xml version="1.0" encoding="UTF-8"?>'; ?>

<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

    {{-- Static pages --}}
    @foreach ($staticPages as $page)
        <url>
            <loc>{{ config('app.url') }}{{ $page['url'] }}</loc>
            <changefreq>{{ $page['changefreq'] }}</changefreq>
            <priority>{{ $page['priority'] }}</priority>
        </url>
    @endforeach

    {{-- Category-filtered event listing pages --}}
    @foreach ($categoryPages as $page)
        <url>
            <loc>{{ config('app.url') }}{{ $page['url'] }}</loc>
            <changefreq>{{ $page['changefreq'] }}</changefreq>
            <priority>{{ $page['priority'] }}</priority>
        </url>
    @endforeach

    {{-- Status-filtered event listing pages --}}
    @foreach ($statusPages as $page)
        <url>
            <loc>{{ config('app.url') }}{{ $page['url'] }}</loc>
            <changefreq>{{ $page['changefreq'] }}</changefreq>
            <priority>{{ $page['priority'] }}</priority>
        </url>
    @endforeach

    {{-- Type-filtered content listing pages --}}
    @foreach ($typePages as $page)
        <url>
            <loc>{{ config('app.url') }}{{ $page['url'] }}</loc>
            <changefreq>{{ $page['changefreq'] }}</changefreq>
            <priority>{{ $page['priority'] }}</priority>
        </url>
    @endforeach

    {{-- Dynamic event pages --}}
    @foreach ($events as $event)
        <url>
            <loc>{{ config('app.url') }}/events/{{ $event->slug }}</loc>
            <lastmod>{{ $event->updated_at->toAtomString() }}</lastmod>
            <changefreq>weekly</changefreq>
            <priority>0.8</priority>
        </url>
    @endforeach

    {{-- Blog / Post pages --}}
    @foreach ($posts as $post)
        <url>
            <loc>{{ config('app.url') }}/posts/{{ $post->slug }}</loc>
            <lastmod>{{ $post->updated_at->toAtomString() }}</lastmod>
            <changefreq>monthly</changefreq>
            <priority>0.6</priority>
        </url>
    @endforeach

    {{-- Dynamic CMS pages --}}
    @foreach ($pages as $page)
        <url>
            <loc>{{ config('app.url') }}/{{ $page->slug }}</loc>
            <lastmod>{{ $page->updated_at->toAtomString() }}</lastmod>
            <changefreq>monthly</changefreq>
            <priority>0.5</priority>
        </url>
    @endforeach

</urlset>
