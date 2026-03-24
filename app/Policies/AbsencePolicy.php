<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Absence;
use App\Models\User;

class AbsencePolicy
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

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $this->canAccess($user);
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Absence $absence): bool
    {
        if ($this->canAccess($user)) {
            return $user->tenant_id === $absence->tenant_id;
        }

        return $user->role === UserRole::Employee
            && $user->tenant_id === $absence->tenant_id
            && $absence->user_id === $user->id;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $this->canAccess($user) || $user->role === UserRole::Employee;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Absence $absence): bool
    {
        if ($this->canAccess($user)) {
            return $user->tenant_id === $absence->tenant_id;
        }

        return $user->role === UserRole::Employee
            && $user->tenant_id === $absence->tenant_id
            && $absence->user_id === $user->id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Absence $absence): bool
    {
        if ($this->canAccess($user)) {
            return $user->tenant_id === $absence->tenant_id;
        }

        return $user->role === UserRole::Employee
            && $user->tenant_id === $absence->tenant_id
            && $absence->user_id === $user->id;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Absence $absence): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Absence $absence): bool
    {
        return false;
    }
}
