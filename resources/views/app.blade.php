<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title inertia>{{ config('app.name', 'Takaful4all Events') }}</title>

    <!-- Default meta -->
    <meta name="description" content="Discover and register for upcoming conferences, webinars and workshops organised by Takaful4All.">

    <!-- Open Graph defaults (overridden by page-level Inertia <Head> tags) -->
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="{{ config('app.name', 'Takaful4all Events') }}">
    <meta property="og:title" content="{{ config('app.name', 'Takaful4all Events') }}">
    <meta property="og:description" content="Discover and register for upcoming conferences, webinars and workshops organised by Takaful4All.">
    <meta property="og:url" content="{{ url()->current() }}">
    <meta property="og:image" content="{{ config('app.url') }}/images/logo.png">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">

    <!-- Twitter Card defaults -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{{ config('app.name', 'Takaful4all Events') }}">
    <meta name="twitter:description" content="Discover and register for upcoming conferences, webinars and workshops organised by Takaful4All.">
    <meta name="twitter:image" content="{{ config('app.url') }}/images/logo.png">

    <!-- hreflang alternates -->
    <link rel="alternate" hreflang="en" href="{{ str_replace('/ms/', '/en/', url()->current()) }}">
    <link rel="alternate" hreflang="ms" href="{{ str_replace('/en/', '/ms/', url()->current()) }}">
    <link rel="alternate" hreflang="x-default" href="{{ config('app.url') }}">

    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <link rel="shortcut icon" href="/favicon.ico">

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link
        href="https://fonts.bunny.net/css?family=figtree:400,500,600|poppins:400,600,700,800,900|inter:400,500,600|dm-sans:400,500,600&display=swap"
        rel="stylesheet" />

    <!-- Scripts -->
    @routes
    @viteReactRefresh
    @vite(['resources/js/app.tsx', "resources/js/Pages/{$page['component']}.tsx"])
    <!-- Google Analytics (GA4) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-PQQ315BHCE"></script>
    <script>
        window.dataLayer = window.dataLayer || [];

        function gtag() {
            dataLayer.push(arguments);
        }
        gtag('js', new Date());
        gtag('config', 'G-PQQ315BHCE', {
            'send_page_view': true
        });
    </script>

    @inertiaHead
</head>

<body class="font-sans antialiased">
    @inertia
</body>

</html>
