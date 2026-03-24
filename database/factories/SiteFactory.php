<?php

namespace Database\Factories;

use App\Models\Customer;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Site>
 */
class SiteFactory extends Factory
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
            'customer_id' => Customer::factory(),
            'name' => fake()->company().' Standort',
            'status' => 'active',
            'address_line1' => fake()->streetAddress(),
            'address_line2' => fake()->optional()->secondaryAddress(),
            'postal_code' => fake()->postcode(),
            'city' => fake()->city(),
            'country' => 'DE',
            'latitude' => fake()->optional()->latitude(47.0, 54.0),
            'longitude' => fake()->optional()->longitude(6.0, 14.5),
            'time_windows' => [
                ['day' => 'monday', 'from' => '06:00', 'to' => '10:00'],
                ['day' => 'thursday', 'from' => '18:00', 'to' => '21:00'],
            ],
            'access_notes' => fake()->optional()->sentence(),
            'special_instructions' => fake()->optional()->sentence(),
        ];
    }
}
