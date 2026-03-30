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
            'starts_on' => ['nullable', 'date'],
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
            'closures.*.closure_type' => ['required_with:closures', 'string', Rule::in(['weekly', 'date_range'])],
            'closures.*.day_of_week' => ['nullable', 'integer', 'between:0,6'],
            'closures.*.starts_on' => ['nullable', 'date'],
            'closures.*.ends_on' => ['nullable', 'date'],
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
                $type = $closure['closure_type'] ?? 'weekly';
                $start = $closure['starts_at'] ?? null;
                $end = $closure['ends_at'] ?? null;
                if (! $start || ! $end) {
                    continue;
                }
                if ($start >= $end) {
                    $validator->errors()->add("closures.$index.ends_at", 'Schließzeit muss nach Startzeit liegen.');
                }
                if ($type === 'weekly' && ! isset($closure['day_of_week'])) {
                    $validator->errors()->add("closures.$index.day_of_week", 'Wochentag ist erforderlich.');
                }
                if ($type === 'date_range') {
                    $startsOn = $closure['starts_on'] ?? null;
                    $endsOn = $closure['ends_on'] ?? null;
                    if (! $startsOn || ! $endsOn) {
                        $validator->errors()->add("closures.$index.starts_on", 'Datumsbereich ist erforderlich.');
                    } elseif ($startsOn > $endsOn) {
                        $validator->errors()->add("closures.$index.ends_on", 'Enddatum muss nach dem Startdatum liegen.');
                    }
                }
            }
        });
    }
}
