<?php

namespace App\Mail;

use App\Models\Appointment;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PaymentRejected extends Mailable
{
    use Queueable, SerializesModels;

    public $appointment;
    public $lawyerName;
    public $reason;

    /**
     * Create a new message instance.
     */
    public function __construct(Appointment $appointment, string $reason = '')
    {
        $this->appointment = $appointment;
        $lawyer = $appointment->lawyer;
        $this->lawyerName = $lawyer->user->name ?? "{$lawyer->first_name} {$lawyer->last_name}";
        $this->reason = $reason ?: 'The payment proof could not be verified. Please upload a valid payment receipt.';
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Payment Verification Failed - Action Required - LegalKonect',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.payment-rejected',
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
