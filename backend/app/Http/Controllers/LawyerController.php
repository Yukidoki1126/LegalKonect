<?php

namespace App\Http\Controllers;

use App\Models\Lawyer;
use App\Models\Specialization;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use App\Services\LawyerVerificationService;
use App\Services\EncryptionService;

class LawyerController extends Controller
{
    // Get all approved lawyers
    public function index(Request $request)
    {
        // Cache the lawyers list for 5 minutes to speed up repeated requests
        $cacheKey = 'lawyers_list_v1';
        $cacheDuration = 300; // 5 minutes

        $data = \Cache::remember($cacheKey, $cacheDuration, function () {
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
                    'office_latitude' => $lawyer->office_latitude,
                    'office_longitude' => $lawyer->office_longitude,
                    'created_at' => $lawyer->created_at,
                ];
            });

            return [
                'lawyers' => $transformedLawyers,
                'total' => $transformedLawyers->count()
            ];
        });

        return response()->json($data);
    }

    // Get single lawyer profile
    public function show($id)
    {
        $lawyer = Lawyer::with(['user', 'specializations'])
            ->approved()
            ->findOrFail($id);

        // Build payment methods for clients
        $paymentMethods = [];
        if ($lawyer->gcash_number) {
            $paymentMethods['gcash'] = [
                'number' => $lawyer->gcash_number,
                'account_name' => $lawyer->gcash_account_name,
                'qr_code' => $lawyer->gcash_qr_code ? \Storage::url($lawyer->gcash_qr_code) : null,
            ];
        }
        if ($lawyer->bank_account_number) {
            $paymentMethods['bank'] = [
                'bank_name' => $lawyer->bank_name,
                'account_number' => $lawyer->bank_account_number,
                'account_name' => $lawyer->bank_account_name,
            ];
        }

        // Ensure all fields including coordinates are returned
        $transformedLawyer = [
            'id' => $lawyer->id,
            'user_id' => $lawyer->user_id,
            'first_name' => $lawyer->first_name,
            'last_name' => $lawyer->last_name,
            'bio' => $lawyer->bio,
            'profile_photo' => $lawyer->profile_photo,
            'license_number' => $lawyer->license_number,
            'years_experience' => $lawyer->years_experience,
            'hourly_rate' => $lawyer->hourly_rate,
            'reservation_fee' => $lawyer->reservation_fee ?? 100.00,
            'office_address' => $lawyer->office_address,
            'office_phone' => $lawyer->office_phone,
            'office_latitude' => $lawyer->office_latitude,
            'office_longitude' => $lawyer->office_longitude,
            'is_approved' => $lawyer->status === 'approved',
            'status' => $lawyer->status,
            'is_available' => $lawyer->is_available,
            'rating' => $lawyer->rating ?? 0,
            'total_reviews' => $lawyer->total_reviews ?? 0,
            'user' => $lawyer->user,
            'specializations' => $lawyer->specializations,
            // Payment information for clients (direct payment)
            'payment_methods' => $paymentMethods,
            'preferred_payment_method' => $lawyer->preferred_payout_method,
            'has_payment_info' => !empty($paymentMethods),
        ];

        return response()->json([
            'lawyer' => $transformedLawyer
        ]);
    }

    // Get all specializations
    public function specializations()
    {
        // Cache specializations for 10 minutes (changes infrequently)
        $cacheKey = 'specializations_list_v1';
        $cacheDuration = 600; // 10 minutes

        $data = \Cache::remember($cacheKey, $cacheDuration, function () {
            $specializations = Specialization::active()->get();

            return [
                'specializations' => $specializations
            ];
        });

        return response()->json($data);
    }

    // Add after the specializations() method

public function createProfile(Request $request)
{
    // Cache authenticated user ONCE to avoid Sanctum Guard infinite recursion
    $authenticatedUser = $request->user();

    \Log::info('=== LAWYER PROFILE CREATION STARTED ===', [
        'user_id' => $authenticatedUser->id,
        'has_files' => [
            'ibp_card' => $request->hasFile('ibp_card'),
            'government_id' => $request->hasFile('government_id'),
            'prc_license' => $request->hasFile('prc_license'),
            'good_standing_cert' => $request->hasFile('good_standing_cert'),
        ],
        'app_key_set' => !empty(config('app.key')),
        'storage_path_writable' => is_writable(storage_path('app/private')),
    ]);

    try {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'bio' => 'nullable|string|min:50',
            'license_number' => 'required|string|unique:lawyers',
            'years_experience' => 'required|integer|min:0',
            'hourly_rate' => 'required|numeric|min:0',
            'office_address' => 'required|string',
            'office_phone' => 'nullable|string',
            'office_latitude' => 'nullable|numeric',
            'office_longitude' => 'nullable|numeric',
            'specialization_ids' => 'required|array|min:1',
            'specialization_ids.*' => 'exists:specializations,id',
            // Verification credentials
            'ibp_number' => 'required|string|max:50',
            'roll_of_attorneys_number' => 'nullable|string|max:50',
            'prc_license_number' => 'nullable|string|max:50',
            // Document uploads (20MB limit)
            'ibp_card' => 'required|file|mimes:jpg,jpeg,png,pdf|max:20480',
            'prc_license' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:20480',
            'government_id' => 'required|file|mimes:jpg,jpeg,png,pdf|max:20480',
            'good_standing_cert' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:20480',
        ], [
            'bio.min' => 'Bio must be at least 50 characters if provided.',
            'government_id.max' => 'The government ID file size exceeds 20MB. Please compress or resize your image.',
            'ibp_card.max' => 'The IBP card file size exceeds 20MB. Please compress or resize your image.',
            'prc_license.max' => 'The PRC license file size exceeds 20MB. Please compress or resize your image.',
            'good_standing_cert.max' => 'The certificate file size exceeds 20MB. Please compress or resize your image.',
        ]);
    } catch (\Illuminate\Validation\ValidationException $e) {
        \Log::error('Lawyer registration validation failed', [
            'errors' => $e->errors(),
            'request_data' => $request->except(['ibp_card', 'prc_license', 'government_id', 'good_standing_cert']),
            'files' => [
                'ibp_card' => $request->hasFile('ibp_card') ? 'present' : 'missing',
                'prc_license' => $request->hasFile('prc_license') ? 'present' : 'missing',
                'government_id' => $request->hasFile('government_id') ? 'present' : 'missing',
                'good_standing_cert' => $request->hasFile('good_standing_cert') ? 'present' : 'missing',
            ]
        ]);
        throw $e;
    }

    // Check if user already has a lawyer profile
    if ($authenticatedUser->lawyer) {
        return response()->json([
            'message' => 'User already has a lawyer profile'
        ], 422);
    }

    // Create lawyer profile first
    $lawyer = Lawyer::create([
        'user_id' => $authenticatedUser->id,
        'first_name' => $validated['first_name'],
        'last_name' => $validated['last_name'],
        'bio' => $validated['bio'] ?? null,
        'license_number' => $validated['license_number'],
        'years_experience' => $validated['years_experience'],
        'hourly_rate' => $validated['hourly_rate'],
        'office_address' => $validated['office_address'],
        'office_phone' => $validated['office_phone'] ?? null,
        'office_latitude' => $validated['office_latitude'] ?? 0,
        'office_longitude' => $validated['office_longitude'] ?? 0,
        'status' => 'pending',
        'verification_status' => 'pending',
        'ibp_number' => $validated['ibp_number'],
        'roll_of_attorneys_number' => $validated['roll_of_attorneys_number'] ?? null,
        'prc_license_number' => $validated['prc_license_number'] ?? null,
    ]);

    // Keep the authenticated user's name in sync with the lawyer profile
    try {
        $fullName = trim($validated['first_name'] . ' ' . $validated['last_name']);
        if ($authenticatedUser->name !== $fullName) {
            $authenticatedUser->name = $fullName;
            $authenticatedUser->save();
        }
    } catch (\Exception $e) {
        \Log::warning('Failed to sync user.name after creating lawyer profile', ['user_id' => $authenticatedUser->id, 'error' => $e->getMessage()]);
    }

    // Attach specializations
    $lawyer->specializations()->sync($validated['specialization_ids']);

    // Upload verification documents
    $encryptionService = app(EncryptionService::class);
    $verificationService = new LawyerVerificationService($encryptionService);
    $documents = [];

    if ($request->hasFile('ibp_card')) {
        $documents['ibp_card'] = $request->file('ibp_card');
    }
    if ($request->hasFile('prc_license')) {
        $documents['prc_license'] = $request->file('prc_license');
    }
    if ($request->hasFile('government_id')) {
        $documents['government_id'] = $request->file('government_id');
    }
    if ($request->hasFile('good_standing_cert')) {
        $documents['good_standing_cert'] = $request->file('good_standing_cert');
    }

    \Log::info('Starting document upload', [
        'lawyer_id' => $lawyer->id,
        'document_count' => count($documents),
    ]);

    try {
        $uploadedPaths = $verificationService->uploadVerificationDocuments($documents, $lawyer->id);
        \Log::info('Documents uploaded successfully', ['paths' => $uploadedPaths]);

        // Use direct DB update to avoid triggering model events (prevents infinite recursion with PHP 8.3 + OPcache)
        \DB::table('lawyers')
            ->where('id', $lawyer->id)
            ->update(['verification_documents' => json_encode($uploadedPaths)]);
        \Log::info('Lawyer profile updated with verification documents');
    } catch (\Exception $e) {
        // If document upload fails, delete the lawyer profile and return error
        \Log::error('Document upload failed', [
            'lawyer_id' => $lawyer->id,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
        ]);

        $lawyer->delete();
        return response()->json([
            'message' => 'Failed to upload verification documents',
            'error' => $e->getMessage(),
            'debug' => config('app.debug') ? $e->getTraceAsString() : null,
        ], 500);
    }

    // Return response WITHOUT reloading user (avoids Sanctum Guard recursion)
    return response()->json([
        'message' => 'Lawyer profile created successfully. Your application is pending admin verification.',
        'lawyer' => $lawyer->load('specializations'),
        'user' => [
            'id' => $authenticatedUser->id,
            'name' => $authenticatedUser->name,
            'email' => $authenticatedUser->email,
            'phone' => $authenticatedUser->phone,
            'lawyer' => [
                'id' => $lawyer->id,
                'status' => $lawyer->status,
            ]
        ]
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