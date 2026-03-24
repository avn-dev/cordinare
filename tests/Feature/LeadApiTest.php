<?php

use App\Models\Lead;
use App\Models\Tenant;
use App\Support\Security\ApiKey;

it('requires an api key for lead ingestion', function () {
    $response = $this->postJson('/api/v1/leads', [
        'name' => 'Max Mustermann',
    ]);

    $response->assertStatus(401);
});

it('creates a lead for the matching tenant', function () {
    $plainKey = ApiKey::generate();
    $tenant = Tenant::factory()->create([
        'api_key_hash' => ApiKey::hash($plainKey),
        'api_key_prefix' => ApiKey::prefix($plainKey),
        'api_key_last_four' => ApiKey::lastFour($plainKey),
    ]);

    $payload = [
        'name' => 'Max Mustermann',
        'email' => 'max@example.com',
        'message' => 'Bitte rufen Sie mich an.',
        'tags' => ['website'],
    ];

    $response = $this->postJson('/api/v1/leads', $payload, [
        config('cordinare.lead_api_key_header') => $plainKey,
    ]);

    $response->assertCreated();
    $response->assertJsonPath('data.name', 'Max Mustermann');

    $this->assertDatabaseHas('leads', [
        'tenant_id' => $tenant->id,
        'name' => 'Max Mustermann',
        'email' => 'max@example.com',
    ]);

    expect(Lead::count())->toBe(1);
});

it('rejects invalid api keys', function () {
    Tenant::factory()->create();

    $response = $this->postJson('/api/v1/leads', [
        'name' => 'Max Mustermann',
    ], [
        config('cordinare.lead_api_key_header') => 'cord_invalid',
    ]);

    $response->assertStatus(401);
});
