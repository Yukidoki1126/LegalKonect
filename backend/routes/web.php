<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'message' => 'LegalKonect API Server',
        'status' => 'online',
        'timestamp' => now(),
        'version' => '1.0.0'
    ]);
});

// Ultra-simple health check for Railway (no dependencies, instant response)
Route::get('/health', fn() => 'ok');
