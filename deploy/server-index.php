<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

/*
|--------------------------------------------------------------------------
| Shared Hosting Index File
|--------------------------------------------------------------------------
|
| EDIT $app_path below to point to where you uploaded the Laravel app
| files on your server (the folder that contains app/, bootstrap/, config/,
| database/, resources/, routes/, storage/, vendor/, etc.)
|
| Example server layout:
|   /home/username/takaful_app/         <-- Laravel files go here
|   /home/username/subdomain.domain.com/ <-- public/ contents go here (document root)
|
| In that case, from this file's location the path would be:
|   dirname(dirname(__FILE__)) . '/takaful_app'
|
*/

$app_path = dirname(dirname(__FILE__)) . '/takaful_app';

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = $app_path . '/storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
require $app_path . '/vendor/autoload.php';

// Bootstrap Laravel and handle the request...
/** @var Application $app */
$app = require_once $app_path . '/bootstrap/app.php';

$app->handleRequest(Request::capture());
