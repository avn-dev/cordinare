<?php

use App\Enums\UserRole;
use App\Models\AuditLog;
use App\Models\Tenant;
use App\Models\User;

it('lists audit logs for the current tenant', function () {
    $tenant = Tenant::factory()->create();
    $otherTenant = Tenant::factory()->create();

    $admin = User::factory()->create([
        'tenant_id' => $tenant->id,
        'role' => UserRole::FirmAdmin,
    ]);

    AuditLog::factory()->create([
        'tenant_id' => $tenant->id,
        'actor_id' => $admin->id,
        'action' => 'updated',
    ]);

    AuditLog::factory()->create([
        'tenant_id' => $otherTenant->id,
    ]);

    $this->actingAs($admin);

    $response = $this->getJson('/api/v1/audit-logs');

    $response->assertOk();
    $response->assertJsonCount(1, 'data');
    $response->assertJsonPath('data.0.action', 'updated');
});

it('blocks employees from viewing audit logs via api', function () {
    $tenant = Tenant::factory()->create();
    $employee = User::factory()->create([
        'tenant_id' => $tenant->id,
        'role' => UserRole::Employee,
    ]);

    $this->actingAs($employee);

    $response = $this->getJson('/api/v1/audit-logs');

    $response->assertForbidden();
});
