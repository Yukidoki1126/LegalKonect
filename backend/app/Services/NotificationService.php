<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\Appointment;
use App\Models\Lawyer;
use App\Models\User;

class NotificationService
{
    /**
     * Called when a new appointment is created
     * Instance method wrapper for controller usage
     */
    public function appointmentCreated(Appointment $appointment)
    {
        self::notifyNewAppointment($appointment);
    }

    /**
     * Called when a reschedule is requested by lawyer
     * Instance method wrapper for controller usage
     */
    public function rescheduleRequested(Appointment $appointment)
    {
        self::notifyRescheduleRequested($appointment);
    }

    /**
     * Called when a reschedule is requested by client
     * Instance method wrapper for controller usage
     */
    public function clientRescheduleRequested(Appointment $appointment)
    {
        self::notifyClientRescheduleRequested($appointment);
    }

    /**
     * Called when a reschedule is responded to (accepted/declined)
     * Instance method wrapper for controller usage
     */
    public function rescheduleResponded(Appointment $appointment, string $status)
    {
        if ($status === 'accepted') {
            self::notifyRescheduleAccepted($appointment);
        } else {
            self::notifyRescheduleDeclined($appointment);
        }
    }

    /**
     * Called when payment is received
     * Instance method wrapper for controller usage
     */
    public function paymentReceived(Appointment $appointment)
    {
        // Use reservation fee (what was actually paid), not the full consultation fee
        $paidAmount = $appointment->lawyer->reservation_fee ?? $appointment->consultation_fee ?? 0;
        self::notifyPaymentReceived($appointment, $paidAmount);
    }

    /**
     * Called when a new review is submitted
     * Instance method wrapper for controller usage
     */
    public function newReview($review)
    {
        self::notifyNewReview($review);
    }

    /**
     * Called when an appointment is cancelled
     * Instance method wrapper for controller usage
     */
    public function appointmentCancelled(Appointment $appointment, string $cancelledBy = 'client')
    {
        self::notifyAppointmentCancelled($appointment, $cancelledBy);
    }

    /**
     * Generic method to notify a lawyer
     * Instance method for controller usage
     */
    public function notifyLawyer(int $lawyerId, string $type, string $title, string $message, array $data = [])
    {
        $lawyer = Lawyer::find($lawyerId);
        if (!$lawyer || !$lawyer->user) {
            return;
        }

        Notification::create([
            'user_id' => $lawyer->user->id,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'data' => $data,
        ]);
    }

    /**
     * Generic method to notify a client/user
     * Instance method for controller usage
     */
    public function notifyClient(int $userId, string $type, string $title, string $message, array $data = [])
    {
        Notification::create([
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'data' => $data,
        ]);
    }

    /**
     * Alias for notifyClient - notify a user by ID
     * Instance method for controller usage
     */
    public function notifyUser(int $userId, string $type, string $title, string $message, array $data = [])
    {
        $this->notifyClient($userId, $type, $title, $message, $data);
    }

    /**
     * Notify lawyer of new appointment booking
     */
    public static function notifyNewAppointment(Appointment $appointment)
    {
        $lawyer = $appointment->lawyer;
        $client = $appointment->user;
        $lawyerUser = $lawyer->user;

        if (!$lawyerUser) return;

        $date = \Carbon\Carbon::parse($appointment->appointment_date)->format('M d, Y');
        $time = \Carbon\Carbon::parse($appointment->appointment_time)->format('g:i A');

        Notification::create([
            'user_id' => $lawyerUser->id,
            'type' => 'appointment_created',
            'title' => 'New Appointment Booked',
            'message' => "{$client->name} booked an appointment for {$date} at {$time}",
            'data' => [
                'appointment_id' => $appointment->id,
                'client_name' => $client->name,
                'date' => $appointment->appointment_date,
                'time' => $appointment->appointment_time,
            ],
        ]);
    }

    /**
     * Notify client of reschedule request from lawyer
     */
    public static function notifyRescheduleRequested(Appointment $appointment)
    {
        $lawyer = $appointment->lawyer;
        $lawyerName = $lawyer->user->name ?? "{$lawyer->first_name} {$lawyer->last_name}";
        
        $newDate = \Carbon\Carbon::parse($appointment->proposed_date)->format('M d, Y');

        Notification::create([
            'user_id' => $appointment->user_id,
            'type' => 'reschedule_requested',
            'title' => 'Reschedule Request',
            'message' => "{$lawyerName} requested to reschedule your appointment to {$newDate}",
            'data' => [
                'appointment_id' => $appointment->id,
                'lawyer_name' => $lawyerName,
                'original_date' => $appointment->original_date,
                'proposed_date' => $appointment->proposed_date,
            ],
        ]);
    }

    /**
     * Notify lawyer that client requested to reschedule
     */
    public static function notifyClientRescheduleRequested(Appointment $appointment)
    {
        $lawyer = $appointment->lawyer;
        $lawyerUser = $lawyer->user;
        $client = $appointment->user;

        if (!$lawyerUser) return;

        $newDate = \Carbon\Carbon::parse($appointment->proposed_date)->format('M d, Y');
        $clientName = $client->name ?? 'A client';

        Notification::create([
            'user_id' => $lawyerUser->id,
            'type' => 'client_reschedule_requested',
            'title' => 'Client Reschedule Request',
            'message' => "{$clientName} requested to reschedule their appointment to {$newDate}",
            'data' => [
                'appointment_id' => $appointment->id,
                'client_name' => $clientName,
                'original_date' => $appointment->original_date,
                'proposed_date' => $appointment->proposed_date,
                'reason' => $appointment->reschedule_reason,
            ],
        ]);
    }

    /**
     * Notify about reschedule acceptance (handles both lawyer and client acceptance)
     */
    public static function notifyRescheduleAccepted(Appointment $appointment)
    {
        $lawyer = $appointment->lawyer;
        $lawyerUser = $lawyer->user;
        $client = $appointment->user;

        if (!$lawyerUser) return;

        $date = \Carbon\Carbon::parse($appointment->appointment_date)->format('M d, Y');

        // Check who requested the reschedule to send appropriate notification
        if ($appointment->reschedule_requested_by === 'client') {
            // Client requested, lawyer accepted - notify lawyer
            Notification::create([
                'user_id' => $lawyerUser->id,
                'type' => 'reschedule_accepted',
                'title' => 'Reschedule Accepted',
                'message' => "You accepted {$client->name}'s reschedule request for {$date}",
                'data' => [
                    'appointment_id' => $appointment->id,
                    'client_name' => $client->name,
                    'new_date' => $appointment->appointment_date,
                ],
            ]);
        } else {
            // Lawyer requested, client accepted - notify lawyer
            Notification::create([
                'user_id' => $lawyerUser->id,
                'type' => 'reschedule_accepted',
                'title' => 'Reschedule Accepted',
                'message' => "{$client->name} accepted your reschedule request for {$date}",
                'data' => [
                    'appointment_id' => $appointment->id,
                    'client_name' => $client->name,
                    'new_date' => $appointment->appointment_date,
                ],
            ]);
        }
    }

    /**
     * Notify about reschedule decline (handles both lawyer and client decline)
     */
    public static function notifyRescheduleDeclined(Appointment $appointment)
    {
        $lawyer = $appointment->lawyer;
        $lawyerUser = $lawyer->user;
        $client = $appointment->user;

        if (!$lawyerUser) return;

        // Check who requested the reschedule to send appropriate notification
        if ($appointment->reschedule_requested_by === 'client') {
            // Client requested, lawyer declined - notify lawyer
            Notification::create([
                'user_id' => $lawyerUser->id,
                'type' => 'reschedule_declined',
                'title' => 'Reschedule Declined',
                'message' => "You declined {$client->name}'s reschedule request",
                'data' => [
                    'appointment_id' => $appointment->id,
                    'client_name' => $client->name,
                ],
            ]);
        } else {
            // Lawyer requested, client declined - notify lawyer
            Notification::create([
                'user_id' => $lawyerUser->id,
                'type' => 'reschedule_declined',
                'title' => 'Reschedule Declined',
                'message' => "{$client->name} declined your reschedule request",
                'data' => [
                    'appointment_id' => $appointment->id,
                    'client_name' => $client->name,
                ],
            ]);
        }
    }

    /**
     * Notify lawyer of payment received
     */
    public static function notifyPaymentReceived(Appointment $appointment, $amount)
    {
        $lawyer = $appointment->lawyer;
        $lawyerUser = $lawyer->user;
        $client = $appointment->user;

        if (!$lawyerUser) return;

        $date = \Carbon\Carbon::parse($appointment->appointment_date)->format('M d, Y');

        Notification::create([
            'user_id' => $lawyerUser->id,
            'type' => 'payment_received',
            'title' => 'Payment Received',
            'message' => "₱" . number_format($amount, 2) . " received from {$client->name} for {$date} appointment",
            'data' => [
                'appointment_id' => $appointment->id,
                'client_name' => $client->name,
                'amount' => $amount,
            ],
        ]);
    }

    /**
     * Notify client of appointment confirmation
     */
    public static function notifyAppointmentConfirmed(Appointment $appointment)
    {
        $lawyer = $appointment->lawyer;
        $lawyerName = $lawyer->user->name ?? "{$lawyer->first_name} {$lawyer->last_name}";
        $date = \Carbon\Carbon::parse($appointment->appointment_date)->format('M d, Y');
        $time = \Carbon\Carbon::parse($appointment->appointment_time)->format('g:i A');

        Notification::create([
            'user_id' => $appointment->user_id,
            'type' => 'appointment_confirmed',
            'title' => 'Appointment Confirmed',
            'message' => "Your appointment with {$lawyerName} on {$date} at {$time} is confirmed",
            'data' => [
                'appointment_id' => $appointment->id,
                'lawyer_name' => $lawyerName,
                'date' => $appointment->appointment_date,
                'time' => $appointment->appointment_time,
            ],
        ]);
    }

    /**
     * Notify client of appointment cancellation
     */
    public static function notifyAppointmentCancelled(Appointment $appointment, $cancelledBy = 'lawyer')
    {
        $lawyer = $appointment->lawyer;
        $lawyerName = $lawyer->user->name ?? "{$lawyer->first_name} {$lawyer->last_name}";
        $client = $appointment->user;
        $date = \Carbon\Carbon::parse($appointment->appointment_date)->format('M d, Y');

        if ($cancelledBy === 'lawyer') {
            // Notify client
            Notification::create([
                'user_id' => $appointment->user_id,
                'type' => 'appointment_cancelled',
                'title' => 'Appointment Cancelled',
                'message' => "Your appointment with {$lawyerName} on {$date} has been cancelled",
                'data' => [
                    'appointment_id' => $appointment->id,
                    'lawyer_name' => $lawyerName,
                    'date' => $appointment->appointment_date,
                ],
            ]);
        } else {
            // Notify lawyer
            $lawyerUser = $lawyer->user;
            if ($lawyerUser) {
                Notification::create([
                    'user_id' => $lawyerUser->id,
                    'type' => 'appointment_cancelled',
                    'title' => 'Appointment Cancelled',
                    'message' => "{$client->name} cancelled their appointment on {$date}",
                    'data' => [
                        'appointment_id' => $appointment->id,
                        'client_name' => $client->name,
                        'date' => $appointment->appointment_date,
                    ],
                ]);
            }
        }
    }

    /**
     * Notify lawyer of new review
     */
    public static function notifyNewReview($review)
    {
        $appointment = $review->appointment;
        $lawyer = $appointment->lawyer;
        $lawyerUser = $lawyer->user;
        $client = $appointment->user;

        if (!$lawyerUser) return;

        Notification::create([
            'user_id' => $lawyerUser->id,
            'type' => 'new_review',
            'title' => 'New Review Received',
            'message' => "{$client->name} left you a {$review->rating}-star review",
            'data' => [
                'review_id' => $review->id,
                'appointment_id' => $appointment->id,
                'client_name' => $client->name,
                'rating' => $review->rating,
            ],
        ]);
    }

    /**
     * Notify client of case update
     */
    public static function notifyCaseUpdated($case)
    {
        $lawyer = Lawyer::find($case->lawyer_id);
        $lawyerName = $lawyer->user->name ?? "{$lawyer->first_name} {$lawyer->last_name}";

        Notification::create([
            'user_id' => $case->user_id,
            'type' => 'case_updated',
            'title' => 'Case Updated',
            'message' => "{$lawyerName} updated your case: {$case->title}",
            'data' => [
                'case_id' => $case->id,
                'lawyer_name' => $lawyerName,
                'status' => $case->status,
            ],
        ]);
    }

    /**
     * Notify admins of new lawyer registration
     */
    public static function notifyAdminNewLawyer(Lawyer $lawyer)
    {
        $lawyerName = $lawyer->user->name ?? "{$lawyer->first_name} {$lawyer->last_name}";

        // Get all admin users
        $admins = User::where('role', 'admin')->get();

        foreach ($admins as $admin) {
            Notification::create([
                'user_id' => $admin->id,
                'type' => 'new_lawyer_registration',
                'title' => 'New Lawyer Registration',
                'message' => "{$lawyerName} has registered and is awaiting verification",
                'data' => [
                    'lawyer_id' => $lawyer->id,
                    'lawyer_name' => $lawyerName,
                ],
            ]);
        }
    }
}
