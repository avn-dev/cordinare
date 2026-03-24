<?php

use App\Enums\UserRole;
use App\Models\Shift;
use App\Models\Site;
use App\Models\Tenant;
use App\Models\User;

it('allows admins to create, edit, and delete shifts', function () {
    $tenant = Tenant::factory()->create();
    $admin = User::factory()->create([
        'tenant_id' => $tenant->id,
        'role' => UserRole::FirmAdmin,
    ]);

    $site = Site::factory()->create([
        'tenant_id' => $tenant->id,
    ]);

    $this->actingAs($admin);

    $create = $this->post('/shifts', [
        'site_id' => $site->id,
        'title' => 'Schicht A',
        'starts_at' => now()->addDay()->toDateTimeString(),
        'ends_at' => now()->addDay()->addHours(2)->toDateTimeString(),
        'status' => 'scheduled',
        'required_roles' => ['employee'],
    ]);

    $create->assertRedirect();

    $shift = Shift::first();
    expect($shift)->not->toBeNull();

    $update = $this->put("/shifts/{$shift->id}", [
        'site_id' => $site->id,
        'title' => 'Schicht B',
        'starts_at' => now()->addDays(2)->toDateTimeString(),
        'ends_at' => now()->addDays(2)->addHours(1)->toDateTimeString(),
        'status' => 'completed',
        'required_roles' => ['dispatcher'],
    ]);

    $update->assertRedirect();
    $shift->refresh();
    expect($shift->title)->toBe('Schicht B');

    $delete = $this->delete("/shifts/{$shift->id}");
    $delete->assertRedirect();
    expect(Shift::query()->count())->toBe(0);
});
