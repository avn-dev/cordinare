<?php

namespace App\Mail;

use App\Models\InspectionAppointment;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class InspectionConfirmationMail extends Mailable
{
    use Queueable;
    use SerializesModels;

    public function __construct(public InspectionAppointment $appointment)
    {
    }

    public function build(): self
    {
        $siteName = $this->appointment->site?->name ?? 'Objekt';
        $subject = $this->appointment->email_subject ?: 'Terminbestätigung Besichtigung: '.$siteName;

        return $this->subject($subject)
            ->view('emails.inspection-confirmation', [
                'appointment' => $this->appointment,
            ]);
    }
}
