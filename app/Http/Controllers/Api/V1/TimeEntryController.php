<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\CheckInRequest;
use App\Http\Requests\CheckOutRequest;
use App\Http\Resources\TimeEntryResource;
use App\Models\Assignment;
use App\Models\Shift;
use App\Models\TimeEntry;
use Illuminate\Validation\ValidationException;
use App\Enums\UserRole;
use App\Support\Geo\GeoDistance;
use App\Support\Rules\RuleEngine;

class TimeEntryController extends Controller
{
    public function index()
    {
        $this->authorize('viewAny', TimeEntry::class);

        $entries = TimeEntry::query()
            ->latest()
            ->paginate(20);

        return TimeEntryResource::collection($entries);
    }

    public function checkIn(CheckInRequest $request)
    {
        $this->authorize('create', TimeEntry::class);

        $payload = $request->validated();

        $shift = Shift::query()->with('site')->findOrFail($payload['shift_id']);

        $assignment = Assignment::query()
            ->where('shift_id', $shift->id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (! $assignment) {
            throw ValidationException::withMessages([
                'shift_id' => ['Keine Zuweisung für diese Schicht.'],
            ]);
        }

        $earlyMinutes = (int) config('cordinare.check_in_early_minutes', 60);
        $lateMinutes = (int) config('cordinare.check_in_late_minutes', 120);
        $now = now();
        if ($now->lt($shift->starts_at->copy()->subMinutes($earlyMinutes)) ||
            $now->gt($shift->ends_at->copy()->addMinutes($lateMinutes))) {
            throw ValidationException::withMessages([
                'shift_id' => ['Check-in außerhalb des erlaubten Zeitfensters.'],
            ]);
        }

        $existing = TimeEntry::query()
            ->where('shift_id', $payload['shift_id'])
            ->where('user_id', $request->user()->id)
            ->first();

        if ($existing) {
            throw ValidationException::withMessages([
                'shift_id' => ['Für diese Schicht wurde bereits ein Check-in erfasst.'],
            ]);
        }

        $openEntry = TimeEntry::query()
            ->where('user_id', $request->user()->id)
            ->whereNull('check_out_at')
            ->first();

        if ($openEntry) {
            throw ValidationException::withMessages([
                'shift_id' => ['Es ist bereits eine Schicht offen. Bitte zuerst auschecken.'],
            ]);
        }

        $gps = null;
        $anomalyFlags = [];
        if ($request->filled('latitude') && $request->filled('longitude')) {
            $gps = [
                'latitude' => (float) $request->input('latitude'),
                'longitude' => (float) $request->input('longitude'),
                'accuracy' => $request->input('accuracy'),
            ];

            if ($shift->site && $shift->site->latitude && $shift->site->longitude) {
                $distance = GeoDistance::meters(
                    (float) $shift->site->latitude,
                    (float) $shift->site->longitude,
                    (float) $request->input('latitude'),
                    (float) $request->input('longitude'),
                );
                $gps['distance_m'] = round($distance, 1);

                $radius = (float) config('cordinare.geofence_radius_meters', 300);
                if ($distance > $radius) {
                    $anomalyFlags[] = 'outside_geofence';
                }
            }
        }

        $entry = TimeEntry::create([
            'shift_id' => $payload['shift_id'],
            'user_id' => $request->user()->id,
            'check_in_at' => now(),
            'gps' => $gps,
            'anomaly_flags' => $anomalyFlags ?: null,
        ]);

        return (new TimeEntryResource($entry))
            ->response()
            ->setStatusCode(201);
    }

    public function checkOut(CheckOutRequest $request, TimeEntry $timeEntry)
    {
        $this->authorize('update', $timeEntry);

        if ($timeEntry->user_id !== $request->user()->id && $request->user()->role === UserRole::Employee) {
            throw ValidationException::withMessages([
                'time_entry' => ['Kein Zugriff auf diesen Eintrag.'],
            ]);
        }

        if ($timeEntry->check_out_at) {
            throw ValidationException::withMessages([
                'time_entry' => ['Bereits ausgecheckt.'],
            ]);
        }

        $gps = $timeEntry->gps ?? [];
        $anomalyFlags = $timeEntry->anomaly_flags ?? [];
        if ($request->filled('latitude') && $request->filled('longitude')) {
            $gps['check_out'] = [
                'latitude' => (float) $request->input('latitude'),
                'longitude' => (float) $request->input('longitude'),
                'accuracy' => $request->input('accuracy'),
            ];
        }

        $timeEntry->fill([
            'check_out_at' => now(),
            'break_minutes' => $request->input('break_minutes', 0),
            'gps' => $gps,
            'notes' => $request->input('notes'),
        ]);

        $shift = Shift::query()->find($timeEntry->shift_id);
        if ($shift) {
            $ruleFlags = app(RuleEngine::class)->evaluateTimeEntry($timeEntry, $shift);
            $anomalyFlags = array_values(array_unique(array_merge($anomalyFlags, $ruleFlags)));
        }

        $timeEntry->anomaly_flags = $anomalyFlags ?: null;
        $timeEntry->save();

        return new TimeEntryResource($timeEntry);
    }
}
