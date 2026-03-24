<?php

namespace App\Support\Audit;

use App\Models\User;

class AuditContext
{
    public function __construct(
        public ?User $actor = null,
        public ?string $ip = null,
        public ?string $userAgent = null,
        public ?string $requestId = null,
    ) {
    }
}
