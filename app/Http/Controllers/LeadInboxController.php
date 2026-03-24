<?php

namespace App\Http\Controllers;

use App\Http\Resources\LeadResource;
use App\Models\Lead;
use Inertia\Inertia;

class LeadInboxController extends Controller
{
    public function index()
    {
        $this->authorize('viewAny', Lead::class);

        $leads = Lead::query()
            ->latest()
            ->paginate(20);

        return Inertia::render('leads/index', [
            'leads' => LeadResource::collection($leads),
        ]);
    }
}
