<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Server Error — Takaful4all Events</title>
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
            background: #fff8f0;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
        }

        .icon svg {
            width: 36px;
            height: 36px;
            color: #f97316;
        }

        .code {
            font-size: 13px;
            font-weight: 700;
            letter-spacing: 2px;
            text-transform: uppercase;
            color: #f97316;
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
            transition: background 0.15s;
        }

        .btn-primary:hover {
            background: #007A92;
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
                        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
            </div>
            <p class="code">500 Error</p>
            <h1>Something Went Wrong</h1>
            <p>We encountered an unexpected error. Our team has been notified. Please try again in a few moments.</p>
            <div class="btn-group">
                <a href="/" class="btn-primary">Back to Home</a>
            </div>
        </div>
    </main>

    <footer>
        &copy; {{ date('Y') }} Takaful4all Events. All rights reserved.
    </footer>
</body>

</html>
