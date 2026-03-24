<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TimeEntryResource extends JsonResource
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
            'shift_id' => $this->shift_id,
            'user_id' => $this->user_id,
            'shift' => $this->whenLoaded('shift', fn () => [
                'id' => $this->shift?->id,
                'title' => $this->shift?->title,
                'site' => $this->shift?->site ? [
                    'id' => $this->shift->site->id,
                    'name' => $this->shift->site->name,
                    'latitude' => $this->shift->site->latitude !== null ? (float) $this->shift->site->latitude : null,
                    'longitude' => $this->shift->site->longitude !== null ? (float) $this->shift->site->longitude : null,
                    'address_line1' => $this->shift->site->address_line1,
                    'address_line2' => $this->shift->site->address_line2,
                    'postal_code' => $this->shift->site->postal_code,
                    'city' => $this->shift->site->city,
                    'country' => $this->shift->site->country,
                ] : null,
            ]),
            'user' => $this->whenLoaded('user', fn () => [
                'id' => $this->user?->id,
                'name' => $this->user?->name,
                'email' => $this->user?->email,
            ]),
            'check_in_at' => optional($this->check_in_at)->toIso8601String(),
            'check_out_at' => optional($this->check_out_at)->toIso8601String(),
            'break_minutes' => $this->break_minutes,
            'gps' => $this->gps,
            'notes' => $this->notes,
            'created_at' => optional($this->created_at)->toIso8601String(),
        ];
    }
}
