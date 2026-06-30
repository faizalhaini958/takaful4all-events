<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="google-site-verification" content="d25ffea8a19d9d23" />

    <title inertia>{{ config('app.name', 'Takaful4all Events') }}</title>

    <!-- Default meta -->
    <meta name="description" content="Takaful4All Events is the official events platform of the Malaysian Takaful Association. Discover and register for upcoming conferences, webinars, workshops and takaful industry events.">

    <!-- Open Graph defaults (overridden by page-level Inertia <Head> tags) -->
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="{{ config('app.name', 'Takaful4all Events') }}">
    <meta property="og:title" content="{{ config('app.name', 'Takaful4all Events') }} | Conferences, Webinars &amp; Workshops">
    <meta property="og:description" content="Takaful4All Events is the official events platform of the Malaysian Takaful Association. Discover and register for upcoming conferences, webinars, workshops and takaful industry events.">
    <meta property="og:url" content="{{ url()->current() }}">
    <meta property="og:image" content="{{ config('app.url') }}/images/logo.png">

    <!-- Twitter Card defaults -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{{ config('app.name', 'Takaful4all Events') }} | Conferences, Webinars &amp; Workshops">
    <meta name="twitter:description" content="Takaful4All Events is the official events platform of the Malaysian Takaful Association. Discover and register for upcoming conferences, webinars, workshops and takaful industry events.">
    <meta name="twitter:image" content="{{ config('app.url') }}/images/logo.png">

    <!-- hreflang alternates -->
    <link rel="alternate" hreflang="en" href="{{ str_replace('/ms/', '/en/', url()->current()) }}">
    <link rel="alternate" hreflang="ms" href="{{ str_replace('/en/', '/ms/', url()->current()) }}">
    <link rel="alternate" hreflang="x-default" href="{{ config('app.url') }}">

    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <link rel="shortcut icon" href="/favicon.ico">

    <!-- Preconnects -->
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link rel="preconnect" href="https://www.googletagmanager.com">
    <!-- Fonts -->
    <link
        href="https://fonts.bunny.net/css?family=poppins:400,600,700,800|inter:400,500&display=swap"
        rel="stylesheet" />

    <!-- Scripts -->
    @routes
    @viteReactRefresh
    @vite(['resources/js/app.tsx', "resources/js/Pages/{$page['component']}.tsx"])

    @inertiaHead
    @if(isset($heroImage) && $heroImage)
    <link rel="preload" as="image" href="{{ $heroImage }}" fetchpriority="high">
    @endif
</head>

<body class="font-sans antialiased">
    @inertia

    <!-- Google Analytics (GA4) — deferred to avoid blocking initial render -->
    <script>
        window.addEventListener('load', function() {
            setTimeout(function() {
                var gtagScript = document.createElement('script');
                gtagScript.async = true;
                gtagScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-PQQ315BHCE';
                document.body.appendChild(gtagScript);
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'G-PQQ315BHCE');
            }, 2000);
        });
    </script>
</body>

</html>
