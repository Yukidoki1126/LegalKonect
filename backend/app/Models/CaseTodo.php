<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CaseTodo extends Model
{
    use HasFactory;

    protected $fillable = [
        'case_id',
        'title',
        'description',
        'priority',
        'is_completed',
        'completed_at',
        'due_date',
    ];

    protected $casts = [
        'is_completed' => 'boolean',
        'completed_at' => 'datetime',
        'due_date' => 'datetime',
    ];

    protected $appends = ['priority_label', 'status_label'];

    /**
     * Get the case that owns this todo
     */
    public function case()
    {
        return $this->belongsTo(CaseModel::class, 'case_id');
    }

    /**
     * Get priority label
     */
    public function getPriorityLabelAttribute()
    {
        return match($this->priority) {
            'low' => 'Low Priority',
            'medium' => 'Medium Priority',
            'high' => 'High Priority',
            default => 'Medium Priority'
        };
    }

    /**
     * Get status label
     */
    public function getStatusLabelAttribute()
    {
        return $this->is_completed ? 'Completed' : 'Pending';
    }

    /**
     * Scope a query to only include incomplete todos
     */
    public function scopeIncomplete($query)
    {
        return $query->where('is_completed', false);
    }

    /**
     * Scope a query to only include completed todos
     */
    public function scopeCompleted($query)
    {
        return $query->where('is_completed', true);
    }

    /**
     * Scope a query to only include overdue todos
     */
    public function scopeOverdue($query)
    {
        return $query->where('is_completed', false)
                     ->whereNotNull('due_date')
                     ->where('due_date', '<', now());
    }

    /**
     * Mark todo as completed
     */
    public function markAsCompleted()
    {
        $this->update([
            'is_completed' => true,
            'completed_at' => now(),
        ]);
    }

    /**
     * Mark todo as incomplete
     */
    public function markAsIncomplete()
    {
        $this->update([
            'is_completed' => false,
            'completed_at' => null,
        ]);
    }
}
