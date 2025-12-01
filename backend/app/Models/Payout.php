<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payout extends Model
{
    protected $fillable = [
        'lawyer_id',
        'amount',
        'payout_method',
        'payout_account_number',
        'payout_account_name',
        'bank_name',
        'status',
        'requested_at',
        'approved_at',
        'paid_at',
        'rejected_at',
        'processed_by',
        'admin_notes',
        'rejection_reason',
        'transaction_reference',
        'payment_proof',
        'payment_confirmed_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'requested_at' => 'datetime',
        'approved_at' => 'datetime',
        'paid_at' => 'datetime',
        'rejected_at' => 'datetime',
        'payment_confirmed_at' => 'datetime',
    ];

    protected $appends = ['payment_proof_url'];

    /**
     * Get the payment proof URL
     */
    public function getPaymentProofUrlAttribute()
    {
        if ($this->payment_proof) {
            return asset('storage/' . $this->payment_proof);
        }
        return null;
    }

    /**
     * Get the lawyer that requested the payout
     */
    public function lawyer(): BelongsTo
    {
        return $this->belongsTo(Lawyer::class);
    }

    /**
     * Get the admin who processed the payout
     */
    public function processedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    /**
     * Scope to get pending payouts
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope to get approved payouts
     */
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    /**
     * Scope to get paid payouts
     */
    public function scopePaid($query)
    {
        return $query->where('status', 'paid');
    }

    /**
     * Scope to get payouts for a specific lawyer
     */
    public function scopeForLawyer($query, $lawyerId)
    {
        return $query->where('lawyer_id', $lawyerId);
    }
}
