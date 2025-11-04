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
    public function stats()
    {
        $totalLawyers = Lawyer::count();
        $totalUsers = User::count();
        $totalAppointments = Appointment::count();
        $pendingAppointments = Appointment::where('status', 'pending')->count();

        $totalRevenue = Appointment::where('payment_status', 'paid')->sum('consultation_fee');
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

        return response()->json([
            'total_users' => $totalUsers,
            'total_lawyers' => $totalLawyers,
            'total_appointments' => $totalAppointments,
            'pending_appointments' => $pendingAppointments,
            'total_revenue' => $totalRevenue,
            'monthly_revenue' => $monthlyRevenue,
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

    public function users()
    {
        $users = User::with('lawyer')
            ->orderBy('created_at', 'desc')
            ->get();

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

        // Get summary statistics
        $totalPayments = Appointment::where('payment_status', 'paid')->count();
        $totalAmount = Appointment::where('payment_status', 'paid')->sum('consultation_fee');
        $cardPayments = Appointment::where('payment_status', 'paid')
            ->where('payment_method', 'card')
            ->count();
        $gcashPayments = Appointment::where('payment_status', 'paid')
            ->where('payment_method', 'gcash')
            ->count();

        // Transform the data
        $paymentsData = $payments->map(function ($appointment) {
            return [
                'id' => $appointment->id,
                'client_name' => $appointment->user->name ?? 'Unknown',
                'lawyer_name' => $appointment->lawyer 
                    ? $appointment->lawyer->first_name . ' ' . $appointment->lawyer->last_name 
                    : 'Unknown',
                'amount' => $appointment->consultation_fee,
                'payment_method' => $appointment->payment_method,
                'payment_reference' => $appointment->payment_reference,
                'payment_date' => $appointment->created_at,
                'created_at' => $appointment->created_at
            ];
        });

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

    public function analytics()
    {
       $revenueData = Appointment::where('payment_status', 'paid')
    ->where('created_at', '>=', now()->subDays(30))
    ->selectRaw('CAST(created_at AS DATE) as date, SUM(consultation_fee) as amount')
    ->groupBy(DB::raw('CAST(created_at AS DATE)'))
    ->orderBy('date')
    ->get();
        // Appointment statistics
        $totalAppointments = Appointment::count();
        $confirmedAppointments = Appointment::where('status', 'confirmed')->count();
        $completedAppointments = Appointment::where('status', 'completed')->count();
        $cancelledAppointments = Appointment::where('status', 'cancelled')->count();
        $pendingAppointments = Appointment::where('status', 'pending')->count();

        // Lawyer statistics
        $totalLawyers = Lawyer::count();
        $activeLawyers = Lawyer::where('is_available', true)->count();
        $approvedLawyers = Lawyer::where('status', 'approved')->count();
        $pendingLawyers = Lawyer::where('status', 'pending')->count();

        // User statistics
        $totalUsers = User::count();
        $newUsersThisMonth = User::whereMonth('created_at', now()->month)->count();

        // Total revenue
        $totalRevenue = Appointment::where('payment_status', 'paid')->sum('consultation_fee');

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
            ]
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
            'status' => 'required|in:pending,approved'
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
            ->select('specializations.id', 'specializations.name', DB::raw('COUNT(*) as appointment_count'))
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
                DB::raw('AVG(appointments.consultation_fee) as avg_fee'),
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
}