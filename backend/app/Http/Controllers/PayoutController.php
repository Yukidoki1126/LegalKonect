<?php

namespace App\Http\Controllers;

use App\Models\Lawyer;
use App\Models\Payout;
use App\Models\Earning;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class PayoutController extends Controller
{
    /**
     * Get lawyer's earnings summary
     * GET /api/lawyer/earnings
     */
    public function getEarnings(Request $request)
    {
        try {
            $user = $request->user();
            $lawyer = Lawyer::where('user_id', $user->id)->first();

            if (!$lawyer) {
                return response()->json(['message' => 'Lawyer profile not found'], 404);
            }

            // Calculate earnings
            $totalEarnings = $lawyer->earnings()->where('status', 'completed')->sum('net_amount');
            $platformFees = $lawyer->earnings()->where('status', 'completed')->sum('platform_fee');
            $grossEarnings = $lawyer->earnings()->where('status', 'completed')->sum('gross_amount');

            // Calculate payouts
            $paidPayouts = $lawyer->payouts()->where('status', 'paid')->sum('amount');
            $pendingPayouts = $lawyer->payouts()->where('status', 'pending')->sum('amount');
            $processingPayouts = $lawyer->payouts()->whereIn('status', ['approved', 'processing'])->sum('amount');

            // Available balance = total earnings - (paid + processing + pending payouts)
            $availableBalance = $totalEarnings - ($paidPayouts + $processingPayouts + $pendingPayouts);

            // Get recent earnings
            $recentEarnings = $lawyer->earnings()
                ->with('appointment.user')
                ->where('status', 'completed')
                ->orderBy('completed_at', 'desc')
                ->limit(10)
                ->get()
                ->map(function ($earning) {
                    return [
                        'id' => $earning->id,
                        'appointment_id' => $earning->appointment_id,
                        'client_name' => $earning->appointment->user->name ?? 'Unknown',
                        'gross_amount' => $earning->gross_amount,
                        'platform_fee' => $earning->platform_fee,
                        'net_amount' => $earning->net_amount,
                        'platform_fee_percentage' => $earning->platform_fee_percentage,
                        'completed_at' => $earning->completed_at->format('Y-m-d H:i:s'),
                    ];
                });

            return response()->json([
                'summary' => [
                    'gross_earnings' => (float) $grossEarnings,
                    'platform_fees' => (float) $platformFees,
                    'net_earnings' => (float) $totalEarnings,
                    'paid_payouts' => (float) $paidPayouts,
                    'pending_payouts' => (float) $pendingPayouts,
                    'processing_payouts' => (float) $processingPayouts,
                    'available_balance' => (float) max(0, $availableBalance),
                ],
                'recent_earnings' => $recentEarnings,
                'payout_info' => [
                    'gcash_number' => $lawyer->gcash_number,
                    'gcash_account_name' => $lawyer->gcash_account_name,
                    'bank_name' => $lawyer->bank_name,
                    'bank_account_number' => $lawyer->bank_account_number,
                    'bank_account_name' => $lawyer->bank_account_name,
                    'preferred_payout_method' => $lawyer->preferred_payout_method,
                ],
                'minimum_payout' => config('app.minimum_payout_amount', 500),
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching earnings', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['message' => 'Failed to fetch earnings'], 500);
        }
    }

    /**
     * Update lawyer's payout information
     * PUT /api/lawyer/payout-info
     */
    public function updatePayoutInfo(Request $request)
    {
        try {
            $validated = $request->validate([
                'gcash_number' => 'nullable|string|max:20',
                'gcash_account_name' => 'nullable|string|max:255',
                'bank_name' => 'nullable|string|max:255',
                'bank_account_number' => 'nullable|string|max:50',
                'bank_account_name' => 'nullable|string|max:255',
                'preferred_payout_method' => 'required|in:gcash,bank',
            ]);

            $user = $request->user();
            $lawyer = Lawyer::where('user_id', $user->id)->first();

            if (!$lawyer) {
                return response()->json(['message' => 'Lawyer profile not found'], 404);
            }

            // Validate based on preferred method
            if ($validated['preferred_payout_method'] === 'gcash') {
                if (empty($validated['gcash_number'])) {
                    return response()->json([
                        'message' => 'GCash number is required when GCash is the preferred method'
                    ], 422);
                }
            } else if ($validated['preferred_payout_method'] === 'bank') {
                if (empty($validated['bank_name']) || empty($validated['bank_account_number'])) {
                    return response()->json([
                        'message' => 'Bank name and account number are required when bank is the preferred method'
                    ], 422);
                }
            }

            $lawyer->update($validated);

            return response()->json([
                'message' => 'Payout information updated successfully',
                'payout_info' => [
                    'gcash_number' => $lawyer->gcash_number,
                    'gcash_account_name' => $lawyer->gcash_account_name,
                    'bank_name' => $lawyer->bank_name,
                    'bank_account_number' => $lawyer->bank_account_number,
                    'bank_account_name' => $lawyer->bank_account_name,
                    'preferred_payout_method' => $lawyer->preferred_payout_method,
                ],
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error updating payout info', [
                'error' => $e->getMessage(),
            ]);
            return response()->json(['message' => 'Failed to update payout information'], 500);
        }
    }

    /**
     * Request a payout
     * POST /api/lawyer/payouts/request
     */
    public function requestPayout(Request $request)
    {
        try {
            $validated = $request->validate([
                'amount' => 'required|numeric|min:1',
                'payout_method' => 'nullable|in:gcash,bank',
            ]);

            $user = $request->user();
            $lawyer = Lawyer::where('user_id', $user->id)->first();

            if (!$lawyer) {
                return response()->json(['message' => 'Lawyer profile not found'], 404);
            }

            // Determine which payout method to use (from request or fallback to preferred)
            $payoutMethod = $validated['payout_method'] ?? $lawyer->preferred_payout_method;

            // Check if selected payout method info is set
            if ($payoutMethod === 'gcash' && empty($lawyer->gcash_number)) {
                return response()->json([
                    'message' => 'Please set up your GCash information before requesting a payout'
                ], 422);
            }

            if ($payoutMethod === 'bank' && (empty($lawyer->bank_name) || empty($lawyer->bank_account_number))) {
                return response()->json([
                    'message' => 'Please set up your bank information before requesting a payout'
                ], 422);
            }

            // Calculate available balance
            $totalEarnings = $lawyer->earnings()->where('status', 'completed')->sum('net_amount');
            $totalPayouts = $lawyer->payouts()->whereIn('status', ['approved', 'processing', 'paid', 'pending'])->sum('amount');
            $availableBalance = $totalEarnings - $totalPayouts;

            // Validate amount - only check if sufficient balance
            if ($validated['amount'] > $availableBalance) {
                return response()->json([
                    'message' => 'Insufficient balance',
                    'available_balance' => (float) $availableBalance,
                    'requested_amount' => (float) $validated['amount'],
                ], 422);
            }

            // Create payout request using the selected method
            $payout = Payout::create([
                'lawyer_id' => $lawyer->id,
                'amount' => $validated['amount'],
                'payout_method' => $payoutMethod,
                'payout_account_number' => $payoutMethod === 'gcash'
                    ? $lawyer->gcash_number
                    : $lawyer->bank_account_number,
                'payout_account_name' => $payoutMethod === 'gcash'
                    ? $lawyer->gcash_account_name
                    : $lawyer->bank_account_name,
                'bank_name' => $payoutMethod === 'bank' ? $lawyer->bank_name : null,
                'status' => 'pending',
                'requested_at' => now(),
            ]);

            Log::info('Payout requested', [
                'payout_id' => $payout->id,
                'lawyer_id' => $lawyer->id,
                'amount' => $validated['amount'],
                'payout_method' => $payoutMethod,
            ]);

            return response()->json([
                'message' => 'Payout request submitted successfully',
                'payout' => [
                    'id' => $payout->id,
                    'amount' => (float) $payout->amount,
                    'method' => $payout->payout_method,
                    'status' => $payout->status,
                    'requested_at' => $payout->requested_at->format('Y-m-d H:i:s'),
                ],
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error requesting payout', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['message' => 'Failed to request payout'], 500);
        }
    }

    /**
     * Get lawyer's payout history
     * GET /api/lawyer/payouts
     */
    public function getPayouts(Request $request)
    {
        try {
            $user = $request->user();
            $lawyer = Lawyer::where('user_id', $user->id)->first();

            if (!$lawyer) {
                return response()->json(['message' => 'Lawyer profile not found'], 404);
            }

            $payouts = $lawyer->payouts()
                ->with('processedBy:id,name')
                ->orderBy('requested_at', 'desc')
                ->get()
                ->map(function ($payout) {
                    return [
                        'id' => $payout->id,
                        'amount' => (float) $payout->amount,
                        'method' => $payout->payout_method,
                        'account_number' => $payout->payout_account_number,
                        'account_name' => $payout->payout_account_name,
                        'bank_name' => $payout->bank_name,
                        'status' => $payout->status,
                        'requested_at' => $payout->requested_at->format('Y-m-d H:i:s'),
                        'approved_at' => $payout->approved_at?->format('Y-m-d H:i:s'),
                        'paid_at' => $payout->paid_at?->format('Y-m-d H:i:s'),
                        'rejected_at' => $payout->rejected_at?->format('Y-m-d H:i:s'),
                        'processed_by' => $payout->processedBy?->name,
                        'admin_notes' => $payout->admin_notes,
                        'rejection_reason' => $payout->rejection_reason,
                        'transaction_reference' => $payout->transaction_reference,
                    ];
                });

            return response()->json(['payouts' => $payouts]);

        } catch (\Exception $e) {
            Log::error('Error fetching payouts', [
                'error' => $e->getMessage(),
            ]);
            return response()->json(['message' => 'Failed to fetch payouts'], 500);
        }
    }

    /**
     * ADMIN: Get all pending payout requests
     * GET /api/admin/payouts/pending
     */
    public function getPendingPayouts(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user->isAdmin() && !$user->isSuperAdmin()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $payouts = Payout::with(['lawyer.user'])
                ->pending()
                ->orderBy('requested_at', 'asc')
                ->get()
                ->map(function ($payout) {
                    return [
                        'id' => $payout->id,
                        'lawyer' => [
                            'id' => $payout->lawyer->id,
                            'name' => $payout->lawyer->full_name,
                            'email' => $payout->lawyer->user->email,
                        ],
                        'amount' => (float) $payout->amount,
                        'method' => $payout->payout_method,
                        'account_number' => $payout->payout_account_number,
                        'account_name' => $payout->payout_account_name,
                        'bank_name' => $payout->bank_name,
                        'status' => $payout->status,
                        'requested_at' => $payout->requested_at->format('Y-m-d H:i:s'),
                    ];
                });

            return response()->json(['payouts' => $payouts]);

        } catch (\Exception $e) {
            Log::error('Error fetching pending payouts', [
                'error' => $e->getMessage(),
            ]);
            return response()->json(['message' => 'Failed to fetch pending payouts'], 500);
        }
    }

    /**
     * ADMIN: Get all payouts (with filters)
     * GET /api/admin/payouts
     */
    public function getAllPayouts(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user->isAdmin() && !$user->isSuperAdmin()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $status = $request->query('status');
            $query = Payout::with(['lawyer.user', 'processedBy']);

            if ($status && in_array($status, ['pending', 'approved', 'processing', 'paid', 'rejected'])) {
                $query->where('status', $status);
            }

            $payouts = $query->orderBy('requested_at', 'desc')
                ->paginate(20)
                ->through(function ($payout) {
                    return [
                        'id' => $payout->id,
                        'lawyer' => [
                            'id' => $payout->lawyer->id,
                            'name' => $payout->lawyer->full_name,
                            'email' => $payout->lawyer->user->email,
                        ],
                        'amount' => (float) $payout->amount,
                        'method' => $payout->payout_method,
                        'account_number' => $payout->payout_account_number,
                        'account_name' => $payout->payout_account_name,
                        'bank_name' => $payout->bank_name,
                        'status' => $payout->status,
                        'requested_at' => $payout->requested_at->format('Y-m-d H:i:s'),
                        'approved_at' => $payout->approved_at?->format('Y-m-d H:i:s'),
                        'paid_at' => $payout->paid_at?->format('Y-m-d H:i:s'),
                        'rejected_at' => $payout->rejected_at?->format('Y-m-d H:i:s'),
                        'processed_by' => $payout->processedBy?->name,
                        'admin_notes' => $payout->admin_notes,
                        'rejection_reason' => $payout->rejection_reason,
                        'transaction_reference' => $payout->transaction_reference,
                    ];
                });

            return response()->json($payouts);

        } catch (\Exception $e) {
            Log::error('Error fetching all payouts', [
                'error' => $e->getMessage(),
            ]);
            return response()->json(['message' => 'Failed to fetch payouts'], 500);
        }
    }

    /**
     * ADMIN: Approve payout request
     * POST /api/admin/payouts/{id}/approve
     */
    public function approvePayout(Request $request, $id)
    {
        try {
            $user = $request->user();

            if (!$user->isAdmin() && !$user->isSuperAdmin()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $payout = Payout::findOrFail($id);

            if ($payout->status !== 'pending') {
                return response()->json([
                    'message' => 'Only pending payouts can be approved'
                ], 422);
            }

            $payout->update([
                'status' => 'approved',
                'approved_at' => now(),
                'processed_by' => $user->id,
            ]);

            Log::info('Payout approved', [
                'payout_id' => $payout->id,
                'admin_id' => $user->id,
            ]);

            return response()->json([
                'message' => 'Payout approved successfully',
                'payout' => [
                    'id' => $payout->id,
                    'status' => $payout->status,
                    'approved_at' => $payout->approved_at->format('Y-m-d H:i:s'),
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Error approving payout', [
                'payout_id' => $id,
                'error' => $e->getMessage(),
            ]);
            return response()->json(['message' => 'Failed to approve payout'], 500);
        }
    }

    /**
     * ADMIN: Mark payout as paid
     * POST /api/admin/payouts/{id}/mark-paid
     */
    public function markAsPaid(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'transaction_reference' => 'nullable|string|max:255',
                'admin_notes' => 'nullable|string',
            ]);

            $user = $request->user();

            if (!$user->isAdmin() && !$user->isSuperAdmin()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $payout = Payout::findOrFail($id);

            if (!in_array($payout->status, ['pending', 'approved', 'processing'])) {
                return response()->json([
                    'message' => 'This payout cannot be marked as paid'
                ], 422);
            }

            $payout->update([
                'status' => 'paid',
                'paid_at' => now(),
                'processed_by' => $user->id,
                'transaction_reference' => $validated['transaction_reference'] ?? null,
                'admin_notes' => $validated['admin_notes'] ?? null,
            ]);

            Log::info('Payout marked as paid', [
                'payout_id' => $payout->id,
                'admin_id' => $user->id,
            ]);

            return response()->json([
                'message' => 'Payout marked as paid successfully',
                'payout' => [
                    'id' => $payout->id,
                    'status' => $payout->status,
                    'paid_at' => $payout->paid_at->format('Y-m-d H:i:s'),
                ],
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error marking payout as paid', [
                'payout_id' => $id,
                'error' => $e->getMessage(),
            ]);
            return response()->json(['message' => 'Failed to mark payout as paid'], 500);
        }
    }

    /**
     * ADMIN: Reject payout request
     * POST /api/admin/payouts/{id}/reject
     */
    public function rejectPayout(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'rejection_reason' => 'required|string',
            ]);

            $user = $request->user();

            if (!$user->isAdmin() && !$user->isSuperAdmin()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $payout = Payout::findOrFail($id);

            if ($payout->status !== 'pending') {
                return response()->json([
                    'message' => 'Only pending payouts can be rejected'
                ], 422);
            }

            $payout->update([
                'status' => 'rejected',
                'rejected_at' => now(),
                'processed_by' => $user->id,
                'rejection_reason' => $validated['rejection_reason'],
            ]);

            Log::info('Payout rejected', [
                'payout_id' => $payout->id,
                'admin_id' => $user->id,
                'reason' => $validated['rejection_reason'],
            ]);

            return response()->json([
                'message' => 'Payout rejected',
                'payout' => [
                    'id' => $payout->id,
                    'status' => $payout->status,
                    'rejected_at' => $payout->rejected_at->format('Y-m-d H:i:s'),
                ],
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error rejecting payout', [
                'payout_id' => $id,
                'error' => $e->getMessage(),
            ]);
            return response()->json(['message' => 'Failed to reject payout'], 500);
        }
    }
}
