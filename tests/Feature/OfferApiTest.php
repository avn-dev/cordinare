<?php

use App\Enums\UserRole;
use App\Models\Customer;
use App\Models\Offer;
use App\Models\Tenant;
use App\Models\User;

it('creates an offer with items', function () {
    $tenant = Tenant::factory()->create();
    $user = User::factory()->create([
        'tenant_id' => $tenant->id,
        'role' => UserRole::FirmAdmin,
    ]);
    $customer = Customer::factory()->create(['tenant_id' => $tenant->id]);

    $this->actingAs($user);

    $response = $this->postJson('/api/v1/offers', [
        'customer_id' => $customer->id,
        'currency' => 'EUR',
        'items' => [
            [
                'description' => 'Grundreinigung',
                'quantity' => 2,
                'unit' => 'Std',
                'unit_price' => 45,
                'interval' => 'einmalig',
            ],
        ],
    ]);

    $response->assertCreated();
    $response->assertJsonPath('data.customer_id', $customer->id);

    expect(Offer::count())->toBe(1);
    expect(Offer::first()->items)->toHaveCount(1);
});
