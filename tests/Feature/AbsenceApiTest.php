<?php

use App\Enums\UserRole;
use App\Models\Absence;
use App\Models\Tenant;
use App\Models\User;

it('lists absences for the current tenant only', function () {
    $tenant = Tenant::factory()->create();
    $otherTenant = Tenant::factory()->create();

    $admin = User::factory()->create([
        'tenant_id' => $tenant->id,
        'role' => UserRole::FirmAdmin,
    ]);

    $ownAbsence = Absence::factory()->create([
        'tenant_id' => $tenant->id,
        'user_id' => $admin->id,
    ]);

    Absence::factory()->create([
        'tenant_id' => $otherTenant->id,
    ]);

    $this->actingAs($admin);

    $response = $this->getJson('/api/v1/absences');

    $response->assertOk();
    $response->assertJsonCount(1, 'data');
    $response->assertJsonPath('data.0.id', $ownAbsence->id);
});

it('allows employees to create absences for themselves', function () {
    $tenant = Tenant::factory()->create();
    $employee = User::factory()->create([
        'tenant_id' => $tenant->id,
        'role' => UserRole::Employee,
    ]);

    $this->actingAs($employee);

    $response = $this->postJson('/api/v1/absences', [
        'user_id' => 999999,
        'type' => 'vacation',
        'starts_on' => now()->addDays(2)->toDateString(),
        'ends_on' => now()->addDays(3)->toDateString(),
        'status' => 'approved',
        'notes' => 'Kurzurlaub',
    ]);

    $response->assertCreated();

    $this->assertDatabaseHas('absences', [
        'tenant_id' => $tenant->id,
        'user_id' => $employee->id,
        'type' => 'vacation',
        'status' => 'pending',
    ]);
});

it('does not allow employees to change the absence user', function () {
    $tenant = Tenant::factory()->create();
    $employee = User::factory()->create([
        'tenant_id' => $tenant->id,
        'role' => UserRole::Employee,
    ]);

    $other = User::factory()->create([
        'tenant_id' => $tenant->id,
        'role' => UserRole::Employee,
    ]);

    $absence = Absence::factory()->create([
        'tenant_id' => $tenant->id,
        'user_id' => $employee->id,
        'status' => 'pending',
    ]);

    $this->actingAs($employee);

    $response = $this->putJson("/api/v1/absences/{$absence->id}", [
        'user_id' => $other->id,
        'status' => 'approved',
    ]);

    $response->assertOk();

    $absence->refresh();
    expect($absence->user_id)->toBe($employee->id);
    expect($absence->status)->toBe('pending');
});
