<?php

use App\Enums\UserRole;
use App\Models\Lead;
use App\Models\Tenant;
use App\Models\User;

it('allows an admin to convert a lead to a customer', function () {
    $tenant = Tenant::factory()->create();
    $admin = User::factory()->create([
        'tenant_id' => $tenant->id,
        'role' => UserRole::FirmAdmin,
    ]);

    $lead = Lead::factory()->create([
        'tenant_id' => $tenant->id,
        'name' => 'Lead Kunde',
        'email' => 'lead@example.com',
    ]);

    $this->actingAs($admin);

    $response = $this->post("/leads/{$lead->id}/convert", [
        'customer_name' => 'Lead Kunde GmbH',
        'contact_name' => 'Lead Ansprechpartner',
        'email' => 'lead@example.com',
        'phone' => '123',
        'notes' => 'Notiz',
        'site_name' => 'Objekt A',
        'address_line1' => 'Straße 1',
        'postal_code' => '10115',
        'city' => 'Berlin',
        'country' => 'DE',
    ]);

    $response->assertRedirectContains('/customers/');

    $lead->refresh();
    expect($lead->converted_customer_id)->not->toBeNull();
    expect($lead->status)->toBe('converted');
});

it('prevents conversion if lead is already converted', function () {
    $tenant = Tenant::factory()->create();
    $admin = User::factory()->create([
        'tenant_id' => $tenant->id,
        'role' => UserRole::FirmAdmin,
    ]);

    $lead = Lead::factory()->create([
        'tenant_id' => $tenant->id,
        'converted_customer_id' => Tenant::factory()->create()->id,
        'status' => 'converted',
    ]);

    $this->actingAs($admin);

    $response = $this->post("/leads/{$lead->id}/convert", [
        'customer_name' => 'Test',
    ]);

    $response->assertSessionHas('error');
});
