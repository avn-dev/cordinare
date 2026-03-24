<?php

use App\Models\Assignment;
use App\Models\Shift;
use App\Models\Site;
use App\Models\User;
use Carbon\Carbon;

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$user = User::where('role', 'employee')->first();
if (! $user) {
    echo "No employee user found.\n";
    exit(1);
}

$site = Site::where('tenant_id', $user->tenant_id)->first();
if (! $site) {
    echo "No site found for tenant.\n";
    exit(1);
}

$now = Carbon::now($user->tenant?->timezone ?? config('app.timezone'));
$startsAt = $now->copy()->subMinutes(10);
$endsAt = $now->copy()->addHours(2);

$shift = Shift::create([
    'tenant_id' => $user->tenant_id,
    'site_id' => $site->id,
    'title' => 'Mitarbeiter Check-in Test',
    'starts_at' => $startsAt,
    'ends_at' => $endsAt,
    'status' => 'scheduled',
]);

Assignment::create([
    'tenant_id' => $user->tenant_id,
    'shift_id' => $shift->id,
    'user_id' => $user->id,
    'role' => $user->role?->value ?? 'employee',
    'status' => 'assigned',
]);

echo "Created shift #{$shift->id} for user #{$user->id} (".$user->email.")\n";
