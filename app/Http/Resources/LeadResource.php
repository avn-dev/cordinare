<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LeadResource extends JsonResource
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
            'status' => $this->status,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'message' => $this->message,
            'source' => $this->source,
            'tags' => $this->tags,
            'meta' => $this->meta,
            'follow_up_at' => optional($this->follow_up_at)->toIso8601String(),
            'converted_customer_id' => $this->converted_customer_id,
            'created_at' => optional($this->created_at)->toIso8601String(),
        ];
    }
}
