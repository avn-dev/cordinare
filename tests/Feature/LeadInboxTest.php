<?php

use App\Enums\UserRole;
use App\Models\Tenant;
use App\Models\User;

it('allows authorized roles to access the lead inbox', function () {
    $tenant = Tenant::factory()->create();
    $user = User::factory()->create([
        'tenant_id' => $tenant->id,
        'role' => UserRole::FirmAdmin,
    ]);

    $this->actingAs($user);

    $response = $this->get(route('leads.index'));
    $response->assertOk();
});

it('forbids unauthorized roles from accessing the lead inbox', function () {
    $tenant = Tenant::factory()->create();
    $user = User::factory()->create([
        'tenant_id' => $tenant->id,
        'role' => UserRole::Employee,
    ]);

    $this->actingAs($user);

    $response = $this->get(route('leads.index'));
    $response->assertForbidden();
});
