<?php

namespace App\Support\Exports;

use App\Models\AuditLog;

class AuditLogCsvExporter
{
    public static function writeToHandle($handle, string $tenantId, array $filters = []): void
    {
        fputcsv($handle, [
            'id',
            'action',
            'auditable_type',
            'auditable_id',
            'actor_id',
            'actor_name',
            'ip',
            'request_id',
            'before',
            'after',
            'created_at',
        ]);

        $query = AuditLog::query()
            ->where('tenant_id', $tenantId);

        if (! empty($filters['action'])) {
            $query->where('action', $filters['action']);
        }

        if (! empty($filters['auditable_type'])) {
            $query->where('auditable_type', $filters['auditable_type']);
        }

        if (! empty($filters['actor_id'])) {
            $query->where('actor_id', $filters['actor_id']);
        }

        if (! empty($filters['request_id'])) {
            $query->where('request_id', $filters['request_id']);
        }

        if (! empty($filters['from'])) {
            $query->whereDate('created_at', '>=', $filters['from']);
        }

        if (! empty($filters['to'])) {
            $query->whereDate('created_at', '<=', $filters['to']);
        }

        $query
            ->with('actor:id,name')
            ->orderBy('created_at')
            ->chunk(200, function ($logs) use ($handle) {
                foreach ($logs as $log) {
                    fputcsv($handle, [
                        $log->id,
                        $log->action,
                        $log->auditable_type,
                        $log->auditable_id,
                        $log->actor_id,
                        $log->actor?->name,
                        $log->ip,
                        $log->request_id,
                        $log->before ? json_encode($log->before) : null,
                        $log->after ? json_encode($log->after) : null,
                        optional($log->created_at)->toIso8601String(),
                    ]);
                }
            });
    }
}
