<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Earning;
use App\Services\PaymongoService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Mail\PaymentReceipt;
use Illuminate\Support\Facades\Cache;


class PaymentController extends Controller
{
    protected $paymongo;

    public function __construct(PaymongoService $paymongo)
    {
        $this->paymongo = $paymongo;
    }

    /**
     * Create a payment intent for an appointment
     */
    public function createPaymentIntent(Request $request, $appointmentId)
    {
        try {
            $user = $request->user();

            Log::info('Creating payment intent', [
                'appointment_id' => $appointmentId,
                'user_id' => $user->id,
                'user_email' => $user->email
            ]);

            // Find the appointment
            $appointment = Appointment::with(['lawyer.user'])->find($appointmentId);

            if (!$appointment) {
                Log::warning('Appointment not found for payment', ['id' => $appointmentId]);
                return response()->json([
                    'message' => 'Appointment not found'
                ], 404);
            }

            Log::info('Appointment ownership check', [
                'appointment_user_id' => $appointment->user_id,
                'authenticated_user_id' => $user->id,
                'match' => $appointment->user_id == $user->id
            ]);

            // FIXED: Use loose comparison (!=) instead of strict (!==)
            if ($appointment->user_id != $user->id) {
                Log::warning('Unauthorized payment attempt', [
                    'appointment_id' => $appointmentId,
                    'appointment_user_id' => $appointment->user_id,
                    'requesting_user_id' => $user->id
                ]);

                return response()->json([
                    'message' => 'Unauthorized to pay for this appointment'
                ], 403);
            }

            // Check if already paid
            if ($appointment->payment_status === 'paid') {
                return response()->json([
                    'message' => 'This appointment has already been paid for'
                ], 422);
            }

            // Get the reservation fee amount (don't convert to cents - PaymongoService does that)
            $amount = $appointment->lawyer->reservation_fee ?? 100.00;

            Log::info('Creating PayMongo payment intent', [
                'amount' => $amount,
                'currency' => 'PHP'
            ]);

            // Create payment intent via PayMongo
            // PaymongoService expects: createPaymentIntent($amount, $description, $metadata)
            $paymentIntent = $this->paymongo->createPaymentIntent(
                $amount,
                "Legal consultation with {$appointment->lawyer->user->name}",
                [
                    'appointment_id' => $appointment->id,
                    'user_id' => $user->id,
                    'lawyer_id' => $appointment->lawyer_id
                ]
            );

            Log::info('Payment intent created successfully', [
                'payment_intent_id' => $paymentIntent['data']['id'] ?? 'unknown'
            ]);

            return response()->json([
                'payment_intent_id' => $paymentIntent['data']['id'],
                'client_key' => $paymentIntent['data']['attributes']['client_key'],
                'amount' => $appointment->consultation_fee,
                'currency' => 'PHP'
            ]);

        } catch (\Exception $e) {
            Log::error('Error creating payment intent', [
                'appointment_id' => $appointmentId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to create payment intent',
                'error' => config('app.debug') ? $e->getMessage() : 'Payment processing error'
            ], 500);
        }
    }

    /**
     * Create a payment method (for card payments)
     */
    public function createPaymentMethod(Request $request)
    {
        try {
            $request->validate([
                'type' => 'required|in:card,gcash,paymaya',
                'card_number' => 'required_if:type,card',
                'exp_month' => 'required_if:type,card|integer|between:1,12',
                'exp_year' => 'required_if:type,card|integer',
                'cvc' => 'required_if:type,card|string'
            ]);

            $user = $request->user();

            Log::info('Creating payment method', [
                'user_id' => $user->id,
                'type' => $request->type
            ]);

            $details = [];

            if ($request->type === 'card') {
                $details = [
                    'card_number' => $request->card_number,
                    'exp_month' => (int) $request->exp_month,
                    'exp_year' => (int) $request->exp_year,
                    'cvc' => $request->cvc
                ];
            }

            $paymentMethod = $this->paymongo->createPaymentMethod(
                $request->type,
                $details,
                [
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone ?? null
                ]
            );

            return response()->json([
                'payment_method_id' => $paymentMethod['data']['id']
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);

        } catch (\Exception $e) {
            Log::error('Error creating payment method', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to create payment method',
                'error' => config('app.debug') ? $e->getMessage() : 'Payment processing error'
            ], 500);
        }
    }

    /**
     * Attach payment method to payment intent and confirm
     */
    public function attachPaymentMethod(Request $request)
    {
        try {
            $request->validate([
                'payment_intent_id' => 'required|string',
                'payment_method_id' => 'required|string',
                'appointment_id' => 'required|exists:appointments,id'
            ]);

            $user = $request->user();
            $appointment = Appointment::find($request->appointment_id);

            // Verify ownership
            if ($appointment->user_id != $user->id) {
                return response()->json([
                    'message' => 'Unauthorized'
                ], 403);
            }

            Log::info('Attaching payment method', [
                'payment_intent_id' => $request->payment_intent_id,
                'payment_method_id' => $request->payment_method_id,
                'appointment_id' => $request->appointment_id
            ]);

            // Attach payment method and confirm payment
            $result = $this->paymongo->attachPaymentIntent(
                $request->payment_intent_id,
                $request->payment_method_id
            );

            $status = $result['data']['attributes']['status'];

            if ($status === 'succeeded') {
                // Update appointment payment status
                $appointment->update([
                    'payment_status' => 'paid',
                    'payment_method' => $request->payment_method_type ?? 'card',
                    'payment_reference' => $request->payment_intent_id,
                    'status' => 'confirmed'
                ]);

                // Create earning record for lawyer
                $this->createEarningRecord($appointment);

                // Clear admin caches
                $this->clearPaymentCaches();

                Log::info('Payment successful', [
                    'appointment_id' => $appointment->id,
                    'payment_intent_id' => $request->payment_intent_id
                ]);

                try {
                    $appointment->load(['lawyer', 'user']);

                    // Send payment receipt
                    Mail::to($appointment->user->email)->send(new \App\Mail\PaymentReceipt($appointment));

                    Log::info('Payment receipt sent', [
                        'appointment_id' => $appointment->id,
                        'email' => $appointment->user->email
                    ]);
                } catch (\Exception $e) {
                    Log::error('Failed to send payment receipt: ' . $e->getMessage());
                }

                return response()->json([
                    'message' => 'Payment successful',
                    'status' => 'succeeded',
                    'appointment' => $appointment
                ]);
            }

            return response()->json([
                'message' => 'Payment processing',
                'status' => $status
            ]);

        } catch (\Exception $e) {
            Log::error('Error attaching payment method', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Payment failed',
                'error' => config('app.debug') ? $e->getMessage() : 'Payment processing error'
            ], 500);
        }
    }

    /**
     * Handle PayMongo webhooks
     */
    public function webhook(Request $request)
    {
        try {
            $payload = $request->all();
            
            Log::info('PayMongo webhook received', [
                'type' => $payload['data']['attributes']['type'] ?? 'unknown'
            ]);

            $eventType = $payload['data']['attributes']['type'] ?? null;

            if ($eventType === 'payment.paid') {
                $paymentIntentId = $payload['data']['attributes']['data']['id'];
                
                // Find appointment by payment reference
                $appointment = Appointment::where('payment_reference', $paymentIntentId)->first();

                if ($appointment && $appointment->payment_status !== 'paid') {
                    $appointment->update([
                        'payment_status' => 'paid',
                        'status' => 'confirmed'
                    ]);

                    // Create earning record for lawyer
                    $this->createEarningRecord($appointment);

                    // Clear admin caches
                    $this->clearPaymentCaches();

                    Log::info('Appointment payment confirmed via webhook', [
                        'appointment_id' => $appointment->id
                    ]);

                    // Send payment receipt
                    try {
                        $appointment->load(['lawyer', 'user']);
                        Mail::to($appointment->user->email)->send(new PaymentReceipt($appointment));
                    } catch (\Exception $e) {
                        Log::error('Failed to send payment receipt: ' . $e->getMessage());
                    }
                }
            }

            return response()->json(['success' => true]);

        } catch (\Exception $e) {
            Log::error('Webhook processing error', [
                'error' => $e->getMessage()
            ]);

            return response()->json(['success' => false], 500);
        }
    }

    public function createSource(Request $request)
    {
        try {
            $request->validate([
                'type' => 'required|in:gcash,paymaya',
                'amount' => 'required|numeric',
                'payment_intent_id' => 'required|string',
                'appointment_id' => 'required|exists:appointments,id'
            ]);

            $user = $request->user();
            $appointment = Appointment::find($request->appointment_id);

            if ($appointment->user_id != $user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            Log::info('Creating payment source', [
                'type' => $request->type,
                'amount' => $request->amount,
                'appointment_id' => $request->appointment_id
            ]);

            $source = $this->paymongo->createSource(
                $request->type,
                $request->amount,
                [
                    'appointment_id' => (string)$request->appointment_id,
                    'user_id' => (string)$user->id,
                    'payment_intent_id' => $request->payment_intent_id
                ]
            );

            $sourceId = $source['data']['id'];
            $checkoutUrl = $source['data']['attributes']['redirect']['checkout_url'];

            // Store source ID temporarily in appointment for callback
            $appointment->update([
                'payment_reference' => $sourceId
            ]);

            Log::info('Source created and stored', [
                'source_id' => $sourceId,
                'appointment_id' => $appointment->id
            ]);

            return response()->json([
                'redirect_url' => $checkoutUrl,
                'source_id' => $sourceId
            ]);

        } catch (\Exception $e) {
            Log::error('Error creating payment source: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to create payment source',
                'error' => config('app.debug') ? $e->getMessage() : 'Payment processing error'
            ], 500);
        }
    }

    public function handleSourceCallback(Request $request)
    {
        try {
            Log::info('Source callback received', $request->all());

            // Find the most recent unpaid appointment with a GCash source
            $appointment = Appointment::where('payment_status', 'unpaid')
                ->whereNotNull('payment_reference')
                ->where('payment_reference', 'like', 'src_%')
                ->orderBy('updated_at', 'desc')
                ->first();

            if (!$appointment) {
                Log::warning('No pending appointment found for source callback');
                return redirect(env('FRONTEND_URL', 'http://localhost:3000') . '/appointments?payment=error');
            }

            $sourceId = $appointment->payment_reference;

            // Get source details from PayMongo
            $source = $this->paymongo->getSource($sourceId);
            $status = $source['data']['attributes']['status'];
            
            Log::info('Source status check', [
                'status' => $status,
                'source_id' => $sourceId,
                'appointment_id' => $appointment->id
            ]);

            if ($status === 'chargeable' || $status === 'paid') {
                // Update appointment
                $appointment->update([
                    'payment_status' => 'paid',
                    'payment_method' => 'gcash',
                    'status' => 'confirmed'
                ]);

                // Create earning record for lawyer
                $this->createEarningRecord($appointment);

                // Clear admin caches
                $this->clearPaymentCaches();

                Log::info('Appointment marked as paid', ['appointment_id' => $appointment->id]);

                // Send payment receipt
                try {
                    $appointment->load(['lawyer', 'user']);
                    Mail::to($appointment->user->email)->send(new PaymentReceipt($appointment));
                    Log::info('Payment receipt sent', ['appointment_id' => $appointment->id]);
                } catch (\Exception $e) {
                    Log::error('Failed to send payment receipt: ' . $e->getMessage());
                }

                return redirect(env('FRONTEND_URL', 'http://localhost:3000') . '/appointments?payment=success');
            }

            Log::warning('Source not chargeable', ['status' => $status]);
            return redirect(env('FRONTEND_URL', 'http://localhost:3000') . '/appointments?payment=pending');

        } catch (\Exception $e) {
            Log::error('Source callback error: ' . $e->getMessage());
            return redirect(env('FRONTEND_URL', 'http://localhost:3000') . '/appointments?payment=error');
        }
    }

    /**
     * Clear payment-related caches
     */
    private function clearPaymentCaches()
    {
        Cache::forget('admin_dashboard_stats');

        // Clear payment cache pages
        for ($i = 1; $i <= 10; $i++) {
            Cache::forget("admin_payments_page_{$i}");
        }
    }

    /**
     * Create earning record for completed payment
     * Automatically splits payment: 90% to lawyer, 10% to platform
     */
    private function createEarningRecord(Appointment $appointment)
    {
        try {
            // Check if earning already exists for this appointment
            $existingEarning = Earning::where('appointment_id', $appointment->id)->first();
            if ($existingEarning) {
                Log::info('Earning record already exists', ['appointment_id' => $appointment->id]);
                return $existingEarning;
            }

            // Use reservation fee since that's what was actually paid
            $grossAmount = $appointment->lawyer->reservation_fee ?? 100.00;
            $platformFeePercentage = config('app.platform_fee_percentage', 10.00); // 10% default
            $platformFee = $grossAmount * ($platformFeePercentage / 100);
            $netAmount = $grossAmount - $platformFee;

            $earning = Earning::create([
                'lawyer_id' => $appointment->lawyer_id,
                'appointment_id' => $appointment->id,
                'gross_amount' => $grossAmount,
                'platform_fee' => $platformFee,
                'net_amount' => $netAmount,
                'platform_fee_percentage' => $platformFeePercentage,
                'status' => 'completed',
                'completed_at' => now(),
            ]);

            Log::info('Earning record created', [
                'earning_id' => $earning->id,
                'lawyer_id' => $appointment->lawyer_id,
                'gross_amount' => $grossAmount,
                'platform_fee' => $platformFee,
                'net_amount' => $netAmount,
            ]);

            return $earning;

        } catch (\Exception $e) {
            Log::error('Failed to create earning record', [
                'appointment_id' => $appointment->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            // Don't throw - payment already succeeded, just log the error
            return null;
        }
    }
}