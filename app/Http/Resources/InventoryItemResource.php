<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InventoryItemResource extends JsonResource
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
            'name' => $this->name,
            'category' => $this->category,
            'serial_number' => $this->serial_number,
            'status' => $this->status,
            'condition' => $this->condition,
            'quantity' => $this->quantity,
            'unit' => $this->unit,
            'last_seen_at' => $this->last_seen_at?->toIso8601String(),
            'site' => $this->whenLoaded('site', function () {
                return $this->site
                    ? ['id' => $this->site->id, 'name' => $this->site->name]
                    : null;
            }),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
