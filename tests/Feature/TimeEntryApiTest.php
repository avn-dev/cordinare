<?php

use App\Enums\UserRole;
use App\Models\Shift;
use App\Models\Site;
use App\Models\Tenant;
use App\Models\TimeEntry;
use App\Models\User;
use App\Models\Assignment;

it('allows an employee to check in and out', function () {
    $tenant = Tenant::factory()->create();
    $user = User::factory()->create([
        'tenant_id' => $tenant->id,
        'role' => UserRole::Employee,
    ]);

    $site = Site::factory()->create(['tenant_id' => $tenant->id]);
    $shift = Shift::factory()->create([
        'tenant_id' => $tenant->id,
        'site_id' => $site->id,
        'starts_at' => now()->subHour(),
        'ends_at' => now()->addHours(2),
    ]);

    Assignment::factory()->create([
        'tenant_id' => $tenant->id,
        'shift_id' => $shift->id,
        'user_id' => $user->id,
        'role' => 'employee',
        'status' => 'assigned',
    ]);

    $this->actingAs($user);

    $checkIn = $this->postJson('/api/v1/time-entries/check-in', [
        'shift_id' => $shift->id,
        'latitude' => 52.52,
        'longitude' => 13.405,
        'accuracy' => 12,
    ]);

    $checkIn->assertCreated();

    $entryId = $checkIn->json('data.id');

    $checkOut = $this->postJson("/api/v1/time-entries/{$entryId}/check-out", [
        'break_minutes' => 30,
        'latitude' => 52.52,
        'longitude' => 13.405,
        'accuracy' => 10,
        'notes' => 'Alles erledigt.',
    ]);

    $checkOut->assertOk();

    $this->assertDatabaseHas('time_entries', [
        'id' => $entryId,
        'tenant_id' => $tenant->id,
        'user_id' => $user->id,
    ]);

    expect(TimeEntry::find($entryId)->check_out_at)->not->toBeNull();
});
