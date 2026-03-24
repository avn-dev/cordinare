<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\InspectionAppointment;
use App\Models\User;

class InspectionAppointmentPolicy
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

    public function view(User $user, InspectionAppointment $appointment): bool
    {
        return $this->canAccess($user) && $user->tenant_id === $appointment->tenant_id;
    }

    public function create(User $user): bool
    {
        return $this->canAccess($user);
    }

    public function update(User $user, InspectionAppointment $appointment): bool
    {
        return $this->canAccess($user) && $user->tenant_id === $appointment->tenant_id;
    }
}
