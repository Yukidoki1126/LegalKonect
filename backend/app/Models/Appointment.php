<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Appointment extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'lawyer_id',
        'specialization_id',
        'confirmed_specialization_id',
        'specialization_confirmed_at',
        'appointment_date',
        'appointment_time',
        'duration_minutes',
        'status',
        'consultation_fee',
        'payment_status',
        'payment_method',
        'payment_reference',
        'client_notes',
        'lawyer_notes',
        'cancellation_reason',
        'cancelled_at',
        'cancelled_by',
        'meeting_type',
        'meeting_link',
        'google_event_id',
        'reschedule_status',
        'reschedule_reason',
        'original_date',
        'proposed_date',
        'reschedule_requested_at',
        'reschedule_responded_at',
        'reschedule_requested_by',
        'client_reschedule_used',
        // Manual payment fields
        'payment_proof',
        'payment_method_used',
        'payment_proof_uploaded_at',
        'payment_confirmed',
        'payment_confirmed_at',
    ];

    protected $casts = [
        'appointment_date' => 'date',
        'appointment_time' => 'string',
        'cancelled_at' => 'datetime',
        'specialization_confirmed_at' => 'datetime',
        'original_date' => 'date',
        'proposed_date' => 'datetime',
        'reschedule_requested_at' => 'datetime',
        'reschedule_responded_at' => 'datetime',
        'payment_proof_uploaded_at' => 'datetime',
        'payment_confirmed' => 'boolean',
        'payment_confirmed_at' => 'datetime',
        'client_reschedule_used' => 'boolean',
    ];

    
    /**
     * Get the client-selected specialization
     */
    public function specialization()
    {
        return $this->belongsTo(Specialization::class, 'specialization_id');
    }

    /**
     * Get the lawyer-confirmed specialization
     */
    public function confirmedSpecialization()
    {
        return $this->belongsTo(Specialization::class, 'confirmed_specialization_id');
    }

    /**
     * Get the user (client) who made the appointment
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the lawyer for this appointment
     */
    public function lawyer()
    {
        return $this->belongsTo(Lawyer::class);
    }

    /**
     * Get the user who cancelled the appointment
     */
    public function cancelledBy()
    {
        return $this->belongsTo(User::class, 'cancelled_by');
    }

    /**
     * Scope for upcoming appointments
     */
    public function scopeUpcoming($query)
    {
        return $query->where('appointment_date', '>=', now()->toDateString())
                     ->whereIn('status', ['pending', 'confirmed'])
                     ->orderBy('appointment_date')
                     ->orderBy('appointment_time');
    }

    /**
     * Scope for past appointments
     */
    public function scopePast($query)
    {
        return $query->where(function($q) {
            $q->where('appointment_date', '<', now()->toDateString())
              ->orWhereIn('status', ['completed', 'cancelled', 'no_show']);
        })->orderBy('appointment_date', 'desc')
          ->orderBy('appointment_time', 'desc');
    }

    /**
     * Check if appointment can be cancelled
     */
    public function canBeCancelled()
    {
        return in_array($this->status, ['pending', 'confirmed']) 
               && $this->appointment_date >= now()->toDateString();
    }

    public function review()
    {
        return $this->hasOne(Review::class);
    }

    /**
     * Get the case associated with this appointment
     */
    public function case()
    {
        return $this->hasOne(CaseModel::class);
    }

    /**
     * Check if appointment can be reviewed
     */
    public function canBeReviewed()
    {
        return $this->status === 'completed' && !$this->review;
    }

    /**
     * Get the formatted appointment time (HH:MM format)
     */
    public function getAppointmentTimeAttribute($value)
    {
        // If value is null, return it as-is
        if (!$value) {
            return $value;
        }

        // Extract just HH:MM from time format like "12:00:00.0000000"
        return substr($value, 0, 5);
    }

    /**
     * Boot method to handle model events
     */
    protected static function boot()
    {
        parent::boot();

        // When an appointment is being deleted, also delete the Google Calendar event
        static::deleting(function ($appointment) {
            // Check if the appointment has a Google Calendar event ID
            if ($appointment->google_event_id && $appointment->lawyer) {
                try {
                    $googleCalendarService = app(\App\Services\GoogleCalendarService::class);

                    // Only delete if lawyer still has Google Calendar connected
                    if ($appointment->lawyer->google_calendar_connected) {
                        $googleCalendarService->deleteAppointmentEvent(
                            $appointment->lawyer,
                            $appointment->google_event_id
                        );

                        \Log::info('Google Calendar event deleted via model event', [
                            'appointment_id' => $appointment->id,
                            'event_id' => $appointment->google_event_id
                        ]);
                    }
                } catch (\Exception $e) {
                    // Log error but don't prevent deletion
                    \Log::error('Failed to delete Google Calendar event during appointment deletion', [
                        'appointment_id' => $appointment->id,
                        'event_id' => $appointment->google_event_id,
                        'error' => $e->getMessage()
                    ]);
                }
            }
        });
    }
}