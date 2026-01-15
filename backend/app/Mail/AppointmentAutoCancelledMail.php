<?php

namespace App\Mail;

use App\Models\Appointment;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class AppointmentAutoCancelledMail extends Mailable
{
    use Queueable, SerializesModels;

    public $appointment;

    public function __construct(Appointment $appointment)
    {
        $this->appointment = $appointment;
    }

    public function build()
    {
        $appointmentDateTime = \Carbon\Carbon::parse(
            $this->appointment->appointment_date . ' ' . $this->appointment->appointment_time
        );

        // Get client name with fallback
        $clientName = $this->appointment->user->name ?? 'Valued Client';
        
        // Get lawyer name with fallback
        $lawyerName = 'Your Lawyer';
        if ($this->appointment->lawyer) {
            if ($this->appointment->lawyer->user && $this->appointment->lawyer->user->name) {
                $lawyerName = $this->appointment->lawyer->user->name;
            } else {
                $lawyerName = $this->appointment->lawyer->first_name . ' ' . $this->appointment->lawyer->last_name;
            }
        }

        return $this->subject('Appointment Cancelled - Payment Not Received')
            ->view('emails.appointment-auto-cancelled')
            ->with([
                'clientName' => $clientName,
                'lawyerName' => $lawyerName,
                'appointmentDate' => $appointmentDateTime->format('F d, Y'),
                'appointmentTime' => $appointmentDateTime->format('g:i A'),
                'reservationFee' => $this->appointment->reservation_fee ?? $this->appointment->lawyer->reservation_fee ?? 100,
                'appointmentId' => $this->appointment->id,
            ]);
    }
}
