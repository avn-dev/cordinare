<?php

declare(strict_types=1);

use App\Enums\UserRole;
use App\Models\Assignment;
use App\Models\Shift;
use App\Models\Site;
use App\Models\Tenant;
use App\Models\User;

it('shows employee portal with assigned shifts', function () {
    $tenant = Tenant::factory()->create();
    $user = User::factory()->create([
        'tenant_id' => $tenant->id,
        'role' => UserRole::Employee,
    ]);
    $site = Site::factory()->create(['tenant_id' => $tenant->id]);
    $shift = Shift::factory()->create([
        'tenant_id' => $tenant->id,
        'site_id' => $site->id,
        'title' => 'Fruehschicht',
    ]);
    Assignment::factory()->create([
        'tenant_id' => $tenant->id,
        'shift_id' => $shift->id,
        'user_id' => $user->id,
    ]);

    $this->actingAs($user)
        ->get('/my')
        ->assertOk()
        ->assertSee('Fruehschicht');
});
