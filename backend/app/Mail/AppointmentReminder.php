<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use App\Models\Appointment;

class AppointmentReminder extends Mailable
{
    use Queueable, SerializesModels;

    public $appointment;
    public $lawyerName;
    public $formattedDate;
    public $formattedTime;

    /**
     * Create a new message instance.
     *
     * @param  \App\Models\Appointment  $appointment
     * @return void
     */
    public function __construct(Appointment $appointment)
    {
        $this->appointment = $appointment;
        
        // Format lawyer name
        $lawyer = $appointment->lawyer;
        $this->lawyerName = $lawyer->first_name . ' ' . $lawyer->last_name;
        
        // Format date and time
        $this->formattedDate = \Carbon\Carbon::parse($appointment->appointment_date)->format('F j, Y');
        $this->formattedTime = \Carbon\Carbon::parse($appointment->appointment_time)->format('g:i A');
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        return $this->subject('Appointment Reminder - Tomorrow at ' . $this->formattedTime . ' - LegalKonect')
                    ->view('emails.appointment-reminder')
                    ->with([
                        'appointment' => $this->appointment,
                        'lawyerName' => $this->lawyerName,
                        'formattedDate' => $this->formattedDate,
                        'formattedTime' => $this->formattedTime,
                    ]);
    }
}