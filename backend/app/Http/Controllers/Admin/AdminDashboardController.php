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
        $totalUsers = User::whereNotIn('role', ['admin', 'super_admin'])->count();
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

        $totalReservationFees = Appointment::join('lawyers', 'appointments.lawyer_id', '=', 'lawyers.id')
            ->where('appointments.payment_status', 'paid')
            ->selectRaw('SUM(COALESCE(lawyers.reservation_fee, 100)) as total')
            ->value('total') ?? 0;

        // Platform revenue is the percentage we keep
        $totalAmount = $totalReservationFees * ($platformFeePercentage / 100);

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
                'total_revenue' => $totalReservationFees,
                'platform_fees' => $totalAmount,
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
                 ->selectRaw('CAST(created_at AS DATE) as date, SUM(consultation_fee) as amount')
                 ->groupBy(DB::raw('CAST(created_at AS DATE)'))
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
        $days = $request->input('days', 30);
        $startDate = now()->subDays($days);
        $cacheKey = "descriptive_analytics_{$days}";
        
        // Cache for 5 minutes to improve performance
        return \Cache::remember($cacheKey, 300, function () use ($days, $startDate) {
        // Most requested legal expertise (by case type)
        // Priority: 1. Lawyer-confirmed specialization, 2. Client-selected specialization, 3. Lawyer's primary specialization
        $topSpecializations = DB::table('appointments')
            ->join('lawyers', 'appointments.lawyer_id', '=', 'lawyers.id')
            ->leftJoin('specializations as confirmed_spec', 'appointments.confirmed_specialization_id', '=', 'confirmed_spec.id')
            ->leftJoin('specializations as client_spec', 'appointments.specialization_id', '=', 'client_spec.id')
            ->leftJoinSub(
                // Subquery: Get the first specialization for each lawyer (fallback)
                DB::table('lawyer_specializations as ls1')
                    ->select('ls1.lawyer_id', 'ls1.specialization_id')
                    ->whereNotExists(function ($query) {
                        $query->select(DB::raw(1))
                            ->from('lawyer_specializations as ls2')
                            ->whereColumn('ls2.lawyer_id', 'ls1.lawyer_id')
                            ->whereRaw('ls2.id < ls1.id');
                    }),
                'primary_spec',
                'lawyers.id',
                '=',
                'primary_spec.lawyer_id'
            )
            ->leftJoin('specializations as fallback_spec', 'primary_spec.specialization_id', '=', 'fallback_spec.id')
            ->select(
                DB::raw('COALESCE(confirmed_spec.id, client_spec.id, fallback_spec.id) as id'),
                DB::raw('COALESCE(confirmed_spec.name, client_spec.name, fallback_spec.name) as name'),
                DB::raw('COUNT(*) as appointment_count')
            )
            ->where('appointments.created_at', '>=', $startDate)
            ->whereRaw('COALESCE(confirmed_spec.id, client_spec.id, fallback_spec.id) IS NOT NULL')
            ->groupBy(DB::raw('COALESCE(confirmed_spec.id, client_spec.id, fallback_spec.id)'), DB::raw('COALESCE(confirmed_spec.name, client_spec.name, fallback_spec.name)'))
            ->orderBy('appointment_count', 'desc')
            ->limit(10)
            ->get();
        
        // Appointment trends over time (daily)
        $appointmentTrends = DB::table('appointments')
            ->select(
                DB::raw('CAST(created_at AS DATE) as date'),
                DB::raw('COUNT(*) as total'),
                DB::raw('SUM(CASE WHEN status = \'confirmed\' THEN 1 ELSE 0 END) as confirmed'),
                DB::raw('SUM(CASE WHEN status = \'completed\' THEN 1 ELSE 0 END) as completed'),
                DB::raw('SUM(CASE WHEN status = \'cancelled\' THEN 1 ELSE 0 END) as cancelled')
            )
            ->where('created_at', '>=', $startDate)
            ->groupBy(DB::raw('CAST(created_at AS DATE)'))
            ->orderBy('date', 'asc')
            ->get();
        
        // Peak booking hours
        $peakHours = DB::table('appointments')
            ->select(
                DB::raw('DATEPART(HOUR, created_at) as hour'),
                DB::raw('COUNT(*) as count')
            )
            ->where('created_at', '>=', $startDate)
            ->groupBy(DB::raw('DATEPART(HOUR, created_at)'))
            ->orderBy('count', 'desc')
            ->limit(5)
            ->get();
        
        // Top performing lawyers - FIXED
        $topLawyers = DB::table('appointments')
            ->join('lawyers', 'appointments.lawyer_id', '=', 'lawyers.id')
            ->select(
                'lawyers.first_name',
                'lawyers.last_name',
                'lawyers.rating',
                DB::raw('COUNT(*) as total_appointments'),
                DB::raw('SUM(CASE WHEN appointments.status = \'completed\' THEN 1 ELSE 0 END) as completed_appointments')
            )
            ->where('appointments.created_at', '>=', $startDate)
            ->groupBy('lawyers.id', 'lawyers.first_name', 'lawyers.last_name', 'lawyers.rating')
            ->orderBy('completed_appointments', 'desc')
            ->limit(10)
            ->get();
        
        // Meeting type preferences
        $meetingTypes = DB::table('appointments')
            ->select('meeting_type', DB::raw('COUNT(*) as count'))
            ->where('created_at', '>=', $startDate)
            ->whereNotNull('meeting_type')
            ->groupBy('meeting_type')
            ->get();
        
        // Average consultation fee by primary specialization (to avoid double counting)
        // Average fee by specialization
        // Priority: 1. Lawyer-confirmed specialization, 2. Client-selected specialization, 3. Lawyer's primary specialization
        $avgFeeBySpecialization = DB::table('appointments')
            ->join('lawyers', 'appointments.lawyer_id', '=', 'lawyers.id')
            ->leftJoin('specializations as confirmed_spec', 'appointments.confirmed_specialization_id', '=', 'confirmed_spec.id')
            ->leftJoin('specializations as client_spec', 'appointments.specialization_id', '=', 'client_spec.id')
            ->leftJoinSub(
                // Subquery: Get the first specialization for each lawyer
                DB::table('lawyer_specializations as ls1')
                    ->select('ls1.lawyer_id', 'ls1.specialization_id')
                    ->whereNotExists(function ($query) {
                        $query->select(DB::raw(1))
                            ->from('lawyer_specializations as ls2')
                            ->whereColumn('ls2.lawyer_id', 'ls1.lawyer_id')
                            ->whereRaw('ls2.id < ls1.id');
                    }),
                'primary_spec',
                'lawyers.id',
                '=',
                'primary_spec.lawyer_id'
            )
            ->leftJoin('specializations as fallback_spec', 'primary_spec.specialization_id', '=', 'fallback_spec.id')
            ->select(
                DB::raw('COALESCE(confirmed_spec.id, client_spec.id, fallback_spec.id) as id'),
                DB::raw('COALESCE(confirmed_spec.name, client_spec.name, fallback_spec.name) as name'),
                DB::raw('COALESCE(AVG(appointments.consultation_fee), 0) as avg_fee'),
                DB::raw('MIN(appointments.consultation_fee) as min_fee'),
                DB::raw('MAX(appointments.consultation_fee) as max_fee')
            )
            ->where('appointments.created_at', '>=', $startDate)
            ->whereRaw('COALESCE(confirmed_spec.id, client_spec.id, fallback_spec.id) IS NOT NULL')
            ->groupBy(DB::raw('COALESCE(confirmed_spec.id, client_spec.id, fallback_spec.id)'), DB::raw('COALESCE(confirmed_spec.name, client_spec.name, fallback_spec.name)'))
            ->orderBy('avg_fee', 'desc')
            ->get();
        
        // Client retention rate
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
        
        // Cancellation reasons
        $cancellationReasons = DB::table('appointments')
            ->select('cancellation_reason', DB::raw('COUNT(*) as count'))
            ->where('status', 'cancelled')
            ->where('created_at', '>=', $startDate)
            ->whereNotNull('cancellation_reason')
            ->groupBy('cancellation_reason')
            ->orderBy('count', 'desc')
            ->limit(10)
            ->get();
        
        // Average response time (in minutes)
        $avgResponseTime = DB::table('appointments')
            ->whereIn('status', ['confirmed', 'declined'])
            ->where('created_at', '>=', $startDate)
            ->select(DB::raw('AVG(DATEDIFF(MINUTE, created_at, updated_at)) as avg_minutes'))
            ->first();

        // Total appointments count (accurate, no JOINs)
        $totalAppointments = Appointment::where('created_at', '>=', $startDate)->count();

        // Total verified lawyers count
        $totalLawyers = Lawyer::where('verification_status', 'verified')->count();
        
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
        }); // End cache
    }

    // debug endpoint removed
}