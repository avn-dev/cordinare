<?php

use App\Enums\UserRole;
use App\Models\Assignment;
use App\Models\Shift;
use App\Models\Site;
use App\Models\Tenant;
use App\Models\User;

it('creates an assignment for a shift', function () {
    $tenant = Tenant::factory()->create();
    $admin = User::factory()->create([
        'tenant_id' => $tenant->id,
        'role' => UserRole::FirmAdmin,
    ]);

    $employee = User::factory()->create([
        'tenant_id' => $tenant->id,
        'role' => UserRole::Employee,
    ]);

    $site = Site::factory()->create(['tenant_id' => $tenant->id]);
    $shift = Shift::factory()->create([
        'tenant_id' => $tenant->id,
        'site_id' => $site->id,
    ]);

    $this->actingAs($admin);

    $response = $this->postJson('/api/v1/assignments', [
        'shift_id' => $shift->id,
        'user_id' => $employee->id,
        'role' => 'employee',
        'status' => 'assigned',
    ]);

    $response->assertCreated();

    $this->assertDatabaseHas('assignments', [
        'tenant_id' => $tenant->id,
        'shift_id' => $shift->id,
        'user_id' => $employee->id,
    ]);

    expect(Assignment::count())->toBe(1);
});
