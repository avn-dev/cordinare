<?php

use App\Enums\UserRole;
use App\Models\Customer;
use App\Models\Tenant;
use App\Models\User;

it('allows admins to create, edit, and delete customers', function () {
    $tenant = Tenant::factory()->create();
    $admin = User::factory()->create([
        'tenant_id' => $tenant->id,
        'role' => UserRole::FirmAdmin,
    ]);

    $this->actingAs($admin);

    $create = $this->post('/customers', [
        'name' => 'Kunde A',
        'status' => 'active',
        'contact_name' => 'Max Muster',
        'email' => 'max@example.com',
    ]);

    $create->assertRedirect();

    $customer = Customer::first();
    expect($customer)->not->toBeNull();

    $update = $this->put("/customers/{$customer->id}", [
        'name' => 'Kunde B',
        'status' => 'inactive',
    ]);

    $update->assertRedirect();
    $customer->refresh();
    expect($customer->name)->toBe('Kunde B');

    $delete = $this->delete("/customers/{$customer->id}");
    $delete->assertRedirect();
    expect(Customer::query()->count())->toBe(0);
});
