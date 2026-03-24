<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AbsenceResource extends JsonResource
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
            'user_id' => $this->user_id,
            'user' => $this->whenLoaded('user', fn () => [
                'id' => $this->user?->id,
                'name' => $this->user?->name,
                'email' => $this->user?->email,
            ]),
            'type' => $this->type,
            'starts_on' => optional($this->starts_on)->toDateString(),
            'ends_on' => optional($this->ends_on)->toDateString(),
            'status' => $this->status,
            'notes' => $this->notes,
            'rule_flags' => $this->rule_flags ?? [],
            'created_at' => optional($this->created_at)->toIso8601String(),
        ];
    }
}
