<?php

namespace App\Http\Controllers;

use App\Models\Lawyer;
use App\Models\Specialization;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class LawyerController extends Controller
{
    // Get all approved lawyers
    public function index(Request $request)
    {
        $lawyers = Lawyer::with(['user', 'specializations'])
            ->approved()
            ->available()
            ->get();

        // Transform data to include needed fields
        $transformedLawyers = $lawyers->map(function ($lawyer) {
            return [
                'id' => $lawyer->id,
                'first_name' => $lawyer->first_name,
                'last_name' => $lawyer->last_name,
                'bio' => $lawyer->bio,
                'profile_photo' => $lawyer->profile_photo,
                'specialization' => $lawyer->specializations->pluck('name')->join(', '),
                'specializations' => $lawyer->specializations,
                'status' => $lawyer->status,
                'is_available' => $lawyer->is_available,
                'rating' => $lawyer->rating ?? 0,
                'total_reviews' => $lawyer->total_reviews ?? 0,
                'consultation_fee' => $lawyer->hourly_rate,
                'years_experience' => $lawyer->years_experience,
                'office_address' => $lawyer->office_address,
                'created_at' => $lawyer->created_at,
            ];
        });

        return response()->json([
            'lawyers' => $transformedLawyers,
            'total' => $transformedLawyers->count()
        ]);
    }

    // Get single lawyer profile
    public function show($id)
    {
        $lawyer = Lawyer::with(['user', 'specializations'])
            ->approved()
            ->findOrFail($id);

        return response()->json([
            'lawyer' => $lawyer
        ]);
    }

    // Get all specializations
    public function specializations()
    {
        $specializations = Specialization::active()->get();

        return response()->json([
            'specializations' => $specializations
        ]);
    }

    // Add after the specializations() method

public function createProfile(Request $request)
{
    $validated = $request->validate([
        'first_name' => 'required|string|max:255',
        'last_name' => 'required|string|max:255',
        'bio' => 'required|string|min:50',
        'license_number' => 'required|string|unique:lawyers',
        'years_experience' => 'required|integer|min:0',
        'hourly_rate' => 'required|numeric|min:0',
        'office_address' => 'required|string',
        'office_phone' => 'required|string',
        'office_latitude' => 'nullable|numeric',
        'office_longitude' => 'nullable|numeric',
        'specialization_ids' => 'required|array|min:1',
        'specialization_ids.*' => 'exists:specializations,id'
    ]);

    // Check if user already has a lawyer profile
    if ($request->user()->lawyer) {
        return response()->json([
            'message' => 'User already has a lawyer profile'
        ], 422);
    }

    $lawyer = Lawyer::create([
    'user_id' => $request->user()->id,
    'first_name' => $validated['first_name'],
    'last_name' => $validated['last_name'],
    'bio' => $validated['bio'],
    'license_number' => $validated['license_number'],
    'years_experience' => $validated['years_experience'],
    'hourly_rate' => $validated['hourly_rate'],
    'office_address' => $validated['office_address'],
    'office_phone' => $validated['office_phone'],
    'office_latitude' => $validated['office_latitude'] ?? null,
    'office_longitude' => $validated['office_longitude'] ?? null,
    'status' => 'pending'
]);

    $lawyer->specializations()->sync($validated['specialization_ids']);

    return response()->json([
        'message' => 'Lawyer profile created successfully',
        'lawyer' => $lawyer->load('specializations')
    ], 201);
}

    /**
     * Get unavailable dates for a lawyer
     */
    public function getUnavailableDates($lawyerId, Request $request)
    {
        $lawyer = Lawyer::findOrFail($lawyerId);

        $year = $request->query('year', date('Y'));
        $month = $request->query('month', date('m'));

        // Get all unavailable dates for the specified month
        $unavailableDates = DB::table('lawyer_unavailable_dates')
            ->where('lawyer_id', $lawyer->id)
            ->whereYear('unavailable_date', $year)
            ->whereMonth('unavailable_date', $month)
            ->get(['unavailable_date'])
            ->map(function($record) {
                // Ensure we return only the date part in YYYY-MM-DD format
                $date = $record->unavailable_date;
                if ($date instanceof \DateTime) {
                    $date = $date->format('Y-m-d');
                } else {
                    // If it's a string, extract just the date part
                    $date = substr($date, 0, 10);
                }
                return [
                    'date' => $date
                ];
            });

        return response()->json($unavailableDates);
    }
}