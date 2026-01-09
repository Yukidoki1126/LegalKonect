<?php

namespace App\Observers;

use App\Models\Appointment;
use App\Models\Earning;
use Illuminate\Support\Facades\Log;

class AppointmentObserver
{
    /**
     * Handle the Appointment "updated" event.
     * Create earning record when payment is confirmed
     */
    public function updated(Appointment $appointment): void
    {
        // Check if payment status just changed to 'paid'
        if ($appointment->isDirty('payment_status') && $appointment->payment_status === 'paid') {
            $this->createEarningRecord($appointment);
        }

        // Check if appointment status changed to 'completed'
        if ($appointment->isDirty('status') && $appointment->status === 'completed' && $appointment->payment_status === 'paid') {
            $this->updateEarningToCompleted($appointment);
        }
    }

    /**
     * Create earning record for paid appointment
     */
    protected function createEarningRecord(Appointment $appointment): void
    {
        try {
            // Check if earning record already exists
            $existingEarning = Earning::where('appointment_id', $appointment->id)->first();
            if ($existingEarning) {
                Log::info('Earning record already exists', ['appointment_id' => $appointment->id]);
                return;
            }

            $grossAmount = $appointment->consultation_fee ?? 100;
            $platformFeePercentage = config('app.platform_fee_percentage', 10); // Default 10%
            $platformFee = ($grossAmount * $platformFeePercentage) / 100;
            $netAmount = $grossAmount - $platformFee;

            Earning::create([
                'lawyer_id' => $appointment->lawyer_id,
                'appointment_id' => $appointment->id,
                'gross_amount' => $grossAmount,
                'platform_fee' => $platformFee,
                'net_amount' => $netAmount,
                'platform_fee_percentage' => $platformFeePercentage,
                'status' => $appointment->status === 'completed' ? 'completed' : 'pending',
                'completed_at' => $appointment->status === 'completed' ? now() : null,
            ]);

            Log::info('Earning record created', [
                'appointment_id' => $appointment->id,
                'lawyer_id' => $appointment->lawyer_id,
                'gross_amount' => $grossAmount,
                'net_amount' => $netAmount,
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to create earning record', [
                'appointment_id' => $appointment->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }

    /**
     * Update earning status to completed
     */
    protected function updateEarningToCompleted(Appointment $appointment): void
    {
        try {
            $earning = Earning::where('appointment_id', $appointment->id)->first();
            
            if ($earning && $earning->status !== 'completed') {
                $earning->update([
                    'status' => 'completed',
                    'completed_at' => now(),
                ]);

                Log::info('Earning marked as completed', [
                    'appointment_id' => $appointment->id,
                    'earning_id' => $earning->id,
                ]);
            }

        } catch (\Exception $e) {
            Log::error('Failed to update earning to completed', [
                'appointment_id' => $appointment->id,
                'error' => $e->getMessage()
            ]);
        }
    }
}
