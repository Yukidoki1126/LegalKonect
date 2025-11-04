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
    ];

    protected $casts = [
        'appointment_date' => 'date',
        'appointment_time' => 'datetime:H:i',
        'cancelled_at' => 'datetime',
    ];

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
}