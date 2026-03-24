<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\User;

class UserPolicy
{
    protected function canAccess(User $user): bool
    {
        return $user->hasAnyRole([
            UserRole::Superadmin,
            UserRole::FirmAdmin,
            UserRole::Hr,
        ]);
    }

    public function viewAny(User $user): bool
    {
        return $this->canAccess($user);
    }

    public function view(User $user, User $target): bool
    {
        return $this->canAccess($user) && $user->tenant_id === $target->tenant_id;
    }

    public function create(User $user): bool
    {
        return $this->canAccess($user);
    }

    public function update(User $user, User $target): bool
    {
        return $this->canAccess($user) && $user->tenant_id === $target->tenant_id;
    }

    public function delete(User $user, User $target): bool
    {
        return $this->canAccess($user)
            && $user->tenant_id === $target->tenant_id
            && $user->id !== $target->id;
    }
}
