<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use App\Support\Security\ApiKey;
use App\Support\Tenancy\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetTenantFromApiKey
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $headerName = config('cordinare.lead_api_key_header', 'X-Lead-Api-Key');
        $plainKey = $request->header($headerName);

        if (! $plainKey) {
            return response()->json(['message' => 'Missing API key.'], Response::HTTP_UNAUTHORIZED);
        }

        $tenant = Tenant::query()
            ->where('api_key_hash', ApiKey::hash($plainKey))
            ->first();

        if (! $tenant) {
            return response()->json(['message' => 'Invalid API key.'], Response::HTTP_UNAUTHORIZED);
        }

        app(TenantContext::class)->setTenant($tenant);

        return $next($request);
    }
}
