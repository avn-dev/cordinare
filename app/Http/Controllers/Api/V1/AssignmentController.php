<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAssignmentRequest;
use App\Http\Requests\UpdateAssignmentRequest;
use App\Http\Resources\AssignmentResource;
use App\Models\Assignment;

class AssignmentController extends Controller
{
    public function index()
    {
        $this->authorize('viewAny', Assignment::class);

        $assignments = Assignment::query()
            ->latest()
            ->paginate(20);

        return AssignmentResource::collection($assignments);
    }

    public function store(StoreAssignmentRequest $request)
    {
        $this->authorize('create', Assignment::class);

        $assignment = Assignment::create($request->validated());

        return (new AssignmentResource($assignment))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Assignment $assignment): AssignmentResource
    {
        $this->authorize('view', $assignment);

        return new AssignmentResource($assignment);
    }

    public function update(UpdateAssignmentRequest $request, Assignment $assignment): AssignmentResource
    {
        $this->authorize('update', $assignment);

        $assignment->update($request->validated());

        return new AssignmentResource($assignment);
    }

    public function destroy(Assignment $assignment)
    {
        $this->authorize('delete', $assignment);

        $assignment->delete();

        return response()->noContent();
    }
}
