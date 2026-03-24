<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Carbon\Carbon;
use App\Models\SiteClosure;

class UpdateShiftRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

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
            'title' => ['nullable', 'string', 'max:255'],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['required', 'date', 'after:starts_at'],
            'assigned_user_ids' => ['nullable', 'array'],
            'assigned_user_ids.*' => ['integer', 'exists:users,id'],
            'status' => ['nullable', 'string', 'max:50'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
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

        $validator->after(function ($validator): void {
            $siteId = $this->input('site_id');
            $startsAt = $this->input('starts_at');
            $endsAt = $this->input('ends_at');
            if (! $siteId || ! $startsAt || ! $endsAt) {
                return;
            }

            $start = Carbon::parse($startsAt);
            $end = Carbon::parse($endsAt);

            $current = $start->copy()->startOfDay();
            $last = $end->copy()->startOfDay();

            while ($current->lte($last)) {
                $dayOfWeek = $current->dayOfWeekIso - 1;
                $closures = SiteClosure::query()
                    ->where('site_id', $siteId)
                    ->where('day_of_week', $dayOfWeek)
                    ->get();

                foreach ($closures as $closure) {
                    $closureStart = $current->copy()->setTimeFromTimeString($closure->starts_at);
                    $closureEnd = $current->copy()->setTimeFromTimeString($closure->ends_at);

                    if ($start->lt($closureEnd) && $end->gt($closureStart)) {
                        $label = $closure->label ? " ({$closure->label})" : '';
                        $validator->errors()->add('starts_at', 'Schicht kollidiert mit Schließzeit'.$label.'.');
                        return;
                    }
                }

                $current->addDay();
            }
        });
    }
}
