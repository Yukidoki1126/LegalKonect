<?php

/**
 * Router script for PHP's built-in server
 * This ensures all requests are properly routed through Laravel
 */

$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));

// Check if the request is for a static file that exists
if ($uri !== '/' && file_exists(__DIR__.'/public'.$uri)) {
    return false; // Serve the static file directly
}

// Otherwise, route through Laravel's index.php
require_once __DIR__.'/public/index.php';
