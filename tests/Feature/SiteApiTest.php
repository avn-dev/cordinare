<?php

use App\Enums\UserRole;
use App\Models\Customer;
use App\Models\Site;
use App\Models\Tenant;
use App\Models\User;

it('allows authorized users to list sites', function () {
    $tenant = Tenant::factory()->create();
    $user = User::factory()->create([
        'tenant_id' => $tenant->id,
        'role' => UserRole::FirmAdmin,
    ]);

    Site::factory()->count(2)->create(['tenant_id' => $tenant->id]);

    $this->actingAs($user);

    $response = $this->getJson('/api/v1/sites');

    $response->assertOk();
    $response->assertJsonCount(2, 'data');
});

it('creates a site for the current tenant', function () {
    $tenant = Tenant::factory()->create();
    $user = User::factory()->create([
        'tenant_id' => $tenant->id,
        'role' => UserRole::FirmAdmin,
    ]);

    $customer = Customer::factory()->create(['tenant_id' => $tenant->id]);

    $this->actingAs($user);

    $response = $this->postJson('/api/v1/sites', [
        'customer_id' => $customer->id,
        'name' => 'Objekt West',
        'city' => 'Berlin',
        'country' => 'DE',
    ]);

    $response->assertCreated();
    $response->assertJsonPath('data.name', 'Objekt West');

    $this->assertDatabaseHas('sites', [
        'tenant_id' => $tenant->id,
        'customer_id' => $customer->id,
        'name' => 'Objekt West',
    ]);
});
