<?php
/*
|--------------------------------------------------------------------------
| TEMPORARY MIGRATION RUNNER
|--------------------------------------------------------------------------
| Upload this file to your document root (same folder as index.php).
| Access it via browser: https://your-domain.com/run-migrations.php?token=YOUR_SECRET
|
| !! DELETE THIS FILE IMMEDIATELY AFTER USE !!
|--------------------------------------------------------------------------
*/

define('SECRET', 'CHANGE_THIS_SECRET_TOKEN_BEFORE_UPLOADING');

if (!isset($_GET['token']) || $_GET['token'] !== SECRET) {
    http_response_code(403);
    die('Forbidden. Append ?token=YOUR_SECRET to the URL.');
}

$app_path = dirname(dirname(__FILE__)) . '/takaful_app';

require $app_path . '/vendor/autoload.php';

$app = require_once $app_path . '/bootstrap/app.php';

// Override the public path to point to this document root
$app->usePublicPath(__DIR__);

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

$commands = [];

// Run migrations
ob_start();
$exitCode = $kernel->call('migrate', ['--force' => true]);
$commands['migrate'] = ob_get_clean();

// Create storage symlink
ob_start();
$kernel->call('storage:link');
$commands['storage:link'] = ob_get_clean();

// Fix media extensions (rename .png/.jpeg -> .jpg for files stored as JPEG)
ob_start();
$kernel->call('media:fix-extensions');
$commands['media:fix-extensions'] = ob_get_clean();

// Cache config
ob_start();
$kernel->call('config:cache');
$commands['config:cache'] = ob_get_clean();

// Cache routes
ob_start();
$kernel->call('route:cache');
$commands['route:cache'] = ob_get_clean();

// Cache views
ob_start();
$kernel->call('view:cache');
$commands['view:cache'] = ob_get_clean();

echo '<pre style="font-family:monospace;background:#1e1e1e;color:#d4d4d4;padding:20px;">';
echo "<strong>!! DELETE THIS FILE AFTER USE !!</strong>\n\n";
foreach ($commands as $cmd => $output) {
    echo "<strong>&gt;&gt;&gt; php artisan {$cmd}</strong>\n";
    echo htmlspecialchars($output) . "\n";
}
echo '</pre>';
