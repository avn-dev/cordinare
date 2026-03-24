<?php

use App\Enums\UserRole;
use App\Models\AuditLog;
use App\Models\Tenant;
use App\Models\User;

it('allows admins to view audit logs scoped to tenant', function () {
    $tenant = Tenant::factory()->create();
    $otherTenant = Tenant::factory()->create();

    $admin = User::factory()->create([
        'tenant_id' => $tenant->id,
        'role' => UserRole::FirmAdmin,
    ]);

    AuditLog::factory()->create([
        'tenant_id' => $tenant->id,
        'actor_id' => $admin->id,
    ]);

    AuditLog::factory()->create([
        'tenant_id' => $otherTenant->id,
    ]);

    $this->actingAs($admin);

    $response = $this->get('/audit-logs');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('audit-logs/index')
        ->has('logs.data', 1)
    );
});

it('blocks employees from viewing audit logs', function () {
    $tenant = Tenant::factory()->create();
    $employee = User::factory()->create([
        'tenant_id' => $tenant->id,
        'role' => UserRole::Employee,
    ]);

    $this->actingAs($employee);

    $response = $this->get('/audit-logs');

    $response->assertForbidden();
});
