<?php

use App\Enums\UserRole;
use App\Models\Absence;
use App\Models\Tenant;
use App\Models\User;

it('flags overlapping absences', function () {
    $tenant = Tenant::factory()->create();
    $admin = User::factory()->create([
        'tenant_id' => $tenant->id,
        'role' => UserRole::FirmAdmin,
    ]);

    $employee = User::factory()->create([
        'tenant_id' => $tenant->id,
        'role' => UserRole::Employee,
    ]);

    Absence::factory()->create([
        'tenant_id' => $tenant->id,
        'user_id' => $employee->id,
        'starts_on' => now()->addDays(5)->toDateString(),
        'ends_on' => now()->addDays(7)->toDateString(),
        'status' => 'approved',
    ]);

    $this->actingAs($admin);

    $response = $this->postJson('/api/v1/absences', [
        'user_id' => $employee->id,
        'type' => 'vacation',
        'starts_on' => now()->addDays(6)->toDateString(),
        'ends_on' => now()->addDays(8)->toDateString(),
        'status' => 'pending',
    ]);

    $response->assertCreated();

    $absenceId = $response->json('data.id');
    $absence = Absence::find($absenceId);

    expect($absence->rule_flags)->toContain('overlap');
});
