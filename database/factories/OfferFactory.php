<?php

namespace Database\Factories;

use App\Models\Customer;
use App\Models\Site;
use App\Models\Tenant;
use App\Support\Security\OfferNumber;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Offer>
 */
class OfferFactory extends Factory
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
            'site_id' => Site::factory(),
            'number' => OfferNumber::generate(),
            'version' => 1,
            'status' => 'draft',
            'currency' => 'EUR',
            'valid_until' => now()->addDays(14),
            'notes' => fake()->optional()->sentence(),
        ];
    }
}
