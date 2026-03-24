<?php

use App\Enums\UserRole;
use App\Models\Customer;
use App\Models\Tenant;
use App\Models\User;

it('allows authorized users to list customers', function () {
    $tenant = Tenant::factory()->create();
    $user = User::factory()->create([
        'tenant_id' => $tenant->id,
        'role' => UserRole::FirmAdmin,
    ]);

    Customer::factory()->count(2)->create(['tenant_id' => $tenant->id]);

    $this->actingAs($user);

    $response = $this->getJson('/api/v1/customers');

    $response->assertOk();
    $response->assertJsonCount(2, 'data');
});

it('forbids unauthorized users from listing customers', function () {
    $tenant = Tenant::factory()->create();
    $user = User::factory()->create([
        'tenant_id' => $tenant->id,
        'role' => UserRole::Employee,
    ]);

    $this->actingAs($user);

    $response = $this->getJson('/api/v1/customers');

    $response->assertForbidden();
});

it('creates a customer for the current tenant', function () {
    $tenant = Tenant::factory()->create();
    $user = User::factory()->create([
        'tenant_id' => $tenant->id,
        'role' => UserRole::FirmAdmin,
    ]);

    $this->actingAs($user);

    $response = $this->postJson('/api/v1/customers', [
        'name' => 'Musterkunde GmbH',
        'email' => 'kontakt@musterkunde.de',
        'phone' => '+49 30 123456',
    ]);

    $response->assertCreated();
    $response->assertJsonPath('data.name', 'Musterkunde GmbH');

    $this->assertDatabaseHas('customers', [
        'tenant_id' => $tenant->id,
        'name' => 'Musterkunde GmbH',
    ]);
});
