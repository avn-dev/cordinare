<?php

use App\Models\Lead;
use App\Models\Tenant;
use App\Support\Tenancy\TenantContext;

it('scopes leads to the current tenant context', function () {
    $tenantA = Tenant::factory()->create();
    $tenantB = Tenant::factory()->create();

    Lead::factory()->create(['tenant_id' => $tenantA->id, 'name' => 'A']);
    Lead::factory()->create(['tenant_id' => $tenantB->id, 'name' => 'B']);

    app(TenantContext::class)->setTenant($tenantA);

    $visibleLeads = Lead::query()->get();

    expect($visibleLeads)->toHaveCount(1);
    expect($visibleLeads->first()->name)->toBe('A');
});
