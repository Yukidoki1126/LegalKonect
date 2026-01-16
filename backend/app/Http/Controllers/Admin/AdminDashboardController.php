<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Lawyer;
use App\Models\User;
use App\Models\Admin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminDashboardController extends Controller
{
    public function stats(Request $request)
    {
        $days = (int) $request->input('days', 30);
        $startDate = now()->subDays($days);

        $totalLawyers = Lawyer::count();
        $totalUsers = User::whereNotIn('role', ['admin', 'super_admin', 'lawyer'])->count();
        // Scope appointment stats/revenue to the chosen period to match analytics expectations
        $totalAppointments = Appointment::where('created_at', '>=', $startDate)->count();
        $pendingAppointments = Appointment::where('created_at', '>=', $startDate)->where('status', 'pending')->count();

        // Calculate revenue based on reservation fees from lawyers
        $totalRevenue = Appointment::join('lawyers', 'appointments.lawyer_id', '=', 'lawyers.id')
            ->where('appointments.payment_status', 'paid')
            ->where('appointments.created_at', '>=', $startDate)
            ->selectRaw('SUM(COALESCE(lawyers.reservation_fee, 100)) as total')
            ->value('total') ?? 0;

        $monthlyRevenue = Appointment::join('lawyers', 'appointments.lawyer_id', '=', 'lawyers.id')
            ->where('appointments.payment_status', 'paid')
            ->whereMonth('appointments.created_at', now()->month)
            ->whereYear('appointments.created_at', now()->year)
            ->selectRaw('SUM(COALESCE(lawyers.reservation_fee, 100)) as total')
            ->value('total') ?? 0;

        // Get recent appointments
        $recentAppointments = Appointment::with(['user', 'lawyer'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($appointment) {
                return [
                    'id' => $appointment->id,
                    'client_name' => $appointment->user->name ?? 'Unknown',
                    'lawyer_name' => $appointment->lawyer
                        ? $appointment->lawyer->first_name . ' ' . $appointment->lawyer->last_name
                        : 'Unknown Lawyer',
                    'appointment_date' => $appointment->appointment_date,
                    'status' => $appointment->status,
                ];
            });

        // debug log removed

        // Get additional system overview metrics
        $activeLawyers = Lawyer::where('is_available', true)
            ->where('status', 'approved')
            ->count();
        
        $activeUsers = User::whereHas('appointments')->count();
        
        // Calculate average lawyer rating from reviews
        $averageRating = DB::table('reviews')
            ->whereNotNull('rating')
            ->avg('rating') ?? 0;

        return response()->json([
            'total_users' => $totalUsers,
            'total_lawyers' => $totalLawyers,
            'total_appointments' => $totalAppointments,
            'pending_appointments' => $pendingAppointments,
            'total_revenue' => $totalRevenue,
            'monthly_revenue' => $monthlyRevenue,
            'period_days' => $days,
            'recent_appointments' => $recentAppointments,
            'active_lawyers' => $activeLawyers,
            'active_users' => $activeUsers,
            'average_rating' => round($averageRating, 1),
        ]);
    }

    public function lawyers()
    {
        $lawyers = Lawyer::with(['user', 'specializations'])
            ->orderBy('created_at', 'desc')
            ->get();

        // Transform the data to match frontend expectations
        $transformedLawyers = $lawyers->map(function ($lawyer) {
            return [
                'id' => $lawyer->id,
                'name' => $lawyer->first_name . ' ' . $lawyer->last_name,
                'email' => $lawyer->user->email ?? null,
                'specialization' => $lawyer->specializations->pluck('name')->join(', '),
                'status' => $lawyer->status,
                'verification_status' => $lawyer->verification_status,
                'is_available' => $lawyer->is_available,
                'consultation_fee' => $lawyer->hourly_rate,
                'total_appointments' => $lawyer->appointments()->count(),
                'created_at' => $lawyer->created_at,
            ];
        });

        return response()->json(['lawyers' => $transformedLawyers]);
    }

    public function appointments(Request $request)
    {
        $perPage = $request->get('per_page', 15);
        
        $appointments = Appointment::with(['user', 'lawyer.user'])
            ->orderBy('appointment_date', 'desc')
            ->paginate($perPage);

        // Get stats for all appointments (not just current page)
        $stats = [
            'total' => Appointment::count(),
            'pending' => Appointment::where('status', 'pending')->count(),
            'confirmed' => Appointment::where('status', 'confirmed')->count(),
            'completed' => Appointment::where('status', 'completed')->count(),
            'cancelled' => Appointment::where('status', 'cancelled')->count(),
        ];

        $appointments->getCollection()->transform(function ($appointment) {
            return [
                'id' => $appointment->id,
                'client_name' => $appointment->user ? $appointment->user->name : 'Unknown',
                'client_email' => $appointment->user ? $appointment->user->email : 'N/A',
                'lawyer_name' => $appointment->lawyer
                    ? $appointment->lawyer->first_name . ' ' . $appointment->lawyer->last_name
                    : 'Unknown Lawyer',
                'appointment_date' => $appointment->appointment_date,
                'time_slot' => $appointment->appointment_time,
                'status' => $appointment->status,
                'payment_status' => $appointment->payment_status,
                'payment_method' => $appointment->payment_method,
                'consultation_fee' => $appointment->consultation_fee,
                'meeting_type' => $appointment->meeting_type,
                'created_at' => $appointment->created_at,
            ];
        });

        return response()->json([
            'data' => $appointments->items(),
            'current_page' => $appointments->currentPage(),
            'last_page' => $appointments->lastPage(),
            'per_page' => $appointments->perPage(),
            'total' => $appointments->total(),
            'stats' => $stats,
        ]);
    }

    public function users(Request $request)
    {
        $users = User::with('lawyer')
            ->withCount('appointments')
            ->whereNotIn('role', ['admin', 'super_admin']) // Exclude admin users
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($user) {
                // Also count appointments via lawyer if user is a lawyer
                $lawyerAppointments = 0;
                if ($user->lawyer) {
                    $lawyerAppointments = Appointment::where('lawyer_id', $user->lawyer->id)->count();
                }

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'status' => $user->status,
                    'is_lawyer' => $user->role === 'lawyer', // Use role field instead of lawyer relationship
                    'lawyer_id' => $user->lawyer ? $user->lawyer->id : null,
                    'total_appointments' => $user->lawyer ? $lawyerAppointments : $user->appointments_count,
                    'created_at' => $user->created_at,
                    'updated_at' => $user->updated_at,
                ];
            });

        return response()->json([
            'data' => $users,
            'total' => $users->count(),
            'current_page' => 1,
            'last_page' => 1,
            'per_page' => $users->count()
        ]);
    }

    public function payments(Request $request)
    {
        $perPage = $request->input('per_page', 15);
        $page = $request->input('page', 1);

        // Show all appointments (not just paid ones)
        $payments = Appointment::with(['user', 'lawyer'])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        // Get all summary statistics in a single query (still only count paid for stats)
        $platformFeePercentage = config('app.platform_fee_percentage', 10.00);
        
        $summary = Appointment::where('payment_status', 'paid')
            ->selectRaw('
                COUNT(*) as total_payments,
                SUM(CASE WHEN payment_method_used = \'bank\' THEN 1 ELSE 0 END) as card_payments,
                SUM(CASE WHEN payment_method_used = \'gcash\' THEN 1 ELSE 0 END) as gcash_payments
            ')
            ->first();
        
        // Also count total appointments for display
        $totalAppointments = Appointment::count();

        // Calculate total amount from all appointments (both paid and unpaid)
        $totalAmount = Appointment::join('lawyers', 'appointments.lawyer_id', '=', 'lawyers.id')
            ->selectRaw('SUM(COALESCE(lawyers.reservation_fee, 100)) as total')
            ->value('total') ?? 0;
        
        // Count paid amounts
        $paidAmount = Appointment::join('lawyers', 'appointments.lawyer_id', '=', 'lawyers.id')
            ->where('appointments.payment_status', 'paid')
            ->selectRaw('SUM(COALESCE(lawyers.reservation_fee, 100)) as total')
            ->value('total') ?? 0;
            
        // Count unpaid amounts
        $pendingAmount = Appointment::join('lawyers', 'appointments.lawyer_id', '=', 'lawyers.id')
            ->where('appointments.payment_status', 'unpaid')
            ->selectRaw('SUM(COALESCE(lawyers.reservation_fee, 100)) as total')
            ->value('total') ?? 0;

        // Transform the data - show platform fee (what platform earns)
        $paymentsData = $payments->map(function ($appointment) use ($platformFeePercentage) {
            $reservationFee = $appointment->lawyer->reservation_fee ?? 100;
            $platformFee = $reservationFee * ($platformFeePercentage / 100);

            return [
                'id' => $appointment->id,
                'client_name' => $appointment->user->name ?? 'Unknown',
                'lawyer_name' => $appointment->lawyer
                    ? $appointment->lawyer->first_name . ' ' . $appointment->lawyer->last_name
                    : 'Unknown',
                'amount' => $reservationFee,
                'platform_fee' => $platformFee,
                'payment_method' => $appointment->payment_method_used ?? $appointment->payment_method ?? 'pending',
                'payment_status' => $appointment->payment_status,
                'payment_reference' => $appointment->payment_reference,
                'payment_date' => $appointment->created_at,
                'created_at' => $appointment->created_at
            ];
        });

        // debug log removed

        return response()->json([
            'payments' => [
                'data' => $paymentsData,
                'current_page' => $payments->currentPage(),
                'last_page' => $payments->lastPage(),
                'per_page' => $payments->perPage(),
                'total' => $payments->total()
            ],
            'summary' => [
                'total_payments' => $totalAppointments,
                'paid_payments' => $summary->total_payments ?? 0,
                'total_amount' => $totalAmount,
                'paid_amount' => $paidAmount,
                'pending_amount' => $pendingAmount,
                'card_payments' => $summary->card_payments ?? 0,
                'gcash_payments' => $summary->gcash_payments ?? 0
            ]
        ]);
    }

     public function analytics(Request $request)
    {
         $days = (int) $request->input('days', 30);
         $cacheKey = "analytics_{$days}";
         
         // Cache for 2 minutes
         return \Cache::remember($cacheKey, 120, function () use ($days) {
             $startDate = now()->subDays($days);

             $revenueData = Appointment::where('payment_status', 'paid')
                 ->where('created_at', '>=', $startDate)
                 ->selectRaw('DATE(created_at) as date, SUM(consultation_fee) as amount')
                 ->groupBy(DB::raw('DATE(created_at)'))
                 ->orderBy('date')
                 ->get();

        // Appointment statistics - single aggregated query
        $appointmentStats = Appointment::where('created_at', '>=', $startDate)
            ->selectRaw('
                COUNT(*) as total,
                SUM(CASE WHEN status = \'confirmed\' THEN 1 ELSE 0 END) as confirmed,
                SUM(CASE WHEN status = \'completed\' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = \'cancelled\' THEN 1 ELSE 0 END) as cancelled,
                SUM(CASE WHEN status = \'pending\' THEN 1 ELSE 0 END) as pending
            ')
            ->first();

        // Lawyer statistics - single aggregated query
        $lawyerStats = Lawyer::selectRaw('
                COUNT(*) as total,
                SUM(CASE WHEN is_available = 1 THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN status = \'approved\' THEN 1 ELSE 0 END) as approved,
                SUM(CASE WHEN status = \'pending\' THEN 1 ELSE 0 END) as pending
            ')
            ->first();

        // User statistics - single aggregated query
        $userStats = User::selectRaw('
                COUNT(*) as total,
                SUM(CASE WHEN MONTH(created_at) = ? AND YEAR(created_at) = ? THEN 1 ELSE 0 END) as new_this_month
            ', [now()->month, now()->year])
            ->first();

        // Total revenue (period)
        $totalRevenue = Appointment::where('payment_status', 'paid')
            ->where('created_at', '>=', $startDate)
            ->sum('consultation_fee');

        return response()->json([
            'revenue' => [
                'daily' => $revenueData,
                'total' => $totalRevenue
            ],
            'appointments' => [
                'total' => $appointmentStats->total ?? 0,
                'confirmed' => $appointmentStats->confirmed ?? 0,
                'completed' => $appointmentStats->completed ?? 0,
                'cancelled' => $appointmentStats->cancelled ?? 0,
                'pending' => $appointmentStats->pending ?? 0
            ],
            'lawyers' => [
                'total' => $lawyerStats->total ?? 0,
                'active' => $lawyerStats->active ?? 0,
                'approved' => $lawyerStats->approved ?? 0,
                'pending' => $lawyerStats->pending ?? 0
            ],
            'users' => [
                'total' => $userStats->total ?? 0,
                'new_this_month' => $userStats->new_this_month ?? 0
            ],
            'period_days' => $days
        ]);
        }); // End cache
    }

    public function toggleAvailability($id)
    {
        $lawyer = Lawyer::findOrFail($id);
        $lawyer->is_available = !$lawyer->is_available;
        $lawyer->save();

        // Clear the lawyers list cache so clients see the update immediately
        \Cache::forget('lawyers_list_v1');

        return response()->json([
            'message' => 'Availability updated successfully',
            'lawyer' => $lawyer
        ]);
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:pending,approved,suspended,rejected'
        ]);

        $lawyer = Lawyer::findOrFail($id);
        $lawyer->status = $request->status;
        $lawyer->save();

        return response()->json([
            'message' => 'Status updated successfully',
            'lawyer' => $lawyer
        ]);
    }

    public function deleteLawyer($id)
    {
        $lawyer = Lawyer::findOrFail($id);
        $lawyer->delete();

        return response()->json([
            'message' => 'Lawyer deleted successfully'
        ]);
    }

    public function suspendUser($id)
    {
        $user = User::findOrFail($id);
        $user->status = 'suspended';
        $user->save();

        return response()->json([
            'message' => 'User suspended successfully',
            'user' => $user
        ]);
    }

    public function activateUser($id)
    {
        $user = User::findOrFail($id);
        $user->status = 'active';
        $user->save();

        return response()->json([
            'message' => 'User activated successfully',
            'user' => $user
        ]);
    }

    public function deleteUser($id)
    {
        $user = User::findOrFail($id);
        $user->delete();

        return response()->json([
            'message' => 'User deleted successfully'
        ]);
    }

    public function descriptiveAnalytics(Request $request)
    {
        try {
            $days = $request->input('days', 30);
            $startDate = now()->subDays($days);
            
            \Log::info('Starting descriptive analytics', ['days' => $days, 'startDate' => $startDate]);
            
            // Top specializations - use confirmed_specialization_id if available, otherwise specialization_id
            try {
                $topSpecializations = DB::table('appointments')
                    ->join('specializations', function($join) {
                        $join->on('specializations.id', '=', DB::raw('COALESCE(appointments.confirmed_specialization_id, appointments.specialization_id)'));
                    })
                    ->select('specializations.id', 'specializations.name', DB::raw('COUNT(*) as appointment_count'))
                    ->where('appointments.created_at', '>=', $startDate)
                    ->where(function($query) {
                        $query->whereNotNull('appointments.specialization_id')
                              ->orWhereNotNull('appointments.confirmed_specialization_id');
                    })
                    ->groupBy('specializations.id', 'specializations.name')
                    ->orderBy('appointment_count', 'desc')
                    ->limit(10)
                    ->get();
                \Log::info('Top specializations query success', [
                    'count' => $topSpecializations->count(),
                    'data' => $topSpecializations,
                    'total_appointments' => DB::table('appointments')->where('created_at', '>=', $startDate)->count(),
                    'with_specialization' => DB::table('appointments')
                        ->where('created_at', '>=', $startDate)
                        ->where(function($q) {
                            $q->whereNotNull('specialization_id')->orWhereNotNull('confirmed_specialization_id');
                        })->count()
                ]);
            } catch (\Exception $e) {
                \Log::error('Top specializations query failed: ' . $e->getMessage());
                $topSpecializations = collect([]);
            }
            
            // Appointment trends - simplified (PostgreSQL compatible)
            try {
                $appointmentTrends = DB::table('appointments')
                    ->select(
                        DB::raw('DATE(created_at) as date'),
                        DB::raw('COUNT(*) as total'),
                        DB::raw("SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed"),
                        DB::raw("SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed"),
                        DB::raw("SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled")
                    )
                    ->where('created_at', '>=', $startDate)
                    ->groupBy(DB::raw('DATE(created_at)'))
                    ->orderBy('date', 'asc')
                    ->get();
                \Log::info('Appointment trends query success', ['count' => $appointmentTrends->count(), 'data' => $appointmentTrends]);
            } catch (\Exception $e) {
                \Log::error('Appointment trends query failed: ' . $e->getMessage());
                $appointmentTrends = collect([]);
            }
            
            // Peak hours - based on appointment_time (PostgreSQL compatible - use EXTRACT)
            try {
                $peakHours = DB::table('appointments')
                    ->select(
                        DB::raw('EXTRACT(HOUR FROM appointment_time::time) as hour'),
                        DB::raw('COUNT(*) as count')
                    )
                    ->where('created_at', '>=', $startDate)
                    ->whereNotNull('appointment_time')
                    ->groupBy(DB::raw('EXTRACT(HOUR FROM appointment_time::time)'))
                    ->orderBy('count', 'desc')
                    ->limit(5)
                    ->get();
                \Log::info('Peak hours query success', ['count' => $peakHours->count(), 'data' => $peakHours]);
            } catch (\Exception $e) {
                \Log::error('Peak hours query failed: ' . $e->getMessage());
                $peakHours = collect([]);
            }
            
            // Top lawyers (PostgreSQL compatible - use single quotes)
            try {
                $topLawyers = DB::table('appointments')
                    ->join('lawyers', 'appointments.lawyer_id', '=', 'lawyers.id')
                    ->select(
                        'lawyers.id',
                        'lawyers.first_name',
                        'lawyers.last_name',
                        'lawyers.rating',
                        DB::raw('COUNT(*) as total_appointments'),
                        DB::raw("SUM(CASE WHEN appointments.status = 'completed' THEN 1 ELSE 0 END) as completed_appointments")
                    )
                    ->where('appointments.created_at', '>=', $startDate)
                    ->groupBy('lawyers.id', 'lawyers.first_name', 'lawyers.last_name', 'lawyers.rating')
                    ->orderBy('completed_appointments', 'desc')
                    ->limit(10)
                    ->get();
                \Log::info('Top lawyers query success', ['count' => $topLawyers->count()]);
            } catch (\Exception $e) {
                \Log::error('Top lawyers query failed: ' . $e->getMessage());
                $topLawyers = collect([]);
            }
            
            // Meeting types
            try {
                $meetingTypes = DB::table('appointments')
                    ->select('meeting_type', DB::raw('COUNT(*) as count'))
                    ->where('created_at', '>=', $startDate)
                    ->whereNotNull('meeting_type')
                    ->groupBy('meeting_type')
                    ->get();
                \Log::info('Meeting types query success', ['count' => $meetingTypes->count(), 'data' => $meetingTypes]);
            } catch (\Exception $e) {
                \Log::error('Meeting types query failed: ' . $e->getMessage());
                $meetingTypes = collect([]);
            }
            
            // Average fee by specialization - use confirmed or original specialization
            try {
                $avgFeeBySpecialization = DB::table('appointments')
                    ->join('specializations', function($join) {
                        $join->on('specializations.id', '=', DB::raw('COALESCE(appointments.confirmed_specialization_id, appointments.specialization_id)'));
                    })
                    ->select(
                        'specializations.id',
                        'specializations.name',
                        DB::raw('AVG(appointments.consultation_fee) as avg_fee'),
                        DB::raw('MIN(appointments.consultation_fee) as min_fee'),
                        DB::raw('MAX(appointments.consultation_fee) as max_fee')
                    )
                    ->where('appointments.created_at', '>=', $startDate)
                    ->where(function($query) {
                        $query->whereNotNull('appointments.specialization_id')
                              ->orWhereNotNull('appointments.confirmed_specialization_id');
                    })
                    ->whereNotNull('appointments.consultation_fee')
                    ->groupBy('specializations.id', 'specializations.name')
                    ->orderBy('avg_fee', 'desc')
                    ->get();
                \Log::info('Avg fee query success', ['count' => $avgFeeBySpecialization->count()]);
            } catch (\Exception $e) {
                \Log::error('Avg fee query failed: ' . $e->getMessage());
                $avgFeeBySpecialization = collect([]);
            }
            
            // Client retention
            try {
                $repeatClients = DB::table('appointments')
                    ->select('user_id', DB::raw('COUNT(*) as appointment_count'))
                    ->where('created_at', '>=', $startDate)
                    ->groupBy('user_id')
                    ->having(DB::raw('COUNT(*)'), '>', 1)
                    ->count();
                
                $totalClients = DB::table('appointments')
                    ->where('created_at', '>=', $startDate)
                    ->distinct('user_id')
                    ->count('user_id');
                
                $retentionRate = $totalClients > 0 ? round(($repeatClients / $totalClients) * 100, 1) : 0;
                \Log::info('Client retention query success', ['repeat' => $repeatClients, 'total' => $totalClients]);
            } catch (\Exception $e) {
                \Log::error('Client retention query failed: ' . $e->getMessage());
                $repeatClients = 0;
                $totalClients = 0;
                $retentionRate = 0;
            }
            
            // Cancellation reasons
            try {
                $cancellationReasons = DB::table('appointments')
                    ->select('cancellation_reason', DB::raw('COUNT(*) as count'))
                    ->where('status', 'cancelled')
                    ->where('created_at', '>=', $startDate)
                    ->whereNotNull('cancellation_reason')
                    ->groupBy('cancellation_reason')
                    ->orderBy('count', 'desc')
                    ->limit(10)
                    ->get();
                \Log::info('Cancellation reasons query success', ['count' => $cancellationReasons->count()]);
            } catch (\Exception $e) {
                \Log::error('Cancellation reasons query failed: ' . $e->getMessage());
                $cancellationReasons = collect([]);
            }
            
            // Average response time (PostgreSQL compatible)
            try {
                $avgResponseTime = DB::table('appointments')
                    ->whereIn('status', ['confirmed', 'declined'])
                    ->where('created_at', '>=', $startDate)
                    ->whereNotNull('updated_at')
                    ->select(DB::raw('AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 60) as avg_minutes'))
                    ->first();
                \Log::info('Avg response time query success', ['minutes' => $avgResponseTime->avg_minutes ?? 0]);
            } catch (\Exception $e) {
                \Log::error('Avg response time query failed: ' . $e->getMessage());
                $avgResponseTime = (object)['avg_minutes' => 0];
            }
            
            // Counts
            try {
                $totalAppointments = DB::table('appointments')->where('created_at', '>=', $startDate)->count();
                $totalLawyers = DB::table('lawyers')->where('status', 'approved')->count();
                \Log::info('Counts query success', ['appointments' => $totalAppointments, 'lawyers' => $totalLawyers]);
            } catch (\Exception $e) {
                \Log::error('Counts query failed: ' . $e->getMessage());
                $totalAppointments = 0;
                $totalLawyers = 0;
            }
            
            \Log::info('Descriptive analytics completed successfully');
            
            return response()->json([
                'top_specializations' => $topSpecializations,
                'appointment_trends' => $appointmentTrends,
                'peak_hours' => $peakHours,
                'top_lawyers' => $topLawyers,
                'meeting_types' => $meetingTypes,
                'avg_fee_by_specialization' => $avgFeeBySpecialization,
                'retention_rate' => $retentionRate,
                'total_clients' => $totalClients,
                'total_lawyers' => $totalLawyers,
                'repeat_clients' => $repeatClients,
                'cancellation_reasons' => $cancellationReasons,
                'avg_response_time_minutes' => round($avgResponseTime->avg_minutes ?? 0, 1),
                'period_days' => $days,
                'total_appointments' => $totalAppointments,
            ]);
        } catch (\Exception $e) {
            \Log::error('Descriptive analytics error: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'error' => 'Failed to load analytics',
                'message' => $e->getMessage(),
                'line' => $e->getLine(),
                'file' => $e->getFile()
            ], 500);
        }
    }

    // Debug endpoint to check appointment data
    public function debugAppointments(Request $request)
    {
        try {
            $days = $request->input('days', 30);
            $startDate = now()->subDays($days);

            // Get raw appointment data with both specialization columns
            $appointments = DB::table('appointments')
                ->select(
                    'id',
                    'specialization_id',
                    'confirmed_specialization_id',
                    'appointment_date',
                    'appointment_time',
                    'status',
                    'meeting_type',
                    'created_at'
                )
                ->where('created_at', '>=', $startDate)
                ->get();

            // Get specializations
            $specializations = DB::table('specializations')
                ->select('id', 'name')
                ->get()
                ->keyBy('id');

            // Check appointments with both specialization types
            $appointmentsWithSpec = DB::table('appointments as a')
                ->leftJoin('specializations as s1', 'a.specialization_id', '=', 's1.id')
                ->leftJoin('specializations as s2', 'a.confirmed_specialization_id', '=', 's2.id')
                ->select(
                    'a.id',
                    'a.specialization_id',
                    's1.name as original_specialization_name',
                    'a.confirmed_specialization_id',
                    's2.name as confirmed_specialization_name',
                    'a.appointment_date',
                    'a.appointment_time',
                    'a.status',
                    DB::raw('COALESCE(a.confirmed_specialization_id, a.specialization_id) as effective_specialization_id'),
                    DB::raw('COALESCE(s2.name, s1.name) as effective_specialization_name')
                )
                ->where('a.created_at', '>=', $startDate)
                ->get();

            return response()->json([
                'total_appointments' => $appointments->count(),
                'appointments_raw' => $appointments,
                'specializations' => $specializations,
                'appointments_with_specializations' => $appointmentsWithSpec,
                'start_date' => $startDate->toDateTimeString(),
                'now' => now()->toDateTimeString(),
                'summary' => [
                    'with_original_spec' => $appointments->whereNotNull('specialization_id')->count(),
                    'with_confirmed_spec' => $appointments->whereNotNull('confirmed_specialization_id')->count(),
                    'without_any_spec' => $appointments->filter(function($a) {
                        return $a->specialization_id === null && $a->confirmed_specialization_id === null;
                    })->count()
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }

    // debug endpoint removed
}
