<?php

namespace App\Models\Concerns;

use App\Models\AuditLog;
use App\Support\Audit\AuditContext;
use App\Support\Tenancy\TenantContext;
use Illuminate\Database\Eloquent\Model;

trait Auditable
{
    protected static function bootAuditable(): void
    {
        static::created(function (Model $model): void {
            $model->writeAuditLog('created', null, $model->getAttributes());
        });

        static::updated(function (Model $model): void {
            $changes = $model->getChanges();
            if (empty($changes)) {
                return;
            }

            $before = [];
            foreach (array_keys($changes) as $key) {
                $before[$key] = $model->getOriginal($key);
            }

            $model->writeAuditLog('updated', $before, $changes);
        });

        static::deleted(function (Model $model): void {
            $model->writeAuditLog('deleted', $model->getOriginal(), null);
        });
    }

    protected function writeAuditLog(string $action, ?array $before, ?array $after): void
    {
        if ($this instanceof AuditLog) {
            return;
        }

        $context = app(AuditContext::class);
        $tenantId = $this->tenant_id ?? app(TenantContext::class)->tenantId();

        AuditLog::create([
            'tenant_id' => $tenantId,
            'actor_id' => $context->actor?->id,
            'action' => $action,
            'auditable_type' => $this->getMorphClass(),
            'auditable_id' => $this->getKey(),
            'before' => $before,
            'after' => $after,
            'ip' => $context->ip,
            'user_agent' => $context->userAgent,
            'request_id' => $context->requestId,
        ]);
    }
}
