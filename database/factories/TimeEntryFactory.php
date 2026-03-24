<?php

namespace Database\Factories;

use App\Models\Shift;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\TimeEntry>
 */
class TimeEntryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'tenant_id' => Tenant::factory(),
            'shift_id' => Shift::factory(),
            'user_id' => User::factory(),
            'check_in_at' => now()->subHours(2),
            'check_out_at' => now(),
            'break_minutes' => 30,
            'gps' => [
                'latitude' => fake()->latitude(47.0, 54.0),
                'longitude' => fake()->longitude(6.0, 14.5),
                'accuracy' => fake()->randomFloat(1, 3, 20),
            ],
            'notes' => fake()->optional()->sentence(),
        ];
    }
}
