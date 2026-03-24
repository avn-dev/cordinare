<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateShiftTemplateRequest extends FormRequest
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
                'required',
                'integer',
                'exists:sites,id',
                function (string $attribute, $value, $fail): void {
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
            'schedule_blocks' => ['required', 'array', 'min:1', 'max:7'],
            'schedule_blocks.*.day_of_week' => ['required', 'integer', 'between:0,6'],
            'schedule_blocks.*.starts_at' => ['required', 'date_format:H:i'],
            'schedule_blocks.*.ends_at' => ['required', 'date_format:H:i'],
            'status' => ['nullable', 'string', 'max:50'],
            'active' => ['boolean'],
            'notes' => ['nullable', 'string'],
            'generate_weeks' => ['nullable', 'integer', 'min:0', 'max:12'],
            'assigned_user_ids' => ['nullable', 'array'],
            'assigned_user_ids.*' => ['integer', 'exists:users,id'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $blocks = $this->input('schedule_blocks');
            if (! is_array($blocks) || $blocks === []) {
                $validator->errors()->add('schedule_blocks', 'Bitte mindestens einen Wochentag mit Zeitfenster angeben.');
            } else {
                foreach ($blocks as $index => $block) {
                    $start = $block['starts_at'] ?? null;
                    $end = $block['ends_at'] ?? null;
                    if ($start && $end && $start >= $end) {
                        $validator->errors()->add("schedule_blocks.$index.ends_at", 'Endzeit muss nach Startzeit liegen.');
                    }
                }
            }

            $userIds = $this->input('assigned_user_ids');
            if (! is_array($userIds) || $userIds === []) {
                return;
            }

            $tenantId = $this->user()?->tenant_id;
            if (! $tenantId) {
                return;
            }

            $count = \App\Models\User::query()
                ->whereIn('id', $userIds)
                ->where('tenant_id', $tenantId)
                ->count();

            if ($count !== count(array_unique($userIds))) {
                $validator->errors()->add('assigned_user_ids', 'Mindestens ein Mitarbeiter ist nicht verfügbar.');
            }
        });
    }
}
