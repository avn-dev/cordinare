<?php

namespace App\Console\Commands;

use App\Jobs\SendOfferJob;
use App\Models\Offer;
use Illuminate\Console\Command;

class CordinareSendOffer extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'cordinare:offer:send {offer : Offer ID}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Queue sending of an offer (PDF + Mail)';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $offerId = (int) $this->argument('offer');
        $offer = Offer::find($offerId);

        if (! $offer) {
            $this->error('Offer not found.');
            return self::FAILURE;
        }

        SendOfferJob::dispatch($offer->id);
        $this->info('Offer queued for sending: '.$offer->id);

        return self::SUCCESS;
    }
}
