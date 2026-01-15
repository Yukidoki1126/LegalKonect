<?php

namespace App\Mail;

use App\Models\Lawyer;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class LawyerVerificationRejected extends Mailable
{
    use Queueable, SerializesModels;

    public $lawyer;
    public $lawyerName;
    public $rejectionReason;

    /**
     * Create a new message instance.
     */
    public function __construct(Lawyer $lawyer, $rejectionReason)
    {
        $this->lawyer = $lawyer;
        $this->lawyerName = "{$lawyer->first_name} {$lawyer->last_name}";
        $this->rejectionReason = $rejectionReason;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Verification Update - LegalKonect',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.lawyer-verification-rejected',
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
