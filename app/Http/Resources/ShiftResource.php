<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Http\Resources\AssignmentResource;

class ShiftResource extends JsonResource
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
            'site_id' => $this->site_id,
            'site' => $this->whenLoaded('site', fn () => [
                'id' => $this->site?->id,
                'name' => $this->site?->name,
            ]),
            'title' => $this->title,
            'starts_at' => optional($this->starts_at)->toIso8601String(),
            'ends_at' => optional($this->ends_at)->toIso8601String(),
            'required_roles' => $this->required_roles,
            'status' => $this->status,
            'assignments' => $this->whenLoaded('assignments', fn () => AssignmentResource::collection($this->assignments)),
            'created_at' => optional($this->created_at)->toIso8601String(),
        ];
    }
}
