<?php

namespace Database\Factories;

use App\Support\Security\ApiKey;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Tenant>
 */
class TenantFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $plainKey = ApiKey::generate();

        return [
            'name' => fake()->company(),
            'slug' => Str::slug(fake()->unique()->company()).'-'.fake()->randomNumber(3, true),
            'timezone' => 'Europe/Berlin',
            'locale' => 'de',
            'data_retention_days' => 365,
            'api_key_hash' => ApiKey::hash($plainKey),
            'api_key_prefix' => ApiKey::prefix($plainKey),
            'api_key_last_four' => ApiKey::lastFour($plainKey),
        ];
    }
}
