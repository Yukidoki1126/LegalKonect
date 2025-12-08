<?php

namespace App\Mail;

use App\Models\Lawyer;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class LawyerVerificationApproved extends Mailable
{
    use Queueable, SerializesModels;

    public $lawyer;
    public $notes;

    /**
     * Create a new message instance.
     */
    public function __construct(Lawyer $lawyer, ?string $notes = null)
    {
        $this->lawyer = $lawyer;
        $this->notes = $notes;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Congratulations! Your Lawyer Account is Approved - LegalKonect',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.lawyer-verification-approved',
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
