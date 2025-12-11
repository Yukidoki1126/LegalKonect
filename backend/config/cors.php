<?php

return [

    'paths' => ['api/*', 'auth/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'https://legalkonect.vercel.app',
        'http://localhost:5173',
        'http://localhost:3000',
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false, // ⚠ MUST BE FALSE for token auth

];
