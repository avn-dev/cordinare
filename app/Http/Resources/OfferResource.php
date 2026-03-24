<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OfferResource extends JsonResource
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
            'site_id' => $this->site_id,
            'customer' => $this->whenLoaded('customer', fn () => [
                'id' => $this->customer?->id,
                'name' => $this->customer?->name,
            ]),
            'site' => $this->whenLoaded('site', fn () => [
                'id' => $this->site?->id,
                'name' => $this->site?->name,
            ]),
            'number' => $this->number,
            'version' => $this->version,
            'status' => $this->status,
            'currency' => $this->currency,
            'valid_until' => optional($this->valid_until)->toDateString(),
            'notes' => $this->notes,
            'sent_at' => optional($this->sent_at)->toIso8601String(),
            'created_at' => optional($this->created_at)->toIso8601String(),
            'items' => $this->items->map(function ($item) {
                return [
                    'id' => $item->id,
                    'description' => $item->description,
                    'quantity' => (float) $item->quantity,
                    'unit' => $item->unit,
                    'unit_price' => (float) $item->unit_price,
                    'interval' => $item->interval,
                ];
            }),
            'total' => $this->totalAmount(),
        ];
    }
}
