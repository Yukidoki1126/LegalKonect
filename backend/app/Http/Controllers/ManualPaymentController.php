<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Lawyer;
use App\Services\NotificationService;
use App\Mail\PaymentProofUploaded;
use App\Mail\PaymentConfirmed;
use App\Mail\PaymentRejected;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;

class ManualPaymentController extends Controller
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Get lawyer's payment information for clients
     */
    public function getLawyerPaymentInfo($lawyerId)
    {
        try {
            $lawyer = Lawyer::findOrFail($lawyerId);

            // Build payment methods array based on what the lawyer has set up
            $paymentMethods = [];

            if ($lawyer->gcash_number) {
                $paymentMethods['gcash'] = [
                    'number' => $lawyer->gcash_number,
                    'account_name' => $lawyer->gcash_account_name,
                    'qr_code' => $lawyer->gcash_qr_code ? Storage::url($lawyer->gcash_qr_code) : null,
                ];
            }

            if ($lawyer->bank_account_number) {
                $paymentMethods['bank'] = [
                    'bank_name' => $lawyer->bank_name,
                    'account_number' => $lawyer->bank_account_number,
                    'account_name' => $lawyer->bank_account_name,
                ];
            }

            return response()->json([
                'lawyer_id' => $lawyer->id,
                'lawyer_name' => $lawyer->first_name . ' ' . $lawyer->last_name,
                'preferred_method' => $lawyer->preferred_payout_method,
                'payment_methods' => $paymentMethods,
                'has_payment_info' => !empty($paymentMethods),
            ]);
        } catch (\Exception $e) {
            Log::error('Error getting lawyer payment info: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to get payment information'], 500);
        }
    }

    /**
     * Upload payment proof (receipt) for an appointment
     */
    public function uploadPaymentProof(Request $request, $appointmentId)
    {
        try {
            $request->validate([
                'payment_proof' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120', // 5MB max
                'payment_method_used' => 'required|in:gcash,bank',
            ]);

            $user = $request->user();
            $appointment = Appointment::with('lawyer')->findOrFail($appointmentId);

            // Verify ownership
            if ($appointment->user_id != $user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            // Check appointment status
            if (!in_array($appointment->status, ['pending', 'confirmed'])) {
                return response()->json(['message' => 'Cannot upload payment proof for this appointment'], 422);
            }

            // Store the payment proof
            $file = $request->file('payment_proof');
            $filename = 'payment_proof_' . $appointmentId . '_' . time() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('payment_proofs', $filename, 'public');

            // Update appointment
            $appointment->update([
                'payment_proof' => $path,
                'payment_method_used' => $request->payment_method_used,
                'payment_proof_uploaded_at' => now(),
                'payment_status' => 'unpaid', // Keep as unpaid until admin verifies
            ]);

            // Send notification to lawyer
            $this->notificationService->notifyLawyer(
                $appointment->lawyer_id,
                'payment_proof_uploaded',
                'Payment Proof Uploaded',
                "Client has uploaded payment proof for appointment on " . $appointment->appointment_date->format('M d, Y') . ". Please verify the payment.",
                ['appointment_id' => $appointment->id]
            );

            // Send email to lawyer
            try {
                $lawyerEmail = $appointment->lawyer->user->email ?? null;
                if ($lawyerEmail) {
                    Mail::to($lawyerEmail)->send(new PaymentProofUploaded($appointment));
                    Log::info('Payment proof uploaded email sent to lawyer', ['appointment_id' => $appointmentId]);
                }
            } catch (\Exception $e) {
                Log::error('Failed to send payment proof uploaded email: ' . $e->getMessage());
            }

            Log::info('Payment proof uploaded', [
                'appointment_id' => $appointmentId,
                'user_id' => $user->id,
                'payment_method' => $request->payment_method_used,
            ]);

            return response()->json([
                'message' => 'Payment proof uploaded successfully',
                'appointment' => $appointment->fresh(),
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation failed', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Error uploading payment proof: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to upload payment proof'], 500);
        }
    }

    /**
     * Lawyer confirms payment receipt
     */
    public function confirmPayment(Request $request, $appointmentId)
    {
        try {
            $user = $request->user();
            $lawyer = $user->lawyer;

            if (!$lawyer) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $appointment = Appointment::with('user')->findOrFail($appointmentId);

            // Verify lawyer owns this appointment
            if ($appointment->lawyer_id != $lawyer->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            // Check if payment proof was uploaded
            if (!$appointment->payment_proof) {
                return response()->json(['message' => 'No payment proof uploaded yet'], 422);
            }

            // Confirm payment
            $appointment->update([
                'payment_confirmed' => true,
                'payment_confirmed_at' => now(),
                'payment_status' => 'paid',
                'status' => 'confirmed', // Also confirm the appointment if not already
            ]);

            // Send notification to client
            $this->notificationService->notifyUser(
                $appointment->user_id,
                'payment_confirmed',
                'Payment Confirmed',
                "Your payment for the appointment on " . $appointment->appointment_date->format('M d, Y') . " has been confirmed by the lawyer.",
                ['appointment_id' => $appointment->id]
            );

            // Send email to client
            try {
                $clientEmail = $appointment->user->email ?? null;
                if ($clientEmail) {
                    Mail::to($clientEmail)->send(new PaymentConfirmed($appointment));
                    Log::info('Payment confirmed email sent to client', ['appointment_id' => $appointmentId]);
                }
            } catch (\Exception $e) {
                Log::error('Failed to send payment confirmed email: ' . $e->getMessage());
            }

            Log::info('Payment confirmed by lawyer', [
                'appointment_id' => $appointmentId,
                'lawyer_id' => $lawyer->id,
            ]);

            return response()->json([
                'message' => 'Payment confirmed successfully',
                'appointment' => $appointment->fresh(),
            ]);
        } catch (\Exception $e) {
            Log::error('Error confirming payment: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to confirm payment'], 500);
        }
    }

    /**
     * Lawyer rejects payment (invalid receipt)
     */
    public function rejectPayment(Request $request, $appointmentId)
    {
        try {
            $request->validate([
                'reason' => 'required|string|max:500',
            ]);

            $user = $request->user();
            $lawyer = $user->lawyer;

            if (!$lawyer) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $appointment = Appointment::with('user')->findOrFail($appointmentId);

            // Verify lawyer owns this appointment
            if ($appointment->lawyer_id != $lawyer->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            // Reset payment proof so client can re-upload
            $appointment->update([
                'payment_proof' => null,
                'payment_method_used' => null,
                'payment_proof_uploaded_at' => null,
                'payment_confirmed' => false,
                'payment_status' => 'unpaid',
            ]);

            // Send notification to client
            $this->notificationService->notifyUser(
                $appointment->user_id,
                'payment_rejected',
                'Payment Proof Rejected',
                "Your payment proof for the appointment on " . $appointment->appointment_date->format('M d, Y') . " was rejected. Reason: " . $request->reason . ". Please upload a valid receipt.",
                ['appointment_id' => $appointment->id, 'reason' => $request->reason]
            );

            // Send email to client
            try {
                $clientEmail = $appointment->user->email ?? null;
                if ($clientEmail) {
                    Mail::to($clientEmail)->send(new PaymentRejected($appointment, $request->reason));
                    Log::info('Payment rejected email sent to client', ['appointment_id' => $appointmentId]);
                }
            } catch (\Exception $e) {
                Log::error('Failed to send payment rejected email: ' . $e->getMessage());
            }

            Log::info('Payment rejected by lawyer', [
                'appointment_id' => $appointmentId,
                'lawyer_id' => $lawyer->id,
                'reason' => $request->reason,
            ]);

            return response()->json([
                'message' => 'Payment proof rejected. Client has been notified.',
                'appointment' => $appointment->fresh(),
            ]);
        } catch (\Exception $e) {
            Log::error('Error rejecting payment: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to reject payment'], 500);
        }
    }

    /**
     * Get payment proof image for viewing
     */
    public function getPaymentProof($appointmentId)
    {
        try {
            $user = request()->user();
            $appointment = Appointment::findOrFail($appointmentId);

            // Allow both client and lawyer to view
            $lawyer = $user->lawyer;
            $isLawyer = $lawyer && $appointment->lawyer_id == $lawyer->id;
            $isClient = $appointment->user_id == $user->id;

            if (!$isLawyer && !$isClient) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            if (!$appointment->payment_proof) {
                return response()->json(['message' => 'No payment proof found'], 404);
            }

            return response()->json([
                'payment_proof_url' => Storage::url($appointment->payment_proof),
                'payment_method_used' => $appointment->payment_method_used,
                'uploaded_at' => $appointment->payment_proof_uploaded_at,
                'confirmed' => $appointment->payment_confirmed,
                'confirmed_at' => $appointment->payment_confirmed_at,
            ]);
        } catch (\Exception $e) {
            Log::error('Error getting payment proof: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to get payment proof'], 500);
        }
    }
}
