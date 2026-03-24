<?php

namespace App\Support\Exports;

use App\Models\Absence;

class AbsenceCsvExporter
{
    public static function writeToHandle($handle, string $tenantId, array $filters = []): void
    {
        fputcsv($handle, [
            'id',
            'user_id',
            'user_name',
            'type',
            'starts_on',
            'ends_on',
            'status',
            'notes',
            'rule_flags',
            'created_at',
        ]);

        $query = Absence::query()
            ->where('tenant_id', $tenantId);

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (! empty($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        if (! empty($filters['from'])) {
            $query->whereDate('starts_on', '>=', $filters['from']);
        }

        if (! empty($filters['to'])) {
            $query->whereDate('ends_on', '<=', $filters['to']);
        }

        if (! empty($filters['flag'])) {
            $query->whereJsonContains('rule_flags', $filters['flag']);
        }

        $query
            ->with('user:id,name')
            ->orderBy('created_at')
            ->chunk(200, function ($absences) use ($handle) {
                foreach ($absences as $absence) {
                    fputcsv($handle, [
                        $absence->id,
                        $absence->user_id,
                        $absence->user?->name,
                        $absence->type,
                        optional($absence->starts_on)->toDateString(),
                        optional($absence->ends_on)->toDateString(),
                        $absence->status,
                        $absence->notes,
                        $absence->rule_flags ? json_encode($absence->rule_flags) : null,
                        optional($absence->created_at)->toIso8601String(),
                    ]);
                }
            });
    }
}
