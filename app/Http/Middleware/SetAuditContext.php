<?php

namespace App\Http\Middleware;

use App\Support\Audit\AuditContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetAuditContext
{
    public function handle(Request $request, Closure $next): Response
    {
        $context = app(AuditContext::class);
        $context->actor = $request->user();
        $context->ip = $request->ip();
        $context->userAgent = $request->userAgent();
        $context->requestId = $request->header('X-Request-Id');

        return $next($request);
    }
}
