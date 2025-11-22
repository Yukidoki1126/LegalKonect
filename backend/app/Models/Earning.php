<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Earning extends Model
{
    protected $fillable = [
        'lawyer_id',
        'appointment_id',
        'gross_amount',
        'platform_fee',
        'net_amount',
        'platform_fee_percentage',
        'status',
        'completed_at',
        'refunded_at',
        'notes',
    ];

    protected $casts = [
        'gross_amount' => 'decimal:2',
        'platform_fee' => 'decimal:2',
        'net_amount' => 'decimal:2',
        'platform_fee_percentage' => 'decimal:2',
        'completed_at' => 'datetime',
        'refunded_at' => 'datetime',
    ];

    /**
     * Get the lawyer that owns the earning
     */
    public function lawyer(): BelongsTo
    {
        return $this->belongsTo(Lawyer::class);
    }

    /**
     * Get the appointment associated with the earning
     */
    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    /**
     * Scope to get completed earnings
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    /**
     * Scope to get earnings for a specific lawyer
     */
    public function scopeForLawyer($query, $lawyerId)
    {
        return $query->where('lawyer_id', $lawyerId);
    }
}
