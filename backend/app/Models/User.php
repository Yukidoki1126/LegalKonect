<?php

namespace App\Models;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    // Role constants
    const ROLE_CLIENT = 'client';
    const ROLE_LAWYER = 'lawyer';
    const ROLE_ADMIN = 'admin';
    const ROLE_SUPER_ADMIN = 'super_admin';

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
        'role',
        'last_login_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'location_updated_at' => 'datetime',
        'last_login_at' => 'datetime',
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

    // Role helper methods
    public function isSuperAdmin(): bool
    {
        return $this->role === self::ROLE_SUPER_ADMIN;
    }

    public function isAdmin(): bool
    {
        return in_array($this->role, [self::ROLE_ADMIN, self::ROLE_SUPER_ADMIN]);
    }

    public function isClient(): bool
    {
        return $this->role === self::ROLE_CLIENT;
    }

    public function hasRole(string $role): bool
    {
        return $this->role === $role;
    }

    public function hasAnyRole(array $roles): bool
    {
        return in_array($this->role, $roles);
    }

    public function canManageLawyers(): bool
    {
        return $this->isAdmin();
    }

    public function canManageAdmins(): bool
    {
        return $this->isSuperAdmin();
    }

    public function canManageUsers(): bool
    {
        return $this->isAdmin();
    }

    public function canViewAnalytics(): bool
    {
        return $this->isAdmin();
    }
}