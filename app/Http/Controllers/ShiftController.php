<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreShiftRequest;
use App\Http\Requests\UpdateShiftRequest;
use App\Http\Resources\ShiftResource;
use App\Models\Assignment;
use App\Models\Shift;
use App\Models\ShiftTemplate;
use App\Models\Site;
use App\Models\SiteClosure;
use App\Models\User;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;
use Inertia\Inertia;

class ShiftController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', Shift::class);

        $timezone = $request->user()?->tenant?->timezone ?? config('app.timezone');
        $view = $request->string('view')->toString() ?: 'month';
        $month = $request->string('month')->toString();
        $date = $request->string('date')->toString();

        if ($view === 'week') {
            $anchor = $date ? Carbon::createFromFormat('Y-m-d', $date, $timezone) : now($timezone);
            $rangeStart = $anchor->copy()->startOfWeek(Carbon::MONDAY);
            $rangeEnd = $anchor->copy()->endOfWeek(Carbon::SUNDAY);
            $monthDate = $anchor->copy();
        } elseif ($view === 'day') {
            $anchor = $date ? Carbon::createFromFormat('Y-m-d', $date, $timezone) : now($timezone);
            $rangeStart = $anchor->copy()->startOfDay();
            $rangeEnd = $anchor->copy()->endOfDay();
            $monthDate = $anchor->copy();
        } else {
            $monthDate = $month ? Carbon::createFromFormat('Y-m', $month, $timezone) : now($timezone);
            $rangeStart = $monthDate->copy()->startOfMonth();
            $rangeEnd = $monthDate->copy()->endOfMonth();
        }

        $shifts = Shift::query()
            ->with('site')
            ->latest()
            ->paginate(20);

        $calendarShifts = Shift::query()
            ->with(['site', 'assignments'])
            ->whereBetween('starts_at', [$rangeStart, $rangeEnd])
            ->orderBy('starts_at')
            ->get();

        $templatePreviews = $this->buildTemplatePreviews($calendarShifts, $rangeStart, $rangeEnd, $timezone);
        $calendarResource = ShiftResource::collection($calendarShifts)->resolve();
        $calendarData = is_array($calendarResource) && array_key_exists('data', $calendarResource)
            ? $calendarResource['data']
            : (is_array($calendarResource) ? $calendarResource : []);

        $calendarData = array_merge($calendarData, $templatePreviews);
        usort($calendarData, fn ($a, $b) => strcmp($a['starts_at'] ?? '', $b['starts_at'] ?? ''));

        $users = User::query()->orderBy('name')->get();
        $sites = Site::query()->orderBy('name')->get(['id', 'name']);

        return Inertia::render('shifts/index', [
            'shifts' => ShiftResource::collection($shifts),
            'calendar' => [
                'view' => $view,
                'month' => $monthDate->format('Y-m'),
                'date' => in_array($view, ['week', 'day'], true) ? $rangeStart->toDateString() : null,
                'starts_on' => $rangeStart->toDateString(),
                'ends_on' => $rangeEnd->toDateString(),
                'shifts' => ['data' => $calendarData],
            ],
            'users' => $users->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role?->value,
            ]),
            'sites' => $sites,
        ]);
    }

    public function create(Request $request)
    {
        $this->authorize('create', Shift::class);

        $sites = Site::query()->orderBy('name')->get();
        $users = User::query()->orderBy('name')->get();
        $date = $request->string('date')->toString();
        $startsAt = $request->string('starts_at')->toString();
        $endsAt = $request->string('ends_at')->toString();

        if ($date && ! $startsAt) {
            $startsAt = "{$date}T08:00";
        }
        if ($date && ! $endsAt) {
            $endsAt = "{$date}T12:00";
        }

        return Inertia::render('shifts/create', [
            'sites' => $sites->map(fn (Site $site) => [
                'id' => $site->id,
                'name' => $site->name,
            ]),
            'users' => $users->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role?->value,
            ]),
            'defaults' => [
                'site_id' => $request->integer('site_id') ?: null,
                'title' => $request->string('title')->toString() ?: null,
                'starts_at' => $startsAt ?: null,
                'ends_at' => $endsAt ?: null,
                'status' => $request->string('status')->toString() ?: null,
            ],
        ]);
    }

    public function store(StoreShiftRequest $request)
    {
        $this->authorize('create', Shift::class);

        $payload = $request->validated();
        $userIds = $payload['assigned_user_ids'] ?? [];
        unset($payload['assigned_user_ids']);

        $shift = DB::transaction(function () use ($payload, $userIds) {
            $shift = Shift::create($payload);
            $this->syncAssignments($shift, $userIds);

            return $shift;
        });

        if ($request->header('X-Shift-Quick') || $request->boolean('quick')) {
            return redirect()->back();
        }

        return redirect()->route('shifts.show', $shift);
    }

    public function show(Shift $shift)
    {
        $this->authorize('view', $shift);

        $shift->load(['site', 'assignments.user']);
        $users = User::query()->where('tenant_id', $shift->tenant_id)->orderBy('name')->get();

        return Inertia::render('shifts/show', [
            'shift' => ShiftResource::make($shift)->resolve(),
            'users' => $users->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role?->value,
            ]),
        ]);
    }

    public function edit(Shift $shift)
    {
        $this->authorize('update', $shift);

        $shift->load(['site', 'assignments.user']);
        $sites = Site::query()->orderBy('name')->get();
        $users = User::query()->orderBy('name')->get();

        return Inertia::render('shifts/edit', [
            'shift' => ShiftResource::make($shift)->resolve(),
            'sites' => $sites->map(fn (Site $site) => [
                'id' => $site->id,
                'name' => $site->name,
            ]),
            'users' => $users->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role?->value,
            ]),
        ]);
    }

    public function update(UpdateShiftRequest $request, Shift $shift)
    {
        $this->authorize('update', $shift);

        $payload = $request->validated();
        $userIds = $payload['assigned_user_ids'] ?? [];
        unset($payload['assigned_user_ids']);

        DB::transaction(function () use ($shift, $payload, $userIds) {
            $shift->update($payload);
            $this->syncAssignments($shift, $userIds);
        });

        if ($request->header('X-Shift-Quick') || $request->boolean('quick')) {
            return redirect()->back();
        }

        return redirect()->route('shifts.show', $shift);
    }

    public function destroy(Shift $shift)
    {
        $this->authorize('delete', $shift);

        $shift->delete();

        return redirect()->route('shifts.index');
    }

    private function syncAssignments(Shift $shift, array $userIds): void
    {
        $userIds = array_values(array_unique(array_filter($userIds, fn ($id) => ! empty($id))));

        $users = User::query()
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

    private function buildTemplatePreviews(Collection $calendarShifts, CarbonInterface $rangeStart, CarbonInterface $rangeEnd, string $timezone): array
    {
        $templates = ShiftTemplate::query()
            ->where('active', true)
            ->with('site')
            ->get();

        if ($templates->isEmpty()) {
            return [];
        }

        $existing = $calendarShifts
            ->filter(fn (Shift $shift) => $shift->shift_template_id && $shift->starts_at)
            ->mapWithKeys(fn (Shift $shift) => [$shift->shift_template_id.'|'.$shift->starts_at->toIso8601String() => true])
            ->all();

        $rangeStartDay = Carbon::instance($rangeStart)->startOfDay();
        $rangeEndDay = Carbon::instance($rangeEnd)->startOfDay();
        $previews = [];

        foreach ($templates as $template) {
            $blocks = $this->normalizeScheduleBlocks($template->schedule_blocks ?? []);
            foreach ($blocks as $block) {
                $first = $rangeStartDay->copy();
                $startDayIso = $first->dayOfWeekIso - 1;
                $delta = ($block['day_of_week'] - $startDayIso + 7) % 7;
                $first->addDays($delta);

                for ($cursor = $first->copy(); $cursor->lte($rangeEndDay); $cursor = $cursor->copy()->addWeek()) {
                    $startsAt = Carbon::parse($cursor->format('Y-m-d').' '.$block['starts_at'], $timezone);
                    $endsAt = Carbon::parse($cursor->format('Y-m-d').' '.$block['ends_at'], $timezone);

                    if ($startsAt->lt($rangeStart) || $startsAt->gt($rangeEnd)) {
                        continue;
                    }

                    if ($this->overlapsClosure($template->site_id, $startsAt, $endsAt)) {
                        continue;
                    }

                    $key = $template->id.'|'.$startsAt->toIso8601String();
                    if (isset($existing[$key])) {
                        continue;
                    }

                    $previews[] = [
                        'id' => $this->previewId($template->id, $startsAt),
                        'site_id' => $template->site_id,
                        'site' => $template->site ? ['id' => $template->site->id, 'name' => $template->site->name] : null,
                        'title' => $template->name,
                        'starts_at' => $startsAt->toIso8601String(),
                        'ends_at' => $endsAt->toIso8601String(),
                        'status' => 'scheduled',
                        'assignments' => ['data' => []],
                        'is_template_preview' => true,
                        'template_id' => $template->id,
                    ];
                }
            }
        }

        return $previews;
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
                ->where('day_of_week', $dayOfWeek)
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

    private function previewId(int $templateId, Carbon $startsAt): int
    {
        $hash = crc32($templateId.'|'.$startsAt->toIso8601String());
        return -1 * (int) $hash;
    }
}
