<?php

namespace Database\Factories;

use App\Models\Site;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Shift>
 */
class ShiftFactory extends Factory
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
            'site_id' => Site::factory(),
            'title' => fake()->sentence(3),
            'starts_at' => now()->addDays(fake()->numberBetween(0, 7))->setTime(6, 0),
            'ends_at' => now()->addDays(fake()->numberBetween(0, 7))->setTime(14, 0),
            'required_roles' => ['employee'],
            'status' => 'scheduled',
        ];
    }
}
