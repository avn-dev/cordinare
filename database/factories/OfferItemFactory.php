<?php

namespace Database\Factories;

use App\Models\Offer;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\OfferItem>
 */
class OfferItemFactory extends Factory
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
            'offer_id' => Offer::factory(),
            'description' => fake()->sentence(),
            'quantity' => fake()->randomFloat(2, 1, 10),
            'unit' => 'Std',
            'unit_price' => fake()->randomFloat(2, 20, 120),
            'interval' => 'monatlich',
        ];
    }
}
