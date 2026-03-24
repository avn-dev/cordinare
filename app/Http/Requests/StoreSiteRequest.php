<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Support\Tenancy\TenantContext;

class StoreSiteRequest extends FormRequest
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
        $tenantId = app(TenantContext::class)->tenantId();

        return [
            'customer_id' => ['required', 'integer', Rule::exists('customers', 'id')->where('tenant_id', $tenantId)],
            'name' => ['required', 'string', 'max:255'],
            'status' => ['nullable', 'string', 'max:50'],
            'address_line1' => ['nullable', 'string', 'max:255'],
            'address_line2' => ['nullable', 'string', 'max:255'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'city' => ['nullable', 'string', 'max:255'],
            'country' => ['nullable', 'string', 'size:2'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'time_windows' => ['nullable', 'array'],
            'time_windows.*.day' => ['required_with:time_windows', 'string', 'max:20'],
            'time_windows.*.from' => ['required_with:time_windows', 'date_format:H:i'],
            'time_windows.*.to' => ['required_with:time_windows', 'date_format:H:i'],
            'closures' => ['nullable', 'array'],
            'closures.*.day_of_week' => ['required_with:closures', 'integer', 'between:0,6'],
            'closures.*.starts_at' => ['required_with:closures', 'date_format:H:i'],
            'closures.*.ends_at' => ['required_with:closures', 'date_format:H:i'],
            'closures.*.label' => ['nullable', 'string', 'max:255'],
            'access_notes' => ['nullable', 'string', 'max:5000'],
            'special_instructions' => ['nullable', 'string', 'max:5000'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $closures = $this->input('closures');
            if (! is_array($closures)) {
                return;
            }

            foreach ($closures as $index => $closure) {
                $start = $closure['starts_at'] ?? null;
                $end = $closure['ends_at'] ?? null;
                if (! $start || ! $end) {
                    continue;
                }
                if ($start >= $end) {
                    $validator->errors()->add("closures.$index.ends_at", 'Schließzeit muss nach Startzeit liegen.');
                }
            }
        });
    }
}
