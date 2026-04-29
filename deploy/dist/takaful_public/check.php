<?php
/*
|--------------------------------------------------------------------------
| DIAGNOSTIC TOOL - DELETE AFTER USE
|--------------------------------------------------------------------------
| Upload this to your document root, then visit:
|   https://your-domain.com/check.php?token=YOUR_SECRET
|
| !! DELETE THIS FILE IMMEDIATELY AFTER DIAGNOSING !!
|--------------------------------------------------------------------------
*/

define('SECRET', 'CHANGE_THIS_SECRET_TOKEN_BEFORE_UPLOADING');

if (!isset($_GET['token']) || $_GET['token'] !== SECRET) {
    http_response_code(403);
    die('Forbidden. Append ?token=YOUR_SECRET to the URL.');
}

// Try to detect app path
$detected_app_path = dirname(dirname(__FILE__)) . '/takaful_app';

$checks = [];

// 1. PHP Version
$checks['PHP Version'] = [
    'value' => PHP_VERSION,
    'ok'    => version_compare(PHP_VERSION, '8.2.0', '>='),
    'note'  => 'Requires >= 8.2',
];

// 2. App path exists
$checks['App path exists'] = [
    'value' => $detected_app_path,
    'ok'    => is_dir($detected_app_path),
    'note'  => 'Folder must exist on server',
];

// 3. vendor/autoload.php
$checks['vendor/autoload.php'] = [
    'value' => $detected_app_path . '/vendor/autoload.php',
    'ok'    => file_exists($detected_app_path . '/vendor/autoload.php'),
    'note'  => 'Composer dependencies must be uploaded',
];

// 4. bootstrap/app.php
$checks['bootstrap/app.php'] = [
    'value' => $detected_app_path . '/bootstrap/app.php',
    'ok'    => file_exists($detected_app_path . '/bootstrap/app.php'),
    'note'  => '',
];

// 5. .env file
$checks['.env exists'] = [
    'value' => $detected_app_path . '/.env',
    'ok'    => file_exists($detected_app_path . '/.env'),
    'note'  => 'Must exist with APP_KEY set',
];

// 6. .env readable and has APP_KEY
if (file_exists($detected_app_path . '/.env')) {
    $env_contents = file_get_contents($detected_app_path . '/.env');
    $has_key = preg_match('/^APP_KEY=base64:.+/m', $env_contents);
    $checks['APP_KEY set'] = [
        'value' => $has_key ? 'Yes' : 'MISSING or empty',
        'ok'    => (bool) $has_key,
        'note'  => 'Run: php artisan key:generate',
    ];
    $checks['APP_DEBUG'] = [
        'value' => preg_match('/^APP_DEBUG=true/m', $env_contents) ? 'true (UNSAFE for production)' : 'false',
        'ok'    => true,
        'note'  => 'Set to false in production',
    ];
}

// 7. storage writable
$storage_paths = [
    '/storage/logs',
    '/storage/framework/cache',
    '/storage/framework/sessions',
    '/storage/framework/views',
    '/bootstrap/cache',
];
foreach ($storage_paths as $p) {
    $full = $detected_app_path . $p;
    $checks['Writable: ' . $p] = [
        'value' => is_dir($full) ? (is_writable($full) ? 'writable' : 'NOT writable') : 'directory missing',
        'ok'    => is_dir($full) && is_writable($full),
        'note'  => 'chmod 755',
    ];
}

// 8. Required PHP extensions
$required_ext = ['pdo', 'pdo_mysql', 'mbstring', 'openssl', 'tokenizer', 'xml', 'ctype', 'json', 'bcmath', 'gd', 'fileinfo', 'curl'];
foreach ($required_ext as $ext) {
    $checks['PHP ext: ' . $ext] = [
        'value' => extension_loaded($ext) ? 'loaded' : 'MISSING',
        'ok'    => extension_loaded($ext),
        'note'  => '',
    ];
}

// 9. mod_rewrite / .htaccess
$checks['.htaccess exists'] = [
    'value' => file_exists(__DIR__ . '/.htaccess') ? 'yes' : 'MISSING',
    'ok'    => file_exists(__DIR__ . '/.htaccess'),
    'note'  => 'Must be present in document root',
];

// 10. DB connection test
if (file_exists($detected_app_path . '/.env')) {
    $env_lines = file($detected_app_path . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $env = [];
    foreach ($env_lines as $line) {
        if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
            [$k, $v] = explode('=', $line, 2);
            $env[trim($k)] = trim($v, '"\'');
        }
    }
    $db_host = $env['DB_HOST'] ?? 'localhost';
    $db_name = $env['DB_DATABASE'] ?? '';
    $db_user = $env['DB_USERNAME'] ?? '';
    $db_pass = $env['DB_PASSWORD'] ?? '';
    try {
        $pdo = new PDO("mysql:host={$db_host};dbname={$db_name}", $db_user, $db_pass, [PDO::ATTR_TIMEOUT => 5]);
        $checks['DB connection'] = ['value' => "Connected to {$db_name}", 'ok' => true, 'note' => ''];
        // Check if migrations ran
        try {
            $stmt = $pdo->query("SHOW TABLES LIKE 'migrations'");
            $has_migrations = $stmt->rowCount() > 0;
            $checks['migrations table'] = [
                'value' => $has_migrations ? 'exists' : 'MISSING - run migrations!',
                'ok'    => $has_migrations,
                'note'  => 'Visit /run-migrations.php',
            ];
        } catch (Exception $e) {}
    } catch (PDOException $e) {
        $checks['DB connection'] = ['value' => 'FAILED: ' . $e->getMessage(), 'ok' => false, 'note' => 'Check DB credentials in .env'];
    }
}

// Output
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head><title>Deployment Check</title>
<style>
  body { font-family: monospace; background: #1e1e1e; color: #d4d4d4; padding: 20px; }
  h2 { color: #569cd6; }
  table { border-collapse: collapse; width: 100%; }
  th { background: #333; color: #9cdcfe; text-align: left; padding: 8px 12px; }
  td { padding: 6px 12px; border-bottom: 1px solid #333; }
  .ok { color: #4ec9b0; }
  .fail { color: #f44747; font-weight: bold; }
  .note { color: #888; font-size: 0.9em; }
</style>
</head>
<body>
<h2>Takaful Events - Deployment Diagnostic</h2>
<p style="color:#f44747"><strong>!! DELETE THIS FILE IMMEDIATELY AFTER DIAGNOSING !!</strong></p>
<table>
  <tr><th>Check</th><th>Value</th><th>Status</th><th>Note</th></tr>
  <?php foreach ($checks as $name => $check): ?>
  <tr>
    <td><?= htmlspecialchars($name) ?></td>
    <td><?= htmlspecialchars($check['value']) ?></td>
    <td class="<?= $check['ok'] ? 'ok' : 'fail' ?>"><?= $check['ok'] ? '✓ OK' : '✗ FAIL' ?></td>
    <td class="note"><?= htmlspecialchars($check['note']) ?></td>
  </tr>
  <?php endforeach; ?>
</table>
<p style="color:#888">Detected app path: <code><?= htmlspecialchars($detected_app_path) ?></code></p>
</body>
</html>
