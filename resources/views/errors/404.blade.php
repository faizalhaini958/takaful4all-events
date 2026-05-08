<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Page Not Found — Takaful4all Events</title>
    <link rel="icon" type="image/png" href="/favicon.png">
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=figtree:400,500,600,700&display=swap" rel="stylesheet" />
    <style>
        *,
        *::before,
        *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Figtree', sans-serif;
            background: #f8fafc;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }

        header {
            background: #003366;
            padding: 16px 24px;
        }

        header a {
            color: #ffffff;
            text-decoration: none;
            font-weight: 700;
            font-size: 18px;
            letter-spacing: -0.3px;
        }

        header span {
            color: #009FBB;
        }

        main {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 48px 24px;
        }

        .card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 20px;
            padding: 56px 48px;
            text-align: center;
            max-width: 480px;
            width: 100%;
            box-shadow: 0 4px 24px rgba(0, 0, 0, 0.07);
        }

        .icon {
            width: 72px;
            height: 72px;
            background: #f0fafb;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
        }

        .icon svg {
            width: 36px;
            height: 36px;
            color: #009FBB;
        }

        .code {
            font-size: 13px;
            font-weight: 700;
            letter-spacing: 2px;
            text-transform: uppercase;
            color: #009FBB;
            margin-bottom: 12px;
        }

        h1 {
            font-size: 28px;
            font-weight: 700;
            color: #003366;
            margin-bottom: 12px;
            line-height: 1.2;
        }

        p {
            color: #64748b;
            font-size: 15px;
            line-height: 1.6;
            margin-bottom: 32px;
        }

        .btn-group {
            display: flex;
            gap: 12px;
            justify-content: center;
            flex-wrap: wrap;
        }

        .btn-primary {
            background: #009FBB;
            color: #ffffff;
            border: none;
            border-radius: 10px;
            padding: 11px 24px;
            font-size: 14px;
            font-weight: 600;
            text-decoration: none;
            cursor: pointer;
            transition: background 0.15s;
        }

        .btn-primary:hover {
            background: #007A92;
        }

        .btn-secondary {
            background: transparent;
            color: #003366;
            border: 1.5px solid #cbd5e1;
            border-radius: 10px;
            padding: 10px 24px;
            font-size: 14px;
            font-weight: 600;
            text-decoration: none;
            cursor: pointer;
            transition: border-color 0.15s, color 0.15s;
        }

        .btn-secondary:hover {
            border-color: #009FBB;
            color: #009FBB;
        }

        footer {
            text-align: center;
            padding: 20px;
            font-size: 13px;
            color: #94a3b8;
        }
    </style>
</head>

<body>
    <header>
        <a href="/">Takaful4all <span>Events</span></a>
    </header>

    <main>
        <div class="card">
            <div class="icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    stroke-width="1.8">
                    <path stroke-linecap="round" stroke-linejoin="round"
                        d="M9.172 14.828A4 4 0 0114.828 9.17M9.172 14.828L7.05 16.95m2.122-2.122A4 4 0 0114.828 9.17m0 0L16.95 7.05M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <p class="code">404 Error</p>
            <h1>Page Not Found</h1>
            <p>The page you're looking for doesn't exist or may have been moved. It could also be that the event
                registration is not open yet.</p>
            <div class="btn-group">
                <a href="/" class="btn-primary">Back to Home</a>
                <a href="/events" class="btn-secondary">Browse Events</a>
            </div>
        </div>
    </main>

    <footer>
        &copy; {{ date('Y') }} Takaful4all Events. All rights reserved.
    </footer>
</body>

</html>
