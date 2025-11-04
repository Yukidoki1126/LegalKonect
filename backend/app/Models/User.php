<?php

namespace App\Models;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'profile_picture',
        'latitude',
        'longitude',
        'address',
        'city',
        'province',
        'location_updated_at',
        'status',
        'google_id',
        'avatar',
        'auth_provider',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'location_updated_at' => 'datetime',
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
    ];

    public function lawyer()
    {
        return $this->hasOne(Lawyer::class);
    }

    public function isLawyer()
    {
        return $this->lawyer !== null;
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }

    public function reviews()
{
    return $this->hasMany(Review::class);
}

    public function cases()
    {
        return $this->hasMany(CaseModel::class);
    }
}