<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreInventoryItemRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'site_id' => [
                'nullable',
                'integer',
                'exists:sites,id',
                function (string $attribute, $value, $fail): void {
                    if ($value === null) {
                        return;
                    }
                    $tenantId = $this->user()?->tenant_id;
                    if (! $tenantId) {
                        return;
                    }
                    $exists = \App\Models\Site::query()
                        ->where('id', $value)
                        ->where('tenant_id', $tenantId)
                        ->exists();
                    if (! $exists) {
                        $fail('Das Objekt ist nicht verfügbar.');
                    }
                },
            ],
            'name' => ['required', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:120'],
            'serial_number' => ['nullable', 'string', 'max:120'],
            'status' => ['nullable', 'string', 'max:50'],
            'condition' => ['nullable', 'string', 'max:50'],
            'quantity' => ['required', 'numeric', 'min:0.01'],
            'unit' => ['nullable', 'string', 'max:20'],
            'last_seen_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
            'meta' => ['nullable', 'array'],
        ];
    }
}
