<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\UploadedFile;

class R2StorageService
{
    /**
     * Upload file to R2 with retry logic
     */
    public function uploadFile(UploadedFile $file, string $path, string $disk = null, int $maxRetries = 3): ?string
    {
        $disk = $disk ?? env('FILESYSTEM_DISK', 'public');
        $lastException = null;

        for ($attempt = 1; $attempt <= $maxRetries; $attempt++) {
            try {
                Log::info("R2 upload attempt {$attempt}/{$maxRetries}", [
                    'path' => $path,
                    'disk' => $disk,
                    'size' => $file->getSize(),
                ]);

                $storedPath = $file->storeAs(
                    dirname($path),
                    basename($path),
                    ['disk' => $disk, 'visibility' => 'public']
                );

                if ($storedPath) {
                    Log::info('R2 upload successful', ['path' => $storedPath]);
                    return $storedPath;
                }

                throw new \Exception('Storage returned null path');

            } catch (\Exception $e) {
                $lastException = $e;
                Log::warning("R2 upload attempt {$attempt} failed", [
                    'error' => $e->getMessage(),
                    'path' => $path,
                ]);

                // If not the last attempt, wait before retrying
                if ($attempt < $maxRetries) {
                    $delay = pow(2, $attempt - 1) * 1000000; // Exponential backoff in microseconds
                    usleep($delay); // 1s, 2s, 4s
                }
            }
        }

        Log::error('R2 upload failed after all retries', [
            'path' => $path,
            'error' => $lastException ? $lastException->getMessage() : 'Unknown error',
        ]);

        return null;
    }

    /**
     * Upload file content to R2 with retry logic
     */
    public function uploadContent(string $content, string $path, string $disk = null, int $maxRetries = 3): ?string
    {
        $disk = $disk ?? env('FILESYSTEM_DISK', 'public');
        $lastException = null;

        for ($attempt = 1; $attempt <= $maxRetries; $attempt++) {
            try {
                Log::info("R2 content upload attempt {$attempt}/{$maxRetries}", [
                    'path' => $path,
                    'disk' => $disk,
                    'size' => strlen($content),
                ]);

                $success = Storage::disk($disk)->put($path, $content, 'public');

                if ($success) {
                    Log::info('R2 content upload successful', ['path' => $path]);
                    return $path;
                }

                throw new \Exception('Storage put returned false');

            } catch (\Exception $e) {
                $lastException = $e;
                Log::warning("R2 content upload attempt {$attempt} failed", [
                    'error' => $e->getMessage(),
                    'path' => $path,
                ]);

                if ($attempt < $maxRetries) {
                    $delay = pow(2, $attempt - 1) * 1000000;
                    usleep($delay);
                }
            }
        }

        Log::error('R2 content upload failed after all retries', [
            'path' => $path,
            'error' => $lastException ? $lastException->getMessage() : 'Unknown error',
        ]);

        return null;
    }

    /**
     * Delete file from R2 with retry logic
     */
    public function deleteFile(string $path, string $disk = null, int $maxRetries = 3): bool
    {
        if (empty($path)) {
            return false;
        }

        $disk = $disk ?? env('FILESYSTEM_DISK', 'public');
        $lastException = null;

        for ($attempt = 1; $attempt <= $maxRetries; $attempt++) {
            try {
                if (!Storage::disk($disk)->exists($path)) {
                    Log::info('R2 file does not exist, skipping delete', ['path' => $path]);
                    return true; // File doesn't exist, consider it deleted
                }

                $success = Storage::disk($disk)->delete($path);

                if ($success) {
                    Log::info('R2 file deleted successfully', ['path' => $path]);
                    return true;
                }

                throw new \Exception('Storage delete returned false');

            } catch (\Exception $e) {
                $lastException = $e;
                Log::warning("R2 delete attempt {$attempt} failed", [
                    'error' => $e->getMessage(),
                    'path' => $path,
                ]);

                if ($attempt < $maxRetries) {
                    $delay = pow(2, $attempt - 1) * 1000000;
                    usleep($delay);
                }
            }
        }

        Log::error('R2 delete failed after all retries', [
            'path' => $path,
            'error' => $lastException ? $lastException->getMessage() : 'Unknown error',
        ]);

        return false;
    }

    /**
     * Get file URL with fallback
     */
    public function getUrl(string $path, string $disk = null): ?string
    {
        if (empty($path)) {
            return null;
        }

        try {
            $disk = $disk ?? env('FILESYSTEM_DISK', 'public');

            // If it's already a full URL, return as is
            if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
                return $path;
            }

            return Storage::disk($disk)->url($path);

        } catch (\Exception $e) {
            Log::warning('Failed to get R2 URL', [
                'path' => $path,
                'error' => $e->getMessage(),
            ]);

            // Fallback: construct URL manually
            $publicUrl = env('R2_PUBLIC_URL') ?? env('APP_URL');
            $cleanPath = ltrim($path, '/');
            return "{$publicUrl}/storage/{$cleanPath}";
        }
    }

    /**
     * Check if file exists in R2
     */
    public function exists(string $path, string $disk = null): bool
    {
        if (empty($path)) {
            return false;
        }

        try {
            $disk = $disk ?? env('FILESYSTEM_DISK', 'public');
            return Storage::disk($disk)->exists($path);
        } catch (\Exception $e) {
            Log::warning('Failed to check R2 file existence', [
                'path' => $path,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Get file size
     */
    public function getSize(string $path, string $disk = null): ?int
    {
        try {
            $disk = $disk ?? env('FILESYSTEM_DISK', 'public');
            return Storage::disk($disk)->size($path);
        } catch (\Exception $e) {
            Log::warning('Failed to get R2 file size', [
                'path' => $path,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Copy file within R2
     */
    public function copy(string $from, string $to, string $disk = null): bool
    {
        try {
            $disk = $disk ?? env('FILESYSTEM_DISK', 'public');
            return Storage::disk($disk)->copy($from, $to);
        } catch (\Exception $e) {
            Log::error('Failed to copy R2 file', [
                'from' => $from,
                'to' => $to,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Move file within R2
     */
    public function move(string $from, string $to, string $disk = null): bool
    {
        try {
            $disk = $disk ?? env('FILESYSTEM_DISK', 'public');
            return Storage::disk($disk)->move($from, $to);
        } catch (\Exception $e) {
            Log::error('Failed to move R2 file', [
                'from' => $from,
                'to' => $to,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }
}
