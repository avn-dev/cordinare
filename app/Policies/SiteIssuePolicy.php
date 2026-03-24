<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\SiteIssue;
use App\Models\User;

class SiteIssuePolicy
{
    protected function canAccess(User $user): bool
    {
        return $user->hasAnyRole([
            UserRole::Superadmin,
            UserRole::FirmAdmin,
            UserRole::Dispatcher,
            UserRole::Hr,
        ]);
    }

    public function viewAny(User $user): bool
    {
        return $this->canAccess($user);
    }

    public function view(User $user, SiteIssue $issue): bool
    {
        return $this->canAccess($user) && $user->tenant_id === $issue->tenant_id;
    }
}
