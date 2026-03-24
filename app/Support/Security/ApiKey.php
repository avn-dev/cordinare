<?php

namespace App\Support\Security;

class ApiKey
{
    public static function generate(): string
    {
        return 'cord_' . bin2hex(random_bytes(24));
    }

    public static function hash(string $plainTextKey): string
    {
        return hash('sha256', $plainTextKey);
    }

    public static function prefix(string $plainTextKey): string
    {
        return substr($plainTextKey, 0, 12);
    }

    public static function lastFour(string $plainTextKey): string
    {
        return substr($plainTextKey, -4);
    }
}
