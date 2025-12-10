<?php

namespace App\Services;

use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class EncryptionService
{
    /**
     * Encrypt and store a file
     *
     * @param \Illuminate\Http\UploadedFile $file
     * @param string $path Directory path to store the encrypted file
     * @return string The stored file path
     */
    public function encryptAndStoreFile($file, $path)
    {
        try {
            // Read file content
            $content = file_get_contents($file->getRealPath());

            // Encrypt the content
            $encryptedContent = Crypt::encrypt($content);

            // Get original file extension
            $originalExtension = strtolower($file->getClientOriginalExtension());

            // Generate a unique filename preserving original extension before .encrypted
            $filename = uniqid() . '_' . time() . '.' . $originalExtension . '.encrypted';
            $fullPath = $path . '/' . $filename;

            // Store the encrypted file (use local storage for now, R2 later)
            // TODO: Configure R2 credentials in Railway and switch to R2
            $disk = 'private'; // Temporarily use local storage until R2 is configured
            Storage::disk($disk)->put($fullPath, $encryptedContent);

            Log::info('File encrypted and stored successfully', [
                'original_name' => $file->getClientOriginalName(),
                'original_extension' => $originalExtension,
                'stored_path' => $fullPath,
                'size' => $file->getSize()
            ]);

            return $fullPath;
        } catch (\Exception $e) {
            Log::error('Failed to encrypt and store file', [
                'error' => $e->getMessage(),
                'file' => $file->getClientOriginalName()
            ]);
            throw $e;
        }
    }

    /**
     * Decrypt and retrieve a file
     *
     * @param string $path Path to the encrypted file
     * @return string Decrypted file content
     */
    public function decryptFile($path)
    {
        try {
            // Get encrypted content from storage (use local storage for now, R2 later)
            // TODO: Configure R2 credentials in Railway and switch to R2
            $disk = 'private'; // Temporarily use local storage until R2 is configured
            $encryptedContent = Storage::disk($disk)->get($path);

            // Decrypt the content
            $decryptedContent = Crypt::decrypt($encryptedContent);

            Log::info('File decrypted successfully', [
                'path' => $path
            ]);

            return $decryptedContent;
        } catch (\Exception $e) {
            Log::error('Failed to decrypt file', [
                'error' => $e->getMessage(),
                'path' => $path
            ]);
            throw $e;
        }
    }

    /**
     * Delete an encrypted file
     *
     * @param string $path Path to the encrypted file
     * @return bool
     */
    public function deleteEncryptedFile($path)
    {
        try {
            // TODO: Configure R2 credentials in Railway and switch to R2
            $disk = 'private'; // Temporarily use local storage until R2 is configured
            if (Storage::disk($disk)->exists($path)) {
                Storage::disk($disk)->delete($path);

                Log::info('Encrypted file deleted', [
                    'path' => $path
                ]);

                return true;
            }
            return false;
        } catch (\Exception $e) {
            Log::error('Failed to delete encrypted file', [
                'error' => $e->getMessage(),
                'path' => $path
            ]);
            return false;
        }
    }

    /**
     * Encrypt a string value
     *
     * @param string $value
     * @return string Encrypted value
     */
    public function encryptString($value)
    {
        return Crypt::encryptString($value);
    }

    /**
     * Decrypt a string value
     *
     * @param string $encrypted
     * @return string Decrypted value
     */
    public function decryptString($encrypted)
    {
        return Crypt::decryptString($encrypted);
    }
}
