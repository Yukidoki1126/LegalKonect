<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Auth\GoogleAuthController;
use App\Http\Controllers\LawyerController;
use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\ManualPaymentController;
use App\Http\Controllers\LawyerDashboardController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\FaqController;
use App\Http\Controllers\CaseController;
use App\Http\Controllers\LawyerCaseController;
use App\Http\Controllers\LawyerScheduleController;
use App\Http\Controllers\GoogleCalendarController;
use App\Http\Controllers\AdminVerificationController;
use App\Http\Controllers\PasswordResetController;

// Public routes - No authentication required
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    // Google OAuth for login/register
    Route::get('/google/url', [AuthController::class, 'googleAuthUrl']);
    Route::post('/google/login', [AuthController::class, 'googleLogin']);

    // New Google Sign-In endpoint
    Route::post('/google', [GoogleAuthController::class, 'handleGoogleAuth']);

    // Password Reset routes
    Route::post('/forgot-password', [PasswordResetController::class, 'forgotPassword']);
    Route::post('/validate-reset-token', [PasswordResetController::class, 'validateToken']);
    Route::post('/reset-password', [PasswordResetController::class, 'resetPassword']);
});

// Authenticated cleanup route (for orphaned accounts)
Route::middleware('auth:sanctum')->group(function () {
    Route::delete('/auth/cleanup', [AuthController::class, 'cleanupOrphanedAccount']);
});

// Google OAuth callback for login/register (must be outside auth prefix for OAuth flow)
Route::get('/auth/google/callback', [AuthController::class, 'googleCallback']);

// Public Reviews - MOVED OUTSIDE auth prefix
Route::get('/reviews', [ReviewController::class, 'index']);
Route::get('/lawyers/{lawyerId}/reviews', [ReviewController::class, 'lawyerReviews']);

// Public lawyer routes - includes payment info for manual payment flow
Route::prefix('lawyers')->group(function () {
    Route::get('/', [LawyerController::class, 'index']);
    Route::get('/{id}', [LawyerController::class, 'show']);
    Route::get('/{id}/payment-info', [ManualPaymentController::class, 'getLawyerPaymentInfo']); // Get lawyer's payment accounts
    Route::get('/{lawyer}/available-slots', [AppointmentController::class, 'getAvailableSlots']);
    Route::get('/{lawyer}/unavailable-dates', [LawyerController::class, 'getUnavailableDates']);
});

Route::get('/specializations', [LawyerController::class, 'specializations']);

// Public storage proxy route for R2 images with CORS headers
Route::get('/storage/{path}', function ($path) {
    try {
        // Get R2 public URL
        $publicUrl = env('R2_PUBLIC_URL');
        
        if (!$publicUrl) {
            return response()->json(['error' => 'R2 public URL not configured'], 500);
        }
        
        $fileUrl = $publicUrl . '/' . $path;
        
        // Fetch the file from R2
        $client = new \GuzzleHttp\Client(['timeout' => 10]);
        $response = $client->get($fileUrl);
        
        // Get content type from R2 response
        $contentType = $response->getHeader('Content-Type')[0] ?? 'application/octet-stream';
        
        // Return the file with proper CORS headers
        return response($response->getBody(), 200)
            ->header('Content-Type', $contentType)
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, HEAD')
            ->header('Access-Control-Allow-Headers', '*')
            ->header('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    } catch (\Exception $e) {
        \Log::error('Storage proxy error: ' . $e->getMessage(), ['path' => $path]);
        return response()->json(['error' => 'File not found'], 404);
    }
})->where('path', '.*');

// Public FAQ routes
Route::prefix('faqs')->group(function () {
    Route::get('/categories', [FaqController::class, 'categories']);
    Route::get('/category/{slug}', [FaqController::class, 'byCategory']);
    Route::get('/search', [FaqController::class, 'search']);
    Route::get('/{id}', [FaqController::class, 'show']);
});

// Test route
Route::get('/test', function () {
    return response()->json([
        'message' => 'LegalKonect API is working!',
        'timestamp' => now(),
        'version' => '1.0.0'
    ]);
});

// Local-only debug endpoint (public) to quickly inspect request-target DB when running locally.
// (debug route removed)

// Protected routes - Require authentication
Route::middleware('auth:sanctum')->group(function () {
    // Auth routes
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/profile', [AuthController::class, 'profile']);
        Route::post('/location', [AuthController::class, 'updateLocation']);
        Route::put('/profile', [AuthController::class, 'updateProfile']);
        Route::post('/profile-picture', [AuthController::class, 'uploadProfilePicture']);
        Route::delete('/profile-picture', [AuthController::class, 'deleteProfilePicture']);
    });
    Route::post('/lawyer/profile', [LawyerController::class, 'createProfile']);
    // Appointment routes
    Route::post('/appointments', [AppointmentController::class, 'store']);
    Route::get('/appointments', [AppointmentController::class, 'getUserAppointments']);
    Route::get('/appointments/{id}', [AppointmentController::class, 'show']);
    Route::post('/appointments/{id}/cancel', [AppointmentController::class, 'cancel']);
    Route::post('/appointments/{id}/reschedule/accept', [AppointmentController::class, 'acceptReschedule']);
    Route::post('/appointments/{id}/reschedule/decline', [AppointmentController::class, 'declineReschedule']);
    Route::post('/appointments/{id}/client-reschedule', [AppointmentController::class, 'clientRequestReschedule']);

    // Get authenticated user
    Route::get('/user', function (Request $request) {
        $user = $request->user();
        $user->load('lawyer');
        
        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'lawyer' => $user->lawyer ? [
                'id' => $user->lawyer->id,
                'first_name' => $user->lawyer->first_name,
                'last_name' => $user->lawyer->last_name,
                'status' => $user->lawyer->status,
            ] : null
        ]);
    });

    // Manual Payment routes
    Route::post('/appointments/{appointment}/upload-payment-proof', [ManualPaymentController::class, 'uploadPaymentProof']);
    Route::get('/appointments/{appointment}/payment-proof', [ManualPaymentController::class, 'getPaymentProof']);

    // Protected Review routes - Authenticated users only
    Route::post('/reviews', [ReviewController::class, 'store']);
    Route::get('/my-reviews', [ReviewController::class, 'myReviews']);
    Route::put('/reviews/{id}', [ReviewController::class, 'update']);
    Route::delete('/reviews/{id}', [ReviewController::class, 'destroy']);

    // Case routes - Authenticated users only
    Route::prefix('cases')->group(function () {
        Route::get('/', [CaseController::class, 'index']);
        Route::post('/', [CaseController::class, 'store']);
        Route::get('/{id}', [CaseController::class, 'show']);
        Route::put('/{id}', [CaseController::class, 'update']);
        Route::delete('/{id}', [CaseController::class, 'destroy']);

        // Case Todos - Both clients and lawyers can access
        Route::get('/{caseId}/todos', [App\Http\Controllers\CaseTodoController::class, 'index']);
        Route::put('/{caseId}/todos/{todoId}', [App\Http\Controllers\CaseTodoController::class, 'update']);
    });

    // Lawyer Schedule routes - Authenticated lawyers only
    Route::prefix('lawyer/schedules')->group(function () {
        Route::get('/', [LawyerScheduleController::class, 'index']);
        Route::post('/', [LawyerScheduleController::class, 'store']);
        Route::put('/{id}', [LawyerScheduleController::class, 'update']);
        Route::delete('/{id}', [LawyerScheduleController::class, 'destroy']);
        Route::post('/{id}/toggle', [LawyerScheduleController::class, 'toggleActive']);
    });

    // Notification routes - All authenticated users
    Route::prefix('notifications')->group(function () {
        Route::get('/', [App\Http\Controllers\NotificationController::class, 'index']);
        Route::get('/count', [App\Http\Controllers\NotificationController::class, 'getCount']);
        Route::post('/{id}/read', [App\Http\Controllers\NotificationController::class, 'markAsRead']);
        Route::post('/read-all', [App\Http\Controllers\NotificationController::class, 'markAllAsRead']);
    });
});

// Dummy login route
Route::get('/login', function() {
    return response()->json(['message' => 'Unauthenticated.'], 401);
})->name('login');

// Lawyer Dashboard Routes (Protected by auth:sanctum + lawyer middleware)
Route::middleware(['auth:sanctum', 'lawyer'])->prefix('lawyer')->group(function () {
    Route::get('/dashboard', [LawyerDashboardController::class, 'index']);
    Route::get('/appointments', [LawyerDashboardController::class, 'appointments']);
    Route::post('/appointments/{id}/accept', [LawyerDashboardController::class, 'acceptAppointment']);
    Route::post('/appointments/{id}/decline', [LawyerDashboardController::class, 'declineAppointment']);
    Route::post('/appointments/{id}/complete', [LawyerDashboardController::class, 'completeAppointment']);
    Route::post('/appointments/{id}/notes', [LawyerDashboardController::class, 'addNotes']);
    Route::post('/appointments/{id}/confirm-specialization', [LawyerDashboardController::class, 'confirmSpecialization']);
    Route::post('/appointments/{id}/reschedule', [AppointmentController::class, 'requestReschedule']);
    Route::post('/appointments/{id}/respond-to-client-reschedule', [AppointmentController::class, 'lawyerRespondToReschedule']);
    Route::post('/appointments/bulk-reschedule', [AppointmentController::class, 'bulkReschedule']);
    
    // Manual Payment confirmation routes (for lawyers)
    Route::post('/appointments/{id}/confirm-payment', [ManualPaymentController::class, 'confirmPayment']);
    Route::post('/appointments/{id}/reject-payment', [ManualPaymentController::class, 'rejectPayment']);
    Route::get('/appointments/{id}/payment-proof', [ManualPaymentController::class, 'getPaymentProof']);
    
    // Refund processing route (for lawyers)
    Route::post('/appointments/{id}/process-refund', [ManualPaymentController::class, 'processRefund']);
    
    // Transaction history (replacing old earnings/payout system)
    Route::get('/transactions', [LawyerDashboardController::class, 'getTransactionHistory']);
    
    // Old payout routes - DISABLED (lawyers now receive payment directly)
    // Route::get('/earnings', [App\\Http\\Controllers\\PayoutController::class, 'getEarnings']);
    // Route::put('/payout-info', [App\\Http\\Controllers\\PayoutController::class, 'updatePayoutInfo']);
    // Route::post('/payouts/request', [App\\Http\\Controllers\\PayoutController::class, 'requestPayout']);
    // Route::get('/payouts', [App\\Http\\Controllers\\PayoutController::class, 'getPayouts']);
    
    Route::post('/toggle-availability', [LawyerDashboardController::class, 'toggleAvailability']);
    Route::get('/profile', [LawyerDashboardController::class, 'getProfile']);
    Route::put('/profile', [LawyerDashboardController::class, 'updateProfile']);
    Route::post('/profile-photo', [LawyerDashboardController::class, 'uploadProfilePhoto']);
    Route::delete('/profile-photo', [LawyerDashboardController::class, 'deleteProfilePhoto']);
    
    // Payment info update (GCash/Bank details)
    Route::put('/payment-info', [LawyerDashboardController::class, 'updatePaymentInfo']);
    Route::post('/gcash-qr', [LawyerDashboardController::class, 'uploadGcashQr']);
    Route::delete('/gcash-qr', [LawyerDashboardController::class, 'deleteGcashQr']);

    // Calendar & Availability Routes
    Route::get('/calendar/availability', [LawyerDashboardController::class, 'getCalendarAvailability']);
    Route::post('/calendar/availability', [LawyerDashboardController::class, 'setDateAvailability']);
    Route::get('/calendar/appointments', [LawyerDashboardController::class, 'getCalendarAppointments']);

    // Case Management Routes
    Route::get('/cases', [LawyerCaseController::class, 'index']);
    Route::get('/cases/completed-appointments', [LawyerCaseController::class, 'getCompletedAppointments']);
    Route::post('/cases', [LawyerCaseController::class, 'store']);
    Route::get('/cases/{id}', [LawyerCaseController::class, 'show']);
    Route::put('/cases/{id}', [LawyerCaseController::class, 'update']);
    Route::delete('/cases/{id}', [LawyerCaseController::class, 'destroy']);

    // Case Todos - Lawyer can create, read, toggle, and delete
    Route::get('/cases/{caseId}/todos', [App\Http\Controllers\CaseTodoController::class, 'index']);
    Route::post('/cases/{caseId}/todos', [App\Http\Controllers\CaseTodoController::class, 'store']);
    Route::post('/cases/{caseId}/todos/{todoId}/toggle', [App\Http\Controllers\CaseTodoController::class, 'toggle']);
    Route::delete('/cases/{caseId}/todos/{todoId}', [App\Http\Controllers\CaseTodoController::class, 'destroy']);

    // Google Calendar Integration
    Route::prefix('google')->group(function () {
        Route::get('/auth-url', [GoogleCalendarController::class, 'getAuthUrl']);
        Route::get('/status', [GoogleCalendarController::class, 'getStatus']);
        Route::post('/disconnect', [GoogleCalendarController::class, 'disconnect']);
        Route::post('/sync-schedules', [GoogleCalendarController::class, 'syncSchedules']);
        Route::post('/sync-appointments', [GoogleCalendarController::class, 'syncAppointments']);
        Route::get('/events', [GoogleCalendarController::class, 'getEvents']);
    });

    // Old Earnings and Payout Routes - DISABLED (lawyers receive payments directly now)
    // Route::get('/earnings', [App\Http\Controllers\PayoutController::class, 'getEarnings']);
    // Route::put('/payout-info', [App\Http\Controllers\PayoutController::class, 'updatePayoutInfo']);
    // Route::post('/payouts/request', [App\Http\Controllers\PayoutController::class, 'requestPayout']);
    // Route::get('/payouts', [App\Http\Controllers\PayoutController::class, 'getPayouts']);
});

// Google Calendar OAuth callback (must be outside auth middleware for OAuth flow)
Route::get('/google/callback', [GoogleCalendarController::class, 'handleCallback']);

// Admin Authentication (Public)
Route::prefix('admin')->group(function () {
    Route::post('/login', [App\Http\Controllers\Admin\AdminAuthController::class, 'login']);
});

// Admin Protected Routes
Route::prefix('admin')->middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::get('/me', [App\Http\Controllers\Admin\AdminAuthController::class, 'me']);
    Route::post('/logout', [App\Http\Controllers\Admin\AdminAuthController::class, 'logout']);
    
    // Dashboard
    Route::get('/dashboard/stats', [App\Http\Controllers\Admin\AdminDashboardController::class, 'stats']);
    Route::get('/lawyers', [App\Http\Controllers\Admin\AdminDashboardController::class, 'lawyers']);
    Route::get('/appointments', [App\Http\Controllers\Admin\AdminDashboardController::class, 'appointments']);
    Route::get('/users', [App\Http\Controllers\Admin\AdminDashboardController::class, 'users']);
    Route::get('/payments', [App\Http\Controllers\Admin\AdminDashboardController::class, 'payments']);
    Route::get('/analytics', [App\Http\Controllers\Admin\AdminDashboardController::class, 'analytics']);
        Route::get('/descriptive-analytics', [App\Http\Controllers\Admin\AdminDashboardController::class, 'descriptiveAnalytics']); 
    Route::get('/debug-appointments', [App\Http\Controllers\Admin\AdminDashboardController::class, 'debugAppointments']);

            // (debug route removed)
    
    // Lawyer Management
    Route::patch('/lawyers/{id}/availability', [App\Http\Controllers\Admin\AdminDashboardController::class, 'toggleAvailability']);
    Route::patch('/lawyers/{id}/status', [App\Http\Controllers\Admin\AdminDashboardController::class, 'updateStatus']);
    Route::delete('/lawyers/{id}', [App\Http\Controllers\Admin\AdminDashboardController::class, 'deleteLawyer']);
    
    // User Management
    Route::patch('/users/{id}/suspend', [App\Http\Controllers\Admin\AdminDashboardController::class, 'suspendUser']);
    Route::patch('/users/{id}/activate', [App\Http\Controllers\Admin\AdminDashboardController::class, 'activateUser']);
    Route::delete('/users/{id}', [App\Http\Controllers\Admin\AdminDashboardController::class, 'deleteUser']);

    // Admin Management (Super Admin Only)
    Route::middleware('superadmin')->group(function () {
        Route::get('/admins', [App\Http\Controllers\Admin\AdminManagementController::class, 'index']);
        Route::get('/admins/stats', [App\Http\Controllers\Admin\AdminManagementController::class, 'stats']);
        Route::post('/admins', [App\Http\Controllers\Admin\AdminManagementController::class, 'store']);
        Route::put('/admins/{id}', [App\Http\Controllers\Admin\AdminManagementController::class, 'update']);
        Route::delete('/admins/{id}', [App\Http\Controllers\Admin\AdminManagementController::class, 'destroy']);
    });

    // Payout Management - DISABLED (lawyers receive payments directly now)
    // Route::get('/payouts/pending', [App\Http\Controllers\PayoutController::class, 'getPendingPayouts']);
    // Route::get('/payouts', [App\Http\Controllers\PayoutController::class, 'getAllPayouts']);
    // Route::post('/payouts/{id}/approve', [App\Http\Controllers\PayoutController::class, 'approvePayout']);
    // Route::post('/payouts/{id}/mark-paid', [App\Http\Controllers\PayoutController::class, 'markAsPaid']);
    // Route::post('/payouts/{id}/reject', [App\Http\Controllers\PayoutController::class, 'rejectPayout']);

    // FAQ Management
    Route::get('/faqs', [FaqController::class, 'index']);
    Route::post('/faqs', [FaqController::class, 'store']);
    Route::put('/faqs/{id}', [FaqController::class, 'update']);
    Route::delete('/faqs/{id}', [FaqController::class, 'destroy']);
    Route::get('/faq-analytics', [FaqController::class, 'searchAnalytics']);
    
    // Category Management
    Route::get('/faq-categories', [FaqController::class, 'adminCategories']);
    Route::post('/faq-categories', [FaqController::class, 'storeCategory']);
    Route::put('/faq-categories/{id}', [FaqController::class, 'updateCategory']);
    Route::delete('/faq-categories/{id}', [FaqController::class, 'destroyCategory']);

    // Lawyer Verification Management
    Route::get('/verifications/pending', [AdminVerificationController::class, 'getPendingVerifications']);
    Route::get('/verifications/lawyers', [AdminVerificationController::class, 'getAllLawyers']);
    Route::get('/verifications/lawyers/{id}', [AdminVerificationController::class, 'getLawyerDetails']);
    Route::post('/verifications/lawyers/{id}/approve', [AdminVerificationController::class, 'approveLawyer']);
    Route::post('/verifications/lawyers/{id}/reject', [AdminVerificationController::class, 'rejectLawyer']);
    Route::get('/verifications/lawyers/{id}/documents/{documentType}', [AdminVerificationController::class, 'downloadDocument']);
});