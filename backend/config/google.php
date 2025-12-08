<?php

return [
    'client_id' => env('GOOGLE_CLIENT_ID'),
    'client_secret' => env('GOOGLE_CLIENT_SECRET'),

    // For lawyer Google Calendar integration
    'redirect_uri' => env('GOOGLE_REDIRECT_URI'),

    // For user authentication (login/register)
    'auth_redirect_uri' => env('GOOGLE_AUTH_REDIRECT_URI'),

    'scopes' => [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
    ],
];
