<?php

use App\Enums\UserRole;
use App\Models\Customer;
use App\Models\Site;
use App\Models\Tenant;
use App\Models\User;

it('allows admins to create and edit sites', function () {
    $tenant = Tenant::factory()->create();
    $admin = User::factory()->create([
        'tenant_id' => $tenant->id,
        'role' => UserRole::FirmAdmin,
    ]);

    $customer = Customer::factory()->create([
        'tenant_id' => $tenant->id,
    ]);

    $this->actingAs($admin);

    $create = $this->post('/sites', [
        'customer_id' => $customer->id,
        'name' => 'Objekt A',
        'status' => 'active',
        'city' => 'Berlin',
        'country' => 'DE',
    ]);

    $create->assertRedirect();

    $site = Site::first();
    expect($site)->not->toBeNull();

    $update = $this->put("/sites/{$site->id}", [
        'name' => 'Objekt B',
        'customer_id' => $customer->id,
    ]);

    $update->assertRedirect();
    $site->refresh();
    expect($site->name)->toBe('Objekt B');
});
