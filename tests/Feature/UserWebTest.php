<?php

use App\Enums\UserRole;
use App\Models\Tenant;
use App\Models\User;

it('allows admins to create, edit, and delete users', function () {
    $tenant = Tenant::factory()->create();
    $admin = User::factory()->create([
        'tenant_id' => $tenant->id,
        'role' => UserRole::FirmAdmin,
    ]);

    $this->actingAs($admin);

    $create = $this->post('/users', [
        'name' => 'Mitarbeiter A',
        'email' => 'mitarbeiter-a@example.com',
        'role' => UserRole::Employee->value,
        'password' => 'secret-password',
    ]);

    $create->assertRedirect();

    $user = User::query()->where('email', 'mitarbeiter-a@example.com')->first();
    expect($user)->not->toBeNull();

    $update = $this->put("/users/{$user->id}", [
        'name' => 'Mitarbeiter B',
        'email' => 'mitarbeiter-b@example.com',
        'role' => UserRole::Hr->value,
    ]);

    $update->assertRedirect();
    $user->refresh();
    expect($user->name)->toBe('Mitarbeiter B');

    $delete = $this->delete("/users/{$user->id}");
    $delete->assertRedirect();
    expect(User::query()->where('email', 'mitarbeiter-b@example.com')->exists())->toBeFalse();
});
