<?php

use App\Enums\UserRole;
use App\Models\Absence;
use App\Models\Tenant;
use App\Models\User;

it('allows admins to export absences as csv', function () {
    $tenant = Tenant::factory()->create();
    $admin = User::factory()->create([
        'tenant_id' => $tenant->id,
        'role' => UserRole::FirmAdmin,
    ]);

    Absence::factory()->create([
        'tenant_id' => $tenant->id,
        'user_id' => $admin->id,
        'type' => 'vacation',
    ]);

    $this->actingAs($admin);

    $response = $this->get('/absences/export/csv');

    $response->assertOk();
    $response->assertHeader('content-type', 'text/csv; charset=UTF-8');
    $response->assertHeader('content-disposition');
});

it('blocks non-admin users from exporting absences', function () {
    $tenant = Tenant::factory()->create();
    $employee = User::factory()->create([
        'tenant_id' => $tenant->id,
        'role' => UserRole::Employee,
    ]);

    $this->actingAs($employee);

    $response = $this->get('/absences/export/csv');

    $response->assertForbidden();
});
