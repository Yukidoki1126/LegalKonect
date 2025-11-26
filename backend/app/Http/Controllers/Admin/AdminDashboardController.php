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
        $totalUsers = User::count();
        // Scope appointment stats/revenue to the chosen period to match analytics expectations
        $totalAppointments = Appointment::where('created_at', '>=', $startDate)->count();
        $pendingAppointments = Appointment::where('created_at', '>=', $startDate)->where('status', 'pending')->count();

        $totalRevenue = Appointment::where('payment_status', 'paid')->where('created_at', '>=', $startDate)->sum('consultation_fee');
        $monthlyRevenue = Appointment::where('payment_status', 'paid')
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->sum('consultation_fee');

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

        return response()->json([
            'total_users' => $totalUsers,
            'total_lawyers' => $totalLawyers,
            'total_appointments' => $totalAppointments,
            'pending_appointments' => $pendingAppointments,
            'total_revenue' => $totalRevenue,
            'monthly_revenue' => $monthlyRevenue,
            'period_days' => $days,
            'recent_appointments' => $recentAppointments,
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

    public function appointments()
    {
        $appointments = Appointment::with(['user', 'lawyer.user'])
            ->orderBy('appointment_date', 'desc')
            ->get()
            ->map(function ($appointment) {
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

        return response()->json($appointments);
    }

    public function users(Request $request)
    {
        $users = User::with('lawyer')
            ->where('id', '!=', $request->user()->id) // Exclude currently logged-in admin
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'status' => $user->status,
                    'is_lawyer' => $user->lawyer !== null,
                    'lawyer_id' => $user->lawyer ? $user->lawyer->id : null,
                    'created_at' => $user->created_at,
                    'updated_at' => $user->updated_at,
                ];
            });

        return response()->json($users);
    }

    public function payments(Request $request)
    {
        $perPage = $request->input('per_page', 15);
        $page = $request->input('page', 1);

        $payments = Appointment::with(['user', 'lawyer'])
            ->where('payment_status', 'paid')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        // Get summary statistics - using reservation fee (actual amount received)
        $totalPayments = Appointment::where('payment_status', 'paid')->count();

        // Calculate total amount based on reservation fees actually received
        $totalAmount = Appointment::join('lawyers', 'appointments.lawyer_id', '=', 'lawyers.id')
            ->where('appointments.payment_status', 'paid')
            ->selectRaw('SUM(COALESCE(lawyers.reservation_fee, 100)) as total')
            ->value('total') ?? 0;

        $cardPayments = Appointment::where('payment_status', 'paid')
            ->where('payment_method', 'card')
            ->count();
        $gcashPayments = Appointment::where('payment_status', 'paid')
            ->where('payment_method', 'gcash')
            ->count();

        // Transform the data - show reservation fee (actual amount received)
        $paymentsData = $payments->map(function ($appointment) {
            return [
                'id' => $appointment->id,
                'client_name' => $appointment->user->name ?? 'Unknown',
                'lawyer_name' => $appointment->lawyer
                    ? $appointment->lawyer->first_name . ' ' . $appointment->lawyer->last_name
                    : 'Unknown',
                'amount' => $appointment->lawyer->reservation_fee ?? 100,
                'payment_method' => $appointment->payment_method,
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
                'total_payments' => $totalPayments,
                'total_amount' => $totalAmount,
                'card_payments' => $cardPayments,
                'gcash_payments' => $gcashPayments
            ]
        ]);
    }

     public function analytics(Request $request)
    {
         $days = (int) $request->input('days', 30);
         $startDate = now()->subDays($days);

         $revenueData = Appointment::where('payment_status', 'paid')
     ->where('created_at', '>=', $startDate)
    ->selectRaw('CAST(created_at AS DATE) as date, SUM(consultation_fee) as amount')
    ->groupBy(DB::raw('CAST(created_at AS DATE)'))
    ->orderBy('date')
    ->get();
        // Appointment statistics - scoped to the analytics period
        $totalAppointments = Appointment::where('created_at', '>=', $startDate)->count();
        $confirmedAppointments = Appointment::where('created_at', '>=', $startDate)->where('status', 'confirmed')->count();
        $completedAppointments = Appointment::where('created_at', '>=', $startDate)->where('status', 'completed')->count();
        $cancelledAppointments = Appointment::where('created_at', '>=', $startDate)->where('status', 'cancelled')->count();
        $pendingAppointments = Appointment::where('created_at', '>=', $startDate)->where('status', 'pending')->count();

        // Lawyer statistics
        $totalLawyers = Lawyer::count();
        $activeLawyers = Lawyer::where('is_available', true)->count();
        $approvedLawyers = Lawyer::where('status', 'approved')->count();
        $pendingLawyers = Lawyer::where('status', 'pending')->count();

        // User statistics
        $totalUsers = User::count();
        $newUsersThisMonth = User::whereMonth('created_at', now()->month)->count();

        // Total revenue (period)
        $totalRevenue = Appointment::where('payment_status', 'paid')->where('created_at', '>=', $startDate)->sum('consultation_fee');

        return response()->json([
            'revenue' => [
                'daily' => $revenueData,
                'total' => $totalRevenue
            ],
            'appointments' => [
                'total' => $totalAppointments,
                'confirmed' => $confirmedAppointments,
                'completed' => $completedAppointments,
                'cancelled' => $cancelledAppointments,
                'pending' => $pendingAppointments
            ],
            'lawyers' => [
                'total' => $totalLawyers,
                'active' => $activeLawyers,
                'approved' => $approvedLawyers,
                'pending' => $pendingLawyers
            ],
            'users' => [
                'total' => $totalUsers,
                'new_this_month' => $newUsersThisMonth
            ],
            'period_days' => $days
        ]);
    }

    public function toggleAvailability($id)
    {
        $lawyer = Lawyer::findOrFail($id);
        $lawyer->is_available = !$lawyer->is_available;
        $lawyer->save();

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
        
        // Most requested legal expertise (by specialization) - FIXED
        $topSpecializations = DB::table('appointments')
            ->join('lawyers', 'appointments.lawyer_id', '=', 'lawyers.id')
            ->join('lawyer_specializations', 'lawyers.id', '=', 'lawyer_specializations.lawyer_id')
            ->join('specializations', 'lawyer_specializations.specialization_id', '=', 'specializations.id')
            ->select('specializations.id', 'specializations.name', DB::raw('COUNT(DISTINCT appointments.id) as appointment_count'))
            ->where('appointments.created_at', '>=', $startDate)
            ->groupBy('specializations.id', 'specializations.name')
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
        
        // Average consultation fee by specialization - FIXED
        $avgFeeBySpecialization = DB::table('appointments')
            ->join('lawyers', 'appointments.lawyer_id', '=', 'lawyers.id')
            ->join('lawyer_specializations', 'lawyers.id', '=', 'lawyer_specializations.lawyer_id')
            ->join('specializations', 'lawyer_specializations.specialization_id', '=', 'specializations.id')
            ->select(
                'specializations.id',
                'specializations.name',
                DB::raw('COALESCE(SUM(appointments.consultation_fee) / NULLIF(COUNT(DISTINCT appointments.id),0),0) as avg_fee'),
                DB::raw('MIN(appointments.consultation_fee) as min_fee'),
                DB::raw('MAX(appointments.consultation_fee) as max_fee')
            )
            ->where('appointments.created_at', '>=', $startDate)
            ->groupBy('specializations.id', 'specializations.name')
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
        
        return response()->json([
            'top_specializations' => $topSpecializations,
            'appointment_trends' => $appointmentTrends,
            'peak_hours' => $peakHours,
            'top_lawyers' => $topLawyers,
            'meeting_types' => $meetingTypes,
            'avg_fee_by_specialization' => $avgFeeBySpecialization,
            'retention_rate' => $retentionRate,
            'total_clients' => $totalClients,
            'repeat_clients' => $repeatClients,
            'cancellation_reasons' => $cancellationReasons,
            'avg_response_time_minutes' => round($avgResponseTime->avg_minutes ?? 0, 1),
            'period_days' => $days
        ]);
    }

    // debug endpoint removed
}