<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CaseModel extends Model
{
    use HasFactory;

    protected $table = 'cases';

    protected $fillable = [
        'appointment_id',
        'user_id',
        'lawyer_id',
        'title',
        'description',
        'case_type',
        'status',
        'lawyer_updates',
        'resolution_summary',
        'started_at',
        'closed_at',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'closed_at' => 'datetime',
    ];

    protected $appends = ['status_label', 'progress_percentage'];

    /**
     * Get the appointment associated with this case
     */
    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }

    /**
     * Get the user (client) who owns the case
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the lawyer handling this case
     */
    public function lawyer()
    {
        return $this->belongsTo(Lawyer::class);
    }

    /**
     * Get the todos associated with this case
     */
    public function todos()
    {
        return $this->hasMany(CaseTodo::class, 'case_id');
    }

    /**
     * Get human-readable status label
     */
    public function getStatusLabelAttribute()
    {
        return match($this->status) {
            'pending' => 'Pending',
            'ongoing' => 'Ongoing',
            'closed' => 'Closed',
            default => 'Unknown',
        };
    }

    /**
     * Calculate progress percentage based on status
     */
    public function getProgressPercentageAttribute()
    {
        return match($this->status) {
            'pending' => 33,
            'ongoing' => 66,
            'closed' => 100,
            default => 0,
        };
    }

    /**
     * Scope query to only pending cases
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope query to only ongoing cases
     */
    public function scopeOngoing($query)
    {
        return $query->where('status', 'ongoing');
    }

    /**
     * Scope query to only closed cases
     */
    public function scopeClosed($query)
    {
        return $query->where('status', 'closed');
    }

    /**
     * Scope query for cases handled by a specific lawyer
     */
    public function scopeHandledBy($query, $lawyerId)
    {
        return $query->where('lawyer_id', $lawyerId);
    }
}
