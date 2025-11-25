<?php

namespace App\Services;

use App\Models\Lawyer;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\UploadedFile;

class LawyerVerificationService
{
    protected $encryptionService;

    public function __construct(EncryptionService $encryptionService)
    {
        $this->encryptionService = $encryptionService;
    }

    /**
     * Upload lawyer verification documents (ENCRYPTED)
     *
     * @param array $files Array of uploaded files
     * @param int $lawyerId
     * @return array Array of encrypted file paths
     */
    public function uploadVerificationDocuments(array $files, int $lawyerId): array
    {
        $uploadedPaths = [];

        try {
            // Create encrypted directory for this lawyer
            $lawyerDir = "encrypted_documents/lawyer_{$lawyerId}";

            foreach ($files as $key => $file) {
                if ($file instanceof UploadedFile && $file->isValid()) {
                    // Encrypt and store the file
                    $encryptedPath = $this->encryptionService->encryptAndStoreFile($file, $lawyerDir);

                    $uploadedPaths[$key] = $encryptedPath;

                    Log::info("Document encrypted and uploaded successfully", [
                        'lawyer_id' => $lawyerId,
                        'document_type' => $key,
                        'encrypted_path' => $encryptedPath,
                        'original_name' => $file->getClientOriginalName()
                    ]);
                }
            }

            return $uploadedPaths;
        } catch (\Exception $e) {
            Log::error("Failed to upload and encrypt verification documents", [
                'lawyer_id' => $lawyerId,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Delete old encrypted verification documents
     *
     * @param array $documentPaths
     * @return bool
     */
    public function deleteVerificationDocuments(array $documentPaths): bool
    {
        try {
            foreach ($documentPaths as $path) {
                $this->encryptionService->deleteEncryptedFile($path);
            }
            return true;
        } catch (\Exception $e) {
            Log::error("Failed to delete encrypted verification documents", [
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Decrypt and get document content for viewing
     *
     * @param string $encryptedPath Path to encrypted document
     * @param int $adminId Admin user ID accessing the document
     * @return string Decrypted document content
     */
    public function getDecryptedDocument(string $encryptedPath, int $adminId): string
    {
        try {
            // Decrypt the document
            $decryptedContent = $this->encryptionService->decryptFile($encryptedPath);

            Log::info("Encrypted document accessed", [
                'path' => $encryptedPath,
                'admin_id' => $adminId,
                'timestamp' => now()->toDateTimeString()
            ]);

            return $decryptedContent;
        } catch (\Exception $e) {
            Log::error("Failed to decrypt document", [
                'path' => $encryptedPath,
                'admin_id' => $adminId,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Verify lawyer credentials
     *
     * @param Lawyer $lawyer
     * @param int $adminId
     * @param string $status 'verified' or 'rejected'
     * @param string|null $notes
     * @return bool
     */
    public function updateVerificationStatus(
        Lawyer $lawyer,
        int $adminId,
        string $status,
        ?string $notes = null
    ): bool {
        try {
            $lawyer->update([
                'verification_status' => $status,
                'verified_by' => $adminId,
                'verified_at' => now(),
                'verification_notes' => $notes,
            ]);

            Log::info("Lawyer verification status updated", [
                'lawyer_id' => $lawyer->id,
                'status' => $status,
                'admin_id' => $adminId
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error("Failed to update verification status", [
                'lawyer_id' => $lawyer->id,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Get pending verification lawyers for admin dashboard
     *
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getPendingVerifications()
    {
        return Lawyer::with(['user', 'specializations'])
            ->whereHas('user', function($query) {
                $query->whereNotIn('role', ['admin', 'super_admin']);
            })
            ->pendingVerification()
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Get all lawyers with verification status
     *
     * @param string|null $status Filter by status
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getAllLawyers(?string $status = null)
    {
        $query = Lawyer::with(['user', 'specializations', 'verifiedBy'])
            ->whereHas('user', function($query) {
                $query->whereNotIn('role', ['admin', 'super_admin']);
            });

        if ($status) {
            $query->where('verification_status', $status);
        }

        return $query->orderBy('created_at', 'desc')->get();
    }
}
