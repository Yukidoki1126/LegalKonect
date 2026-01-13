<?php

namespace App\Mail;

use App\Models\Appointment;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class PaymentFinalWarningMail extends Mailable
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

        return $this->subject('⚠️ Final Warning - Payment Required in 24 Hours')
            ->view('emails.payment-final-warning')
            ->with([
                'clientName' => $this->appointment->user->name,
                'lawyerName' => $this->appointment->lawyer->user->name,
                'appointmentDate' => $appointmentDateTime->format('F d, Y'),
                'appointmentTime' => $appointmentDateTime->format('g:i A'),
                'reservationFee' => $this->appointment->reservation_fee,
                'appointmentId' => $this->appointment->id,
            ]);
    }
}
