<?php echo '<?xml version="1.0" encoding="UTF-8"?>'; ?>'; ?>

<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

    {{-- Static pages --}}
    @foreach ($staticPages as $page)
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

</urlset>
