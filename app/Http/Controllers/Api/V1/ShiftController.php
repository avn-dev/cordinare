<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreShiftRequest;
use App\Http\Requests\UpdateShiftRequest;
use App\Http\Resources\ShiftResource;
use App\Models\Shift;

class ShiftController extends Controller
{
    public function index()
    {
        $this->authorize('viewAny', Shift::class);

        $shifts = Shift::query()
            ->latest()
            ->paginate(20);

        return ShiftResource::collection($shifts);
    }

    public function store(StoreShiftRequest $request)
    {
        $this->authorize('create', Shift::class);

        $shift = Shift::create($request->validated());

        return (new ShiftResource($shift))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Shift $shift): ShiftResource
    {
        $this->authorize('view', $shift);

        return new ShiftResource($shift);
    }

    public function update(UpdateShiftRequest $request, Shift $shift): ShiftResource
    {
        $this->authorize('update', $shift);

        $shift->update($request->validated());

        return new ShiftResource($shift);
    }

    public function destroy(Shift $shift)
    {
        $this->authorize('delete', $shift);

        $shift->delete();

        return response()->noContent();
    }
}
