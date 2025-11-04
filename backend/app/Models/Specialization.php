<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Specialization extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'icon',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    // Many-to-many relationship with Lawyers
    public function lawyers()
    {
        return $this->belongsToMany(Lawyer::class, 'lawyer_specializations');
    }

    // Scope for active specializations only
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // Get count of lawyers with this specialization
    public function getLawyerCountAttribute()
    {
        return $this->lawyers()->count();
    }
}