<?php

namespace App\Support\Security;

use Illuminate\Support\Str;

class OfferNumber
{
    public static function generate(): string
    {
        $date = now()->format('Ymd');
        $suffix = Str::upper(Str::random(6));

        return 'OFF-'.$date.'-'.$suffix;
    }
}
