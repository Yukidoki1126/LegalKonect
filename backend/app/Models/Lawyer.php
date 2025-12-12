<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

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
        'reservation_fee',
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
        'verification_status',
        'ibp_number',
        'roll_of_attorneys_number',
        'prc_license_number',
        'verification_documents',
        'verification_notes',
        'verified_at',
        'verified_by',
        // Payment info fields (for client direct payment)
        'gcash_number',
        'gcash_account_name',
        'gcash_qr_code',
        'bank_name',
        'bank_account_number',
        'bank_account_name',
        'preferred_payout_method',
    ];

    protected $casts = [
        'office_hours' => 'array',
        'office_latitude' => 'decimal:8',
        'office_longitude' => 'decimal:8',
        'hourly_rate' => 'decimal:2',
        'reservation_fee' => 'decimal:2',
        'rating' => 'decimal:2',
        'is_available' => 'boolean',
        'google_calendar_connected' => 'boolean',
        'google_token_expires_at' => 'datetime',
        'verification_documents' => 'array',
        'verified_at' => 'datetime',
        // Encrypted sensitive verification fields
        'ibp_number' => 'encrypted',
        'roll_of_attorneys_number' => 'encrypted',
        'prc_license_number' => 'encrypted',
    ];

    protected $appends = ['profile_photo_url', 'gcash_qr_url'];

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

    // Scope for verified lawyers only
    public function scopeVerified($query)
    {
        return $query->where('verification_status', 'verified');
    }

    // Scope for pending verification
    public function scopePendingVerification($query)
    {
        return $query->where('verification_status', 'pending');
    }

    // Relationship: Admin who verified this lawyer
    public function verifiedBy()
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    // Helper: Check if lawyer is verified
    public function isVerified()
    {
        return $this->verification_status === 'verified';
    }

    // Helper: Check if verification is pending
    public function isPendingVerification()
    {
        return $this->verification_status === 'pending';
    }

    // Helper: Check if verification was rejected
    public function isRejected()
    {
        return $this->verification_status === 'rejected';
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

// Earnings relationships
public function earnings()
{
    return $this->hasMany(Earning::class);
}

// Payouts relationships
public function payouts()
{
    return $this->hasMany(Payout::class);
}

// Helper: Get available balance (completed earnings - paid payouts)
public function getAvailableBalanceAttribute()
{
    $totalEarnings = $this->earnings()
        ->where('status', 'completed')
        ->sum('net_amount');

    $totalPayouts = $this->payouts()
        ->whereIn('status', ['approved', 'processing', 'paid'])
        ->sum('amount');

    return max(0, $totalEarnings - $totalPayouts);
}

// Helper: Get total platform fees
public function getTotalPlatformFeesAttribute()
{
    return $this->earnings()
        ->where('status', 'completed')
        ->sum('platform_fee');
}

// Helper: Get total earnings (net amount)
public function getTotalNetEarningsAttribute()
{
    return $this->earnings()
        ->where('status', 'completed')
        ->sum('net_amount');
}

// Helper: Get pending payout requests
public function getPendingPayoutsAttribute()
{
    return $this->payouts()
        ->where('status', 'pending')
        ->sum('amount');
}

// Helper: Get profile photo URL
public function getProfilePhotoUrlAttribute()
{
    if (!$this->profile_photo) {
        return null;
    }
    
    $disk = env('FILESYSTEM_DISK', 'public');
    
    // For R2 storage, construct the full public URL
    if ($disk === 'r2' || $disk === 'r2-private') {
        $publicUrl = env('R2_PUBLIC_URL');
        if ($publicUrl) {
            $publicUrl = rtrim($publicUrl, '/');
            $path = ltrim($this->profile_photo, '/');
            return $publicUrl . '/' . $path;
        }
    }
    
    return Storage::disk($disk)->url($this->profile_photo);
}

// Helper: Get GCash QR URL
public function getGcashQrUrlAttribute()
{
    if (!$this->gcash_qr_code) {
        return null;
    }
    
    $disk = env('FILESYSTEM_DISK', 'public');
    
    // For R2 storage, construct the full public URL
    if ($disk === 'r2' || $disk === 'r2-private') {
        $publicUrl = env('R2_PUBLIC_URL');
        if ($publicUrl) {
            $publicUrl = rtrim($publicUrl, '/');
            $path = ltrim($this->gcash_qr_code, '/');
            return $publicUrl . '/' . $path;
        }
    }
    
    return Storage::disk($disk)->url($this->gcash_qr_code);
}
}