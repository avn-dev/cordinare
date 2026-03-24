<?php

use App\Enums\UserRole;
use App\Models\AuditLog;
use App\Models\Tenant;
use App\Models\User;

it('allows admins to export audit logs as csv', function () {
    $tenant = Tenant::factory()->create();
    $admin = User::factory()->create([
        'tenant_id' => $tenant->id,
        'role' => UserRole::FirmAdmin,
    ]);

    AuditLog::factory()->create([
        'tenant_id' => $tenant->id,
        'actor_id' => $admin->id,
        'action' => 'updated',
    ]);

    $this->actingAs($admin);

    $response = $this->get('/audit-logs/export/csv');

    $response->assertOk();
    $response->assertHeader('content-type', 'text/csv; charset=UTF-8');
    $response->assertHeader('content-disposition');
});

it('blocks employees from exporting audit logs', function () {
    $tenant = Tenant::factory()->create();
    $employee = User::factory()->create([
        'tenant_id' => $tenant->id,
        'role' => UserRole::Employee,
    ]);

    $this->actingAs($employee);

    $response = $this->get('/audit-logs/export/csv');

    $response->assertForbidden();
});
