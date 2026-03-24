<?php

namespace Database\Factories;

use App\Models\AuditLog;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\AuditLog>
 */
class AuditLogFactory extends Factory
{
    protected $model = AuditLog::class;

    public function definition(): array
    {
        return [
            'tenant_id' => Tenant::factory(),
            'actor_id' => User::factory(),
            'action' => $this->faker->randomElement(['created', 'updated', 'deleted']),
            'auditable_type' => $this->faker->randomElement([
                'App\\Models\\Offer',
                'App\\Models\\Shift',
                'App\\Models\\Assignment',
                'App\\Models\\TimeEntry',
                'App\\Models\\Absence',
            ]),
            'auditable_id' => $this->faker->numberBetween(1, 1000),
            'before' => ['status' => 'pending'],
            'after' => ['status' => 'approved'],
            'ip' => $this->faker->ipv4(),
            'user_agent' => $this->faker->userAgent(),
            'request_id' => $this->faker->uuid(),
        ];
    }
}
