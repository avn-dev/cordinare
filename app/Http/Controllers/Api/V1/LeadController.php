<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreLeadRequest;
use App\Http\Resources\LeadResource;
use App\Models\Lead;

class LeadController extends Controller
{
    public function store(StoreLeadRequest $request)
    {
        $data = $request->validated();

        $data['meta'] = array_merge($data['meta'] ?? [], [
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        $lead = Lead::create($data);

        return (new LeadResource($lead))
            ->response()
            ->setStatusCode(201);
    }
}
