<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAbsenceRequest;
use App\Http\Requests\UpdateAbsenceRequest;
use App\Http\Resources\AbsenceResource;
use App\Models\Absence;
use App\Enums\UserRole;

class AbsenceController extends Controller
{
    public function index()
    {
        $this->authorize('viewAny', Absence::class);

        $filters = [
            'status' => request()->string('status')->toString(),
            'type' => request()->string('type')->toString(),
            'user_id' => request()->integer('user_id') ?: null,
            'from' => request()->string('from')->toString(),
            'to' => request()->string('to')->toString(),
            'flag' => request()->string('flag')->toString(),
        ];

        $absences = Absence::query()
            ->with('user')
            ->when($filters['status'], fn ($query, $status) => $query->where('status', $status))
            ->when($filters['type'], fn ($query, $type) => $query->where('type', $type))
            ->when($filters['user_id'], fn ($query, $userId) => $query->where('user_id', $userId))
            ->when($filters['from'], fn ($query, $from) => $query->whereDate('starts_on', '>=', $from))
            ->when($filters['to'], fn ($query, $to) => $query->whereDate('ends_on', '<=', $to))
            ->when($filters['flag'], fn ($query, $flag) => $query->whereJsonContains('rule_flags', $flag))
            ->latest()
            ->paginate(20);

        return AbsenceResource::collection($absences);
    }

    public function store(StoreAbsenceRequest $request)
    {
        $this->authorize('create', Absence::class);

        $payload = $request->validated();
        $user = $request->user();
        if ($user && $user->role === UserRole::Employee) {
            $payload['user_id'] = $user->id;
            $payload['status'] = 'pending';
        }

        $absence = Absence::create($payload);

        return (new AbsenceResource($absence->load('user')))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Absence $absence): AbsenceResource
    {
        $this->authorize('view', $absence);

        return new AbsenceResource($absence->load('user'));
    }

    public function update(UpdateAbsenceRequest $request, Absence $absence): AbsenceResource
    {
        $this->authorize('update', $absence);

        $payload = $request->validated();
        $user = $request->user();
        if ($user && $user->role === UserRole::Employee) {
            unset($payload['user_id']);
            unset($payload['status']);
        }

        $absence->update($payload);

        return new AbsenceResource($absence->load('user'));
    }

    public function destroy(Absence $absence)
    {
        $this->authorize('delete', $absence);

        $absence->delete();

        return response()->noContent();
    }
}
