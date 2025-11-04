<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LawyerUnavailableDate extends Model
{
    use HasFactory;

    protected $fillable = [
        'lawyer_id',
        'unavailable_date',
        'reason',
    ];

    protected $casts = [
        'unavailable_date' => 'date',
    ];

    /**
     * Get the lawyer for this unavailable date
     */
    public function lawyer()
    {
        return $this->belongsTo(Lawyer::class);
    }
}