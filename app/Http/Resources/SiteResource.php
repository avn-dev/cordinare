<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SiteResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'customer_id' => $this->customer_id,
            'customer' => $this->whenLoaded('customer', fn () => [
                'id' => $this->customer?->id,
                'name' => $this->customer?->name,
            ]),
            'name' => $this->name,
            'status' => $this->status,
            'starts_on' => $this->starts_on?->toDateString(),
            'address_line1' => $this->address_line1,
            'address_line2' => $this->address_line2,
            'postal_code' => $this->postal_code,
            'city' => $this->city,
            'country' => $this->country,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'time_windows' => $this->time_windows,
            'qm_token' => $this->qm_token,
            'closures' => $this->whenLoaded('closures', function () {
                return $this->closures->map(fn ($closure) => [
                    'id' => $closure->id,
                    'closure_type' => $closure->closure_type ?? 'weekly',
                    'day_of_week' => $closure->day_of_week,
                    'starts_on' => $closure->starts_on?->toDateString(),
                    'ends_on' => $closure->ends_on?->toDateString(),
                    'starts_at' => $closure->starts_at,
                    'ends_at' => $closure->ends_at,
                    'label' => $closure->label,
                ]);
            }),
            'access_notes' => $this->access_notes,
            'special_instructions' => $this->special_instructions,
            'created_at' => optional($this->created_at)->toIso8601String(),
        ];
    }
}
