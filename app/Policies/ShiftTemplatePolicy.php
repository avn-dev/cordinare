<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\ShiftTemplate;
use App\Models\User;

class ShiftTemplatePolicy
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
    public function view(User $user, ShiftTemplate $shiftTemplate): bool
    {
        return $this->canAccess($user) && $user->tenant_id === $shiftTemplate->tenant_id;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $this->canAccess($user);
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, ShiftTemplate $shiftTemplate): bool
    {
        return $this->canAccess($user) && $user->tenant_id === $shiftTemplate->tenant_id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, ShiftTemplate $shiftTemplate): bool
    {
        return $this->canAccess($user) && $user->tenant_id === $shiftTemplate->tenant_id;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, ShiftTemplate $shiftTemplate): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, ShiftTemplate $shiftTemplate): bool
    {
        return false;
    }
}
