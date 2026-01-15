<?php

namespace App\Http\Controllers;

use App\Models\Lawyer;
use App\Services\LawyerVerificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Mail\LawyerVerificationApproved;
use App\Mail\LawyerVerificationRejected;

class AdminVerificationController extends Controller
{
    protected $verificationService;

    public function __construct(LawyerVerificationService $verificationService)
    {
        $this->verificationService = $verificationService;
    }

    /**
     * Get all lawyers pending verification
     */
    public function getPendingVerifications()
    {
        try {
            $lawyers = $this->verificationService->getPendingVerifications();

            return response()->json([
                'lawyers' => $lawyers,
                'total' => $lawyers->count()
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get pending verifications', [
                'error' => $e->getMessage()
            ]);
            return response()->json([
                'message' => 'Failed to fetch pending verifications'
            ], 500);
        }
    }

    /**
     * Get all lawyers with optional status filter
     */
    public function getAllLawyers(Request $request)
    {
        try {
            $status = $request->query('status');
            $lawyers = $this->verificationService->getAllLawyers($status);

            return response()->json([
                'lawyers' => $lawyers,
                'total' => $lawyers->count()
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get all lawyers', [
                'error' => $e->getMessage()
            ]);
            return response()->json([
                'message' => 'Failed to fetch lawyers'
            ], 500);
        }
    }

    /**
     * Get single lawyer details with verification documents
     */
    public function getLawyerDetails($id)
    {
        try {
            $lawyer = Lawyer::with(['user', 'specializations', 'verifiedBy'])
                ->findOrFail($id);

            // Note: Encrypted documents cannot be previewed directly
            // They must be downloaded and decrypted on the fly
            $documentUrls = [];
            if ($lawyer->verification_documents) {
                foreach ($lawyer->verification_documents as $key => $path) {
                    // Generate download URL for each document
                    $documentUrls[$key] = url("/api/admin/verifications/lawyers/{$id}/documents/{$key}");
                }
            }

            return response()->json([
                'lawyer' => $lawyer,
                'document_urls' => $documentUrls
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get lawyer details', [
                'lawyer_id' => $id,
                'error' => $e->getMessage()
            ]);
            return response()->json([
                'message' => 'Lawyer not found'
            ], 404);
        }
    }

    /**
     * Approve lawyer verification
     */
    public function approveLawyer(Request $request, $id)
    {
        try {
            $lawyer = Lawyer::findOrFail($id);
            $admin = Auth::user();

            if (!$admin) {
                return response()->json([
                    'message' => 'Unauthorized. Admin access required.'
                ], 403);
            }

            $validated = $request->validate([
                'notes' => 'nullable|string|max:1000'
            ]);

            // Get the admin's user ID from the users table (for foreign key constraint)
            $adminUser = \App\Models\User::where('email', $admin->email)->first();
            $verifiedById = $adminUser ? $adminUser->id : $admin->id;

            $success = $this->verificationService->updateVerificationStatus(
                $lawyer,
                $verifiedById,
                'verified',
                $validated['notes'] ?? null
            );

            if ($success) {
                // Also update the lawyer's status to 'approved'
                $lawyer->update(['status' => 'approved']);

                // Send email notification to lawyer
                try {
                    Mail::to($lawyer->user->email)->send(
                        new LawyerVerificationApproved($lawyer, $validated['notes'] ?? null)
                    );
                    Log::info('Verification approved email sent', [
                        'lawyer_id' => $lawyer->id,
                        'email' => $lawyer->user->email
                    ]);
                } catch (\Exception $e) {
                    Log::error('Failed to send verification approved email', [
                        'lawyer_id' => $lawyer->id,
                        'error' => $e->getMessage()
                    ]);
                }

                return response()->json([
                    'message' => 'Lawyer verified and approved successfully',
                    'lawyer' => $lawyer->fresh(['verifiedBy'])
                ]);
            }

            return response()->json([
                'message' => 'Failed to update verification status'
            ], 500);
        } catch (\Exception $e) {
            Log::error('Failed to approve lawyer', [
                'lawyer_id' => $id,
                'error' => $e->getMessage()
            ]);
            return response()->json([
                'message' => 'Failed to approve lawyer'
            ], 500);
        }
    }

    /**
     * Reject lawyer verification
     */
    public function rejectLawyer(Request $request, $id)
    {
        try {
            $lawyer = Lawyer::findOrFail($id);
            $admin = Auth::user();

            if (!$admin) {
                return response()->json([
                    'message' => 'Unauthorized. Admin access required.'
                ], 403);
            }

            $validated = $request->validate([
                'notes' => 'required|string|min:10|max:1000'
            ]);

            // Get the admin's user ID from the users table (for foreign key constraint)
            $adminUser = \App\Models\User::where('email', $admin->email)->first();
            $verifiedById = $adminUser ? $adminUser->id : $admin->id;

            $success = $this->verificationService->updateVerificationStatus(
                $lawyer,
                $verifiedById,
                'rejected',
                $validated['notes']
            );

            if ($success) {
                // Keep the lawyer status as 'pending' - verification_status is what tracks rejection
                // The 'status' enum doesn't have 'rejected' as a valid value
                
                // Send email notification to lawyer with rejection reason
                try {
                    Mail::to($lawyer->user->email)->send(
                        new LawyerVerificationRejected($lawyer, $validated['notes'])
                    );
                    Log::info('Verification rejected email sent', [
                        'lawyer_id' => $lawyer->id,
                        'email' => $lawyer->user->email
                    ]);
                } catch (\Exception $e) {
                    Log::error('Failed to send verification rejected email', [
                        'lawyer_id' => $lawyer->id,
                        'error' => $e->getMessage()
                    ]);
                }

                return response()->json([
                    'message' => 'Lawyer verification rejected',
                    'lawyer' => $lawyer->fresh(['verifiedBy'])
                ]);
            }

            return response()->json([
                'message' => 'Failed to update verification status'
            ], 500);
        } catch (\Exception $e) {
            Log::error('Failed to reject lawyer', [
                'lawyer_id' => $id,
                'error' => $e->getMessage()
            ]);
            return response()->json([
                'message' => 'Failed to reject lawyer'
            ], 500);
        }
    }

    /**
     * View verification document (inline display for admins)
     */
    public function downloadDocument($id, $documentType)
    {
        try {
            $lawyer = Lawyer::findOrFail($id);
            $admin = Auth::user();

            if (!$admin) {
                return response()->json([
                    'message' => 'Unauthorized. Admin access required.'
                ], 403);
            }

            if (!$lawyer->verification_documents || !isset($lawyer->verification_documents[$documentType])) {
                return response()->json([
                    'message' => 'Document not found'
                ], 404);
            }

            $encryptedPath = $lawyer->verification_documents[$documentType];

            // Decrypt the document (this also logs the access)
            $decryptedContent = $this->verificationService->getDecryptedDocument(
                $encryptedPath,
                $admin->id
            );

            // Determine MIME type based on file extension
            // Extract original extension from filename like: uniqid_time.jpg.encrypted
            $mimeType = 'application/octet-stream';
            $filename = basename($encryptedPath);

            // Remove .encrypted extension and get the actual file extension
            $filenameWithoutEncrypted = str_replace('.encrypted', '', $filename);
            $extension = pathinfo($filenameWithoutEncrypted, PATHINFO_EXTENSION);

            // If no extension found (old format), try to detect from file content
            if (empty($extension) || $extension === $filenameWithoutEncrypted) {
                // Use finfo to detect MIME type from content
                $finfo = new \finfo(FILEINFO_MIME_TYPE);
                $detectedMimeType = $finfo->buffer($decryptedContent);
                if ($detectedMimeType) {
                    $mimeType = $detectedMimeType;
                }
            } else {
                // Use extension-based MIME type
                switch (strtolower($extension)) {
                    case 'pdf':
                        $mimeType = 'application/pdf';
                        break;
                    case 'jpg':
                    case 'jpeg':
                        $mimeType = 'image/jpeg';
                        break;
                    case 'png':
                        $mimeType = 'image/png';
                        break;
                    case 'gif':
                        $mimeType = 'image/gif';
                        break;
                    case 'webp':
                        $mimeType = 'image/webp';
                        break;
                }
            }

            // Return the decrypted file for INLINE viewing (not download)
            // Using 'inline' instead of 'attachment' allows viewing in browser
            return response($decryptedContent)
                ->header('Content-Type', $mimeType)
                ->header('Content-Disposition', 'inline; filename="' . $documentType . '.' . $extension . '"')
                ->header('Cache-Control', 'no-cache, no-store, must-revalidate')
                ->header('Pragma', 'no-cache')
                ->header('Expires', '0');

        } catch (\Exception $e) {
            Log::error('Failed to view document', [
                'lawyer_id' => $id,
                'document_type' => $documentType,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Failed to load document',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
