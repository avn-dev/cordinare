<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Http\Requests\CheckInRequest;
use App\Http\Requests\CheckOutRequest;
use App\Models\Absence;
use App\Models\Assignment;
use App\Models\Shift;
use App\Models\ShiftTemplate;
use App\Models\Offer;
use App\Models\Site;
use App\Models\SiteClosure;
use App\Models\TimeEntry;
use App\Support\Geo\GeoDistance;
use App\Support\Rules\RuleEngine;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class EmployeePortalController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $timezone = $user?->tenant?->timezone ?? config('app.timezone');
        $now = Carbon::now($timezone);
        $monthParam = $request->string('month')->toString();
        $monthStart = $now->copy()->startOfMonth();
        if ($monthParam !== '') {
            try {
                $monthStart = Carbon::createFromFormat('Y-m', $monthParam, $timezone)->startOfMonth();
            } catch (\Throwable) {
                $monthStart = $now->copy()->startOfMonth();
            }
        }
        $monthEnd = $monthStart->copy()->endOfMonth();
        $this->generateTemplateShiftsForUser($user->id, $timezone, $monthEnd->copy()->addWeeks(8));

        $upcomingShifts = Shift::query()
            ->with('site')
            ->whereHas('assignments', fn ($query) => $query->where('user_id', $user->id))
            ->whereDoesntHave('timeEntries', fn ($query) => $query->where('user_id', $user->id))
            ->where('starts_at', '>=', $now->copy()->subDays(1))
            ->orderBy('starts_at')
            ->limit(20)
            ->get();

        $calendarShifts = Shift::query()
            ->with('site')
            ->whereHas('assignments', fn ($query) => $query->where('user_id', $user->id))
            ->where(function ($query) use ($monthStart, $monthEnd) {
                $query->whereBetween('starts_at', [$monthStart, $monthEnd])
                    ->orWhereBetween('ends_at', [$monthStart, $monthEnd])
                    ->orWhere(function ($inner) use ($monthStart, $monthEnd) {
                        $inner->where('starts_at', '<=', $monthStart)
                            ->where('ends_at', '>=', $monthEnd);
                    });
            })
            ->orderBy('starts_at')
            ->get();

        $openEntry = TimeEntry::query()
            ->with(['shift.site'])
            ->where('user_id', $user->id)
            ->whereNull('check_out_at')
            ->latest('check_in_at')
            ->first();

        $recentEntries = TimeEntry::query()
            ->with(['shift.site'])
            ->where('user_id', $user->id)
            ->latest('check_in_at')
            ->limit(20)
            ->get();

        $summaryStart = $now->copy()->subDays(30)->startOfDay();
        $summaryEntries = TimeEntry::query()
            ->where('user_id', $user->id)
            ->whereNotNull('check_out_at')
            ->whereBetween('check_in_at', [$summaryStart, $now])
            ->get();

        $totalMinutes = 0;
        foreach ($summaryEntries as $entry) {
            if (! $entry->check_in_at || ! $entry->check_out_at) {
                continue;
            }
            $minutes = $entry->check_in_at->diffInMinutes($entry->check_out_at);
            $minutes = max(0, $minutes - (int) ($entry->break_minutes ?? 0));
            $totalMinutes += $minutes;
        }

        $absences = Absence::query()
            ->where('user_id', $user->id)
            ->latest('starts_on')
            ->limit(10)
            ->get();

        $siteIds = Shift::query()
            ->whereHas('assignments', fn ($query) => $query->where('user_id', $user->id))
            ->whereNotNull('site_id')
            ->pluck('site_id')
            ->unique()
            ->filter()
            ->values();

        $latestOffers = Offer::query()
            ->with('serviceReport')
            ->whereIn('site_id', $siteIds)
            ->latest()
            ->get()
            ->groupBy('site_id')
            ->map(fn ($offers) => $offers->first());

        $serviceReportSites = Site::query()
            ->with('customer')
            ->whereIn('id', $siteIds)
            ->orderBy('name')
            ->get()
            ->map(function (Site $site) use ($latestOffers) {
                $offer = $latestOffers->get($site->id);
                $hasReport = (bool) ($offer && $offer->serviceReport);
                return [
                    'id' => $site->id,
                    'name' => $site->name,
                    'customer' => $site->customer?->name,
                    'has_report' => $hasReport,
                    'pdf_url' => $hasReport ? route('sites.service-report.pdf', $site) : null,
                ];
            })
            ->values();

        return Inertia::render('employee/index', [
            'upcoming_shifts' => $upcomingShifts->map(fn (Shift $shift) => [
                'id' => $shift->id,
                'title' => $shift->title,
                'starts_at' => $shift->starts_at?->toIso8601String(),
                'ends_at' => $shift->ends_at?->toIso8601String(),
                'status' => $shift->status,
                'site' => $shift->site ? ['id' => $shift->site->id, 'name' => $shift->site->name] : null,
            ]),
            'calendar' => [
                'month' => $monthStart->format('Y-m'),
                'starts_on' => $monthStart->toDateString(),
                'ends_on' => $monthEnd->toDateString(),
                'shifts' => $calendarShifts->map(fn (Shift $shift) => [
                    'id' => $shift->id,
                    'title' => $shift->title,
                    'starts_at' => $shift->starts_at?->toIso8601String(),
                    'ends_at' => $shift->ends_at?->toIso8601String(),
                    'status' => $shift->status,
                    'site' => $shift->site ? ['id' => $shift->site->id, 'name' => $shift->site->name] : null,
                ]),
            ],
            'open_entry' => $openEntry ? $this->timeEntryPayload($openEntry) : null,
            'recent_entries' => $recentEntries->map(fn (TimeEntry $entry) => $this->timeEntryPayload($entry)),
            'summary' => [
                'from' => $summaryStart->toDateString(),
                'to' => $now->toDateString(),
                'total_minutes' => $totalMinutes,
                'total_hours' => round($totalMinutes / 60, 1),
            ],
            'absences' => $absences->map(fn (Absence $absence) => [
                'id' => $absence->id,
                'type' => $absence->type,
                'status' => $absence->status,
                'starts_on' => $absence->starts_on?->toDateString(),
                'ends_on' => $absence->ends_on?->toDateString(),
                'notes' => $absence->notes,
            ]),
            'service_reports' => $serviceReportSites,
        ]);
    }

    public function checkIn(CheckInRequest $request)
    {
        $this->authorize('create', TimeEntry::class);

        $payload = $request->validated();
        $user = $request->user();

        $shift = Shift::query()->with('site')->findOrFail($payload['shift_id']);

        $assignment = Assignment::query()
            ->where('shift_id', $shift->id)
            ->where('user_id', $user->id)
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
            ->where('user_id', $user->id)
            ->first();

        if ($existing) {
            throw ValidationException::withMessages([
                'shift_id' => ['Für diese Schicht wurde bereits ein Check-in erfasst.'],
            ]);
        }

        $openEntry = TimeEntry::query()
            ->where('user_id', $user->id)
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

        TimeEntry::create([
            'shift_id' => $payload['shift_id'],
            'user_id' => $user->id,
            'check_in_at' => now(),
            'gps' => $gps,
            'anomaly_flags' => $anomalyFlags ?: null,
        ]);

        return redirect()
            ->back()
            ->with('success', 'Check-in gespeichert.');
    }

    public function checkOut(CheckOutRequest $request, TimeEntry $timeEntry)
    {
        $this->authorize('update', $timeEntry);

        $user = $request->user();
        if ($timeEntry->user_id !== $user->id && $user->role === UserRole::Employee) {
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

        return redirect()
            ->back()
            ->with('success', 'Check-out gespeichert.');
    }

    private function generateTemplateShiftsForUser(int $userId, string $timezone, Carbon $throughEnd): void
    {
        $startOfWeek = Carbon::now($timezone)->startOfWeek(Carbon::MONDAY);
        if ($throughEnd->lte($startOfWeek)) {
            return;
        }

        $templates = ShiftTemplate::query()
            ->where('active', true)
            ->whereHas('users', fn ($query) => $query->where('users.id', $userId))
            ->with(['users', 'site'])
            ->get();

        if ($templates->isEmpty()) {
            return;
        }

        $weeks = (int) ceil($startOfWeek->diffInDays($throughEnd, false) / 7);
        $weeks = max(1, $weeks);

        foreach ($templates as $template) {
            $blocks = $this->normalizeScheduleBlocks($template->schedule_blocks ?? []);
            for ($week = 0; $week < $weeks; $week += 1) {
                foreach ($blocks as $block) {
                    $date = $startOfWeek->copy()->addWeeks($week)->addDays($block['day_of_week']);
                    $startsAt = Carbon::parse($date->format('Y-m-d').' '.$block['starts_at'], $timezone);
                    $endsAt = Carbon::parse($date->format('Y-m-d').' '.$block['ends_at'], $timezone);

                    if ($template->site?->starts_on && $startsAt->lt($template->site->starts_on->copy()->startOfDay())) {
                        continue;
                    }

                    if ($this->overlapsClosure($template->site_id, $startsAt, $endsAt)) {
                        continue;
                    }

                    $exists = Shift::query()
                        ->where('shift_template_id', $template->id)
                        ->where('starts_at', $startsAt)
                        ->exists();

                    if ($exists) {
                        continue;
                    }

                    $shift = Shift::create([
                        'site_id' => $template->site_id,
                        'title' => $template->name,
                        'starts_at' => $startsAt,
                        'ends_at' => $endsAt,
                        'status' => $template->status,
                        'shift_template_id' => $template->id,
                    ]);

                    $userIds = $template->users->pluck('id')->all();
                    $this->syncAssignments($shift, $userIds);
                }
            }
        }
    }

    private function normalizeScheduleBlocks(array $blocks): array
    {
        $normalized = [];
        foreach ($blocks as $block) {
            if (! is_array($block)) {
                continue;
            }
            $day = isset($block['day_of_week']) ? (int) $block['day_of_week'] : null;
            $startsAt = $block['starts_at'] ?? null;
            $endsAt = $block['ends_at'] ?? null;
            if ($day === null || $startsAt === null || $endsAt === null) {
                continue;
            }
            $normalized[] = [
                'day_of_week' => max(0, min(6, $day)),
                'starts_at' => $startsAt,
                'ends_at' => $endsAt,
            ];
        }

        usort($normalized, function (array $a, array $b) {
            return [$a['day_of_week'], $a['starts_at']] <=> [$b['day_of_week'], $b['starts_at']];
        });

        return array_values($normalized);
    }

    private function overlapsClosure(int $siteId, Carbon $start, Carbon $end): bool
    {
        $current = $start->copy()->startOfDay();
        $last = $end->copy()->startOfDay();

        while ($current->lte($last)) {
            $dayOfWeek = $current->dayOfWeekIso - 1;
            $closures = SiteClosure::query()
                ->where('site_id', $siteId)
                ->where(function ($query) use ($current, $dayOfWeek) {
                    $query
                        ->where(function ($weekly) use ($dayOfWeek) {
                            $weekly->where('closure_type', 'weekly')
                                ->where('day_of_week', $dayOfWeek);
                        })
                        ->orWhere(function ($dateRange) use ($current) {
                            $dateRange->where('closure_type', 'date_range')
                                ->whereDate('starts_on', '<=', $current->toDateString())
                                ->whereDate('ends_on', '>=', $current->toDateString());
                        });
                })
                ->get();

            foreach ($closures as $closure) {
                $closureStart = $current->copy()->setTimeFromTimeString($closure->starts_at);
                $closureEnd = $current->copy()->setTimeFromTimeString($closure->ends_at);
                if ($start->lt($closureEnd) && $end->gt($closureStart)) {
                    return true;
                }
            }

            $current->addDay();
        }

        return false;
    }

    private function syncAssignments(Shift $shift, array $userIds): void
    {
        $userIds = array_values(array_unique(array_filter($userIds, fn ($id) => ! empty($id))));
        if ($userIds === []) {
            return;
        }

        $users = \App\Models\User::query()
            ->whereIn('id', $userIds)
            ->get()
            ->keyBy('id');

        $shift->assignments()->delete();

        $payload = [];
        foreach ($userIds as $userId) {
            $user = $users->get((int) $userId);
            if (! $user) {
                continue;
            }

            $payload[] = [
                'user_id' => $user->id,
                'role' => $user->role?->value ?? 'employee',
                'status' => 'assigned',
            ];
        }

        if ($payload !== []) {
            $shift->assignments()->createMany($payload);
        }
    }

    private function timeEntryPayload(TimeEntry $entry): array
    {
        $minutes = null;
        if ($entry->check_in_at && $entry->check_out_at) {
            $minutes = $entry->check_in_at->diffInMinutes($entry->check_out_at);
            $minutes = max(0, $minutes - (int) ($entry->break_minutes ?? 0));
        }

        return [
            'id' => $entry->id,
            'shift_id' => $entry->shift_id,
            'check_in_at' => $entry->check_in_at?->toIso8601String(),
            'check_out_at' => $entry->check_out_at?->toIso8601String(),
            'break_minutes' => $entry->break_minutes,
            'notes' => $entry->notes,
            'worked_minutes' => $minutes,
            'shift' => $entry->shift ? [
                'id' => $entry->shift->id,
                'title' => $entry->shift->title,
                'starts_at' => $entry->shift->starts_at?->toIso8601String(),
                'ends_at' => $entry->shift->ends_at?->toIso8601String(),
                'site' => $entry->shift->site ? ['id' => $entry->shift->site->id, 'name' => $entry->shift->site->name] : null,
            ] : null,
        ];
    }
}
