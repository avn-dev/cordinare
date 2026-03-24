<?php

namespace App\Jobs;

use App\Mail\OfferSent;
use App\Models\Offer;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;

class SendOfferJob implements ShouldQueue
{
    use Queueable;

    public function __construct(public int $offerId)
    {
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $offer = Offer::query()
            ->with(['items', 'customer', 'site'])
            ->findOrFail($this->offerId);

        if (! $offer->customer->email) {
            return;
        }

        if ($offer->sent_at !== null) {
            $offer->version += 1;
        }

        $pdf = Pdf::loadView('pdf.offer', ['offer' => $offer]);
        $filename = $offer->number ? $offer->number : 'offer-'.$offer->id;
        $path = 'offers/'.$offer->id.'/'.$filename.'-v'.$offer->version.'.pdf';

        Storage::disk('local')->put($path, $pdf->output());

        $offer->pdf_path = $path;
        $offer->sent_at = now();
        $offer->status = 'sent';
        $offer->save();

        Mail::to($offer->customer->email)
            ->send(new OfferSent($offer, Storage::disk('local')->path($path)));
    }
}
