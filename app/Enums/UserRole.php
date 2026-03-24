<?php

namespace App\Enums;

enum UserRole: string
{
    case Superadmin = 'superadmin';
    case FirmAdmin = 'firm_admin';
    case Dispatcher = 'dispatcher';
    case Hr = 'hr';
    case Employee = 'employee';
    case ContractorUser = 'contractor_user';
    case CustomerReadonly = 'customer_readonly';

    public static function internalRoles(): array
    {
        return [
            self::Superadmin,
            self::FirmAdmin,
            self::Dispatcher,
            self::Hr,
            self::Employee,
        ];
    }
}
