<?php

namespace App\Services;

use App\Models\User;
use Google_Client;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class GoogleAuthService
{
    private Google_Client $client;

    public function __construct()
    {
        $this->client = new Google_Client();

        $clientId = config('google.client_id');
        $clientSecret = config('google.client_secret');
        $redirectUri = config('google.auth_redirect_uri');

        // Only configure if credentials are present
        if ($clientId && $clientSecret && $redirectUri) {
            $this->client->setClientId($clientId);
            $this->client->setClientSecret($clientSecret);
            $this->client->setRedirectUri($redirectUri);
            $this->client->setScopes([
                'email',
                'profile',
            ]);
            $this->client->setAccessType('online');
        }
    }

    /**
     * Get the OAuth authorization URL for user login
     */
    public function getAuthUrl(): string
    {
        return $this->client->createAuthUrl();
    }

    /**
     * Exchange authorization code for user data and create/login user
     */
    public function handleCallback(string $code): ?User
    {
        try {
            // Exchange code for access token
            $token = $this->client->fetchAccessTokenWithAuthCode($code);

            if (isset($token['error'])) {
                Log::error('Google OAuth token error', ['error' => $token['error']]);
                return null;
            }

            $this->client->setAccessToken($token);

            // Get user info from Google
            $oauth = new \Google_Service_Oauth2($this->client);
            $googleUser = $oauth->userinfo->get();

            // Find or create user
            $user = $this->findOrCreateUser($googleUser);

            return $user;

        } catch (\Exception $e) {
            Log::error('Google OAuth callback failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return null;
        }
    }

    /**
     * Find existing user by Google ID or email, or create new user
     */
    private function findOrCreateUser($googleUser): User
    {
        // Try to find user by Google ID first
        $user = User::where('google_id', $googleUser->id)->first();

        if ($user) {
            // Update avatar if changed
            if ($googleUser->picture && $user->avatar !== $googleUser->picture) {
                $user->update(['avatar' => $googleUser->picture]);
            }
            return $user;
        }

        // Try to find by email (existing user connecting Google)
        $user = User::where('email', $googleUser->email)->first();

        if ($user) {
            // Link Google account to existing user
            $user->update([
                'google_id' => $googleUser->id,
                'avatar' => $googleUser->picture,
                'auth_provider' => 'google',
            ]);
            return $user;
        }

        // Create new user
        $user = User::create([
            'name' => $googleUser->name,
            'email' => $googleUser->email,
            'google_id' => $googleUser->id,
            'avatar' => $googleUser->picture,
            'auth_provider' => 'google',
            'password' => Hash::make(Str::random(32)), // Random password for Google users
            'email_verified_at' => now(), // Google emails are already verified
        ]);

        Log::info('New user created via Google OAuth', [
            'user_id' => $user->id,
            'email' => $user->email
        ]);

        return $user;
    }

    /**
     * Verify Google ID token (for direct API calls from frontend)
     */
    public function verifyIdToken(string $idToken): ?array
    {
        try {
            $payload = $this->client->verifyIdToken($idToken);

            if (!$payload) {
                return null;
            }

            return [
                'id' => $payload['sub'],
                'email' => $payload['email'],
                'name' => $payload['name'],
                'picture' => $payload['picture'] ?? null,
                'email_verified' => $payload['email_verified'] ?? false,
            ];

        } catch (\Exception $e) {
            Log::error('Failed to verify Google ID token', ['error' => $e->getMessage()]);
            return null;
        }
    }
}
