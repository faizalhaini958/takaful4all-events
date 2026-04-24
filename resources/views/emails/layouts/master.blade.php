<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'Takaful Events')</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 15px;
            line-height: 1.6;
            color: #333;
            background-color: #f4f6f9;
        }
        .wrapper {
            max-width: 620px;
            margin: 32px auto;
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 12px rgba(0,0,0,0.08);
        }
        /* Header */
        .email-header {
            background-color: #1e3a5f;
            padding: 28px 36px;
            text-align: center;
        }
        .email-header .logo-text {
            font-size: 22px;
            font-weight: bold;
            color: #ffffff;
            letter-spacing: 0.5px;
        }
        .email-header .tagline {
            font-size: 12px;
            color: rgba(255,255,255,0.65);
            margin-top: 4px;
        }
        /* Body */
        .email-body {
            padding: 36px;
        }
        h1.email-title {
            font-size: 22px;
            font-weight: bold;
            color: #1e3a5f;
            margin-bottom: 8px;
        }
        .email-intro {
            font-size: 15px;
            color: #555;
            margin-bottom: 24px;
        }
        /* Info card */
        .info-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px 24px;
            margin-bottom: 24px;
        }
        .info-card .info-row {
            display: table;
            width: 100%;
            padding: 5px 0;
            border-bottom: 1px solid #eef1f5;
        }
        .info-card .info-row:last-child { border-bottom: none; }
        .info-card .info-label {
            display: table-cell;
            font-size: 12px;
            font-weight: bold;
            color: #888;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            width: 38%;
            padding-right: 12px;
            vertical-align: top;
            padding-top: 6px;
        }
        .info-card .info-value {
            display: table-cell;
            font-size: 14px;
            color: #333;
            vertical-align: top;
            padding-top: 6px;
        }
        /* CTA Button */
        .btn-cta {
            display: inline-block;
            background-color: #1e3a5f;
            color: #ffffff !important;
            font-size: 15px;
            font-weight: bold;
            padding: 14px 32px;
            border-radius: 6px;
            text-decoration: none;
            margin: 8px 0;
        }
        .btn-secondary {
            display: inline-block;
            background-color: #f0f4f8;
            color: #1e3a5f !important;
            font-size: 14px;
            font-weight: bold;
            padding: 12px 24px;
            border-radius: 6px;
            text-decoration: none;
            border: 1px solid #d1dce8;
            margin: 4px 0;
        }
        .cta-block {
            text-align: center;
            padding: 8px 0 24px;
        }
        /* Divider */
        .divider {
            border: none;
            border-top: 1px solid #eef1f5;
            margin: 24px 0;
        }
        /* Attendee badge */
        .attendee-badge {
            display: inline-block;
            background-color: #eaf2ff;
            color: #1e3a5f;
            font-size: 13px;
            font-weight: 600;
            padding: 4px 12px;
            border-radius: 20px;
            margin: 3px 3px 3px 0;
        }
        /* Alert box */
        .alert-box {
            background-color: #fff8e6;
            border-left: 4px solid #f59e0b;
            border-radius: 0 6px 6px 0;
            padding: 14px 18px;
            margin-bottom: 24px;
            font-size: 14px;
            color: #854d0e;
        }
        /* Footer */
        .email-footer {
            background-color: #f4f6f9;
            padding: 24px 36px;
            text-align: center;
            font-size: 12px;
            color: #888;
            border-top: 1px solid #e2e8f0;
        }
        .email-footer a { color: #1e3a5f; text-decoration: none; }
    </style>
</head>
<body>
    <div class="wrapper">
        <!-- Header -->
        <div class="email-header">
            <div class="logo-text">{{ $siteName ?? 'Takaful Events' }}</div>
            <div class="tagline">Malaysian Takaful Association</div>
        </div>

        <!-- Content -->
        <div class="email-body">
            @yield('content')
        </div>

        <!-- Footer -->
        <div class="email-footer">
            <p>© {{ date('Y') }} {{ $siteName ?? 'Takaful Events' }} · Malaysian Takaful Association</p>
            <p style="margin-top: 6px;">
                Questions? Contact us at
                <a href="mailto:{{ $contactEmail ?? 'info@takaful4all.org' }}">{{ $contactEmail ?? 'info@takaful4all.org' }}</a>
            </p>
            <p style="margin-top: 6px; color: #bbb; font-size: 11px;">
                You are receiving this email because you registered for an event.
            </p>
        </div>
    </div>
</body>
</html>
