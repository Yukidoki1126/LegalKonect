<?php

namespace App\Mail;

use App\Models\Appointment;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AppointmentBooked extends Mailable
{
    use Queueable, SerializesModels;

    public $appointment;

    /**
     * Create a new message instance.
     */
    public function __construct(Appointment $appointment)
    {
        $this->appointment = $appointment;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
{
    $subject = $this->appointment->payment_status === 'paid' 
        ? 'Appointment Confirmed & Paid - LegalKonect'
        : 'Appointment Booked (Payment Pending) - LegalKonect';
    
    return new Envelope(
        subject: $subject,
    );
}

    /**
     * Get the message content definition.
     */
   public function content(): Content
{
    return new Content(
        view: 'emails.appointment-booked',  // This must match your blade file
    );
}

    /**
     * Get the attachments for the message.
     */
    public function attachments(): array
    {
        return [];
    }
}