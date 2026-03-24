<?php

namespace App\Support\Rules;

use App\Models\Absence;
use App\Models\Shift;
use App\Models\TimeEntry;

class RuleEngine
{
    public function evaluateTimeEntry(TimeEntry $timeEntry, Shift $shift): array
    {
        $flags = [];

        if ($timeEntry->break_minutes < 0) {
            $flags[] = 'negative_break';
        }

        if ($timeEntry->check_in_at && $timeEntry->check_out_at && $timeEntry->check_out_at->lt($timeEntry->check_in_at)) {
            $flags[] = 'checkout_before_checkin';
        }

        return $flags;
    }

    public function evaluateAbsence(Absence $absence): array
    {
        $flags = [];

        if ($absence->starts_on && $absence->ends_on && $absence->ends_on->lt($absence->starts_on)) {
            $flags[] = 'invalid_range';
        }

        if ($absence->starts_on && $absence->ends_on) {
            $durationDays = $absence->starts_on->diffInDays($absence->ends_on) + 1;
            if ($durationDays >= 30) {
                $flags[] = 'long_absence';
            }
        }

        if ($absence->type === 'sick' && empty(trim((string) $absence->notes))) {
            $flags[] = 'sick_without_note';
        }

        if ($absence->user_id && $absence->starts_on && $absence->ends_on) {
            $overlap = Absence::query()
                ->where('user_id', $absence->user_id)
                ->where('id', '!=', $absence->id)
                ->whereIn('status', ['pending', 'approved'])
                ->where(function ($query) use ($absence) {
                    $query->whereBetween('starts_on', [$absence->starts_on, $absence->ends_on])
                        ->orWhereBetween('ends_on', [$absence->starts_on, $absence->ends_on])
                        ->orWhere(function ($inner) use ($absence) {
                            $inner->where('starts_on', '<=', $absence->starts_on)
                                ->where('ends_on', '>=', $absence->ends_on);
                        });
                })
                ->exists();

            if ($overlap) {
                $flags[] = 'overlap';
            }
        }

        return $flags;
    }
}
