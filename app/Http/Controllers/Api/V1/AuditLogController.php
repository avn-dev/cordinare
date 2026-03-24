<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\AuditLogResource;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', AuditLog::class);

        $filters = [
            'action' => $request->string('action')->toString(),
            'auditable_type' => $request->string('auditable_type')->toString(),
            'actor_id' => $request->integer('actor_id') ?: null,
            'request_id' => $request->string('request_id')->toString(),
            'from' => $request->string('from')->toString(),
            'to' => $request->string('to')->toString(),
        ];

        $logs = AuditLog::query()
            ->with('actor')
            ->when($filters['action'], fn ($query, $action) => $query->where('action', $action))
            ->when($filters['auditable_type'], fn ($query, $type) => $query->where('auditable_type', $type))
            ->when($filters['actor_id'], fn ($query, $actorId) => $query->where('actor_id', $actorId))
            ->when($filters['request_id'], fn ($query, $requestId) => $query->where('request_id', $requestId))
            ->when($filters['from'], fn ($query, $from) => $query->whereDate('created_at', '>=', $from))
            ->when($filters['to'], fn ($query, $to) => $query->whereDate('created_at', '<=', $to))
            ->latest()
            ->paginate(25)
            ->withQueryString();

        return AuditLogResource::collection($logs);
    }
}
