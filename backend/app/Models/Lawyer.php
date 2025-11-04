<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Lawyer extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'first_name',
        'last_name',
        'bio',
        'license_number',
        'years_experience',
        'hourly_rate',
        'office_address',
        'office_latitude',
        'office_longitude',
        'office_phone',
        'office_hours',
        'profile_photo',
        'status',
        'rating',
        'total_reviews',
        'is_available',
        'google_access_token',
        'google_refresh_token',
        'google_token_expires_at',
        'google_calendar_id',
        'google_calendar_connected',
    ];

    protected $casts = [
        'office_hours' => 'array',
        'office_latitude' => 'decimal:8',
        'office_longitude' => 'decimal:8',
        'hourly_rate' => 'decimal:2',
        'rating' => 'decimal:2',
        'is_available' => 'boolean',
        'google_calendar_connected' => 'boolean',
        'google_token_expires_at' => 'datetime',
    ];

    // Relationship with User
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Many-to-many relationship with Specializations
    public function specializations()
    {
        return $this->belongsToMany(Specialization::class, 'lawyer_specializations');
    }

    // Helper method to get full name
    public function getFullNameAttribute()
    {
        return $this->first_name . ' ' . $this->last_name;
    }

    // Scope for approved lawyers only
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    // Scope for available lawyers
    public function scopeAvailable($query)
    {
        return $query->where('is_available', true);
    }

    
public function appointments()
{
    return $this->hasMany(Appointment::class);
}


public function availability()
{
    return $this->hasMany(LawyerAvailability::class);
}


public function unavailableDates()
{
    return $this->hasMany(LawyerUnavailableDate::class);
}

// Helper: Get pending appointments
public function pendingAppointments()
{
    return $this->appointments()
        ->where('status', 'pending')
        ->orderBy('appointment_date', 'asc')
        ->orderBy('appointment_time', 'asc');
}

// Helper: Get upcoming confirmed appointments
public function upcomingAppointments()
{
    return $this->appointments()
        ->where('status', 'confirmed')
        ->where('appointment_date', '>=', now()->toDateString())
        ->orderBy('appointment_date', 'asc')
        ->orderBy('appointment_time', 'asc');
}

// Helper: Calculate total earnings
public function totalEarnings()
{
    return $this->appointments()
        ->where('payment_status', 'paid')
        ->whereIn('status', ['confirmed', 'completed'])
        ->sum('consultation_fee');
}

public function reviews()
{
    return $this->hasMany(Review::class);
}
}