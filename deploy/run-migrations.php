<?php
/*
|--------------------------------------------------------------------------
| TEMPORARY MIGRATION RUNNER
|--------------------------------------------------------------------------
| Upload this file to your document root (same folder as index.php).
| Access it via browser: https://your-domain.com/run-migrations.php
|
| !! DELETE THIS FILE IMMEDIATELY AFTER USE !!
| It exposes artisan commands to anyone who knows the URL.
|
*/

// Secret token - change this before uploading!
define('SECRET', 'CHANGE_THIS_SECRET_TOKEN_BEFORE_UPLOADING');

if (!isset($_GET['token']) || $_GET['token'] !== SECRET) {
    http_response_code(403);
    die('Forbidden. Append ?token=YOUR_SECRET to the URL.');
}

$app_path = dirname(dirname(__FILE__)) . '/takaful_app';

require $app_path . '/vendor/autoload.php';

$app = require_once $app_path . '/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

$commands = [];

// Run migrations
ob_start();
$exitCode = $kernel->call('migrate', ['--force' => true]);
$commands['migrate'] = ob_get_clean();

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

// Optimize
ob_start();
$kernel->call('optimize');
$commands['optimize'] = ob_get_clean();

// Storage link
ob_start();
$kernel->call('storage:link');
$commands['storage:link'] = ob_get_clean();

echo '<pre style="font-family:monospace;background:#1e1e1e;color:#d4d4d4;padding:20px;">';
echo "<strong>!! DELETE THIS FILE AFTER USE !!</strong>\n\n";
foreach ($commands as $cmd => $output) {
    echo "<strong>>>> php artisan {$cmd}</strong>\n";
    echo htmlspecialchars($output) . "\n";
}
echo '</pre>';
