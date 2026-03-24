<?php

namespace App\Support\Exports;

use App\Models\TimeEntry;

class TimeEntryCsvExporter
{
    public static function writeToHandle($handle, string $tenantId, array $filters = []): void
    {
        fputcsv($handle, [
            'id',
            'shift_id',
            'user_id',
            'check_in_at',
            'check_out_at',
            'break_minutes',
            'anomaly_flags',
            'created_at',
        ]);

        $query = TimeEntry::query()
            ->where('tenant_id', $tenantId);

        if (! empty($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        if (! empty($filters['shift_id'])) {
            $query->where('shift_id', $filters['shift_id']);
        }

        if (! empty($filters['from'])) {
            $query->whereDate('check_in_at', '>=', $filters['from']);
        }

        if (! empty($filters['to'])) {
            $query->whereDate('check_in_at', '<=', $filters['to']);
        }

        if (! empty($filters['flag'])) {
            $query->whereJsonContains('anomaly_flags', $filters['flag']);
        }

        $query
            ->orderBy('created_at')
            ->chunk(200, function ($entries) use ($handle) {
                foreach ($entries as $entry) {
                    fputcsv($handle, [
                        $entry->id,
                        $entry->shift_id,
                        $entry->user_id,
                        optional($entry->check_in_at)->toIso8601String(),
                        optional($entry->check_out_at)->toIso8601String(),
                        $entry->break_minutes,
                        $entry->anomaly_flags ? json_encode($entry->anomaly_flags) : null,
                        optional($entry->created_at)->toIso8601String(),
                    ]);
                }
            });
    }
}
