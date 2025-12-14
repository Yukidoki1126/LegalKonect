<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://127.0.0.1:3000',
        'https://legalkonect.site',
        'https://www.legalkonect.site',
        'http://legalkonect.site',
        'http://www.legalkonect.site',
        'https://legalkonect.vercel.app',
        'https://legalkonect-render.vercel.app',
    ],
    'allowed_origins_patterns' => [
        '#^https://.*\.vercel\.app$#',
    ],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
