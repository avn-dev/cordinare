<?php

namespace App\Providers;

use App\Enums\UserRole;
use App\Models\Customer;
use App\Models\Lead;
use App\Models\Offer;
use App\Models\Shift;
use App\Models\Assignment;
use App\Models\Absence;
use App\Models\AuditLog;
use App\Models\TimeEntry;
use App\Models\Site;
use App\Models\User;
use App\Models\InventoryItem;
use App\Models\ShiftTemplate;
use App\Models\SiteIssue;
use App\Models\InspectionAppointment;
use App\Policies\UserPolicy;
use App\Policies\CustomerPolicy;
use App\Policies\LeadPolicy;
use App\Policies\OfferPolicy;
use App\Policies\ShiftPolicy;
use App\Policies\AssignmentPolicy;
use App\Policies\AbsencePolicy;
use App\Policies\AuditLogPolicy;
use App\Policies\TimeEntryPolicy;
use App\Policies\SitePolicy;
use App\Policies\InventoryItemPolicy;
use App\Policies\ShiftTemplatePolicy;
use App\Policies\SiteIssuePolicy;
use App\Policies\InspectionAppointmentPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        Lead::class => LeadPolicy::class,
        Customer::class => CustomerPolicy::class,
        Site::class => SitePolicy::class,
        InventoryItem::class => InventoryItemPolicy::class,
        ShiftTemplate::class => ShiftTemplatePolicy::class,
        Offer::class => OfferPolicy::class,
        Shift::class => ShiftPolicy::class,
        Assignment::class => AssignmentPolicy::class,
        TimeEntry::class => TimeEntryPolicy::class,
        Absence::class => AbsencePolicy::class,
        AuditLog::class => AuditLogPolicy::class,
        SiteIssue::class => SiteIssuePolicy::class,
        InspectionAppointment::class => InspectionAppointmentPolicy::class,
        User::class => UserPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();

        Gate::before(function (User $user, string $ability) {
            if ($user->role === UserRole::Superadmin) {
                return true;
            }

            return null;
        });
    }
}
