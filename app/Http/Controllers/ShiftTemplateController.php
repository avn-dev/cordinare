<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreShiftTemplateRequest;
use App\Http\Requests\UpdateShiftTemplateRequest;
use App\Models\Shift;
use App\Models\ShiftTemplate;
use App\Models\Site;
use App\Models\SiteClosure;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;
use Inertia\Inertia;

class ShiftTemplateController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', ShiftTemplate::class);

        $dayInput = $request->input('day_of_week');
        $filters = [
            'site_id' => $request->integer('site_id') ?: null,
            'day_of_week' => $dayInput === null || $dayInput === '' ? null : (int) $dayInput,
            'active' => $request->string('active')->toString(),
            'search' => $request->string('search')->toString(),
        ];

        $templates = ShiftTemplate::query()
            ->with(['site', 'users'])
            ->when($filters['site_id'], fn ($query, $siteId) => $query->where('site_id', $siteId))
            ->when($filters['active'] !== '', fn ($query) => $query->where('active', $filters['active'] === '1'))
            ->when(
                $filters['day_of_week'] !== null,
                fn ($query, $day) => $query->whereRaw('(days_mask & ?) != 0', [1 << $day])
            )
            ->when($filters['search'], fn ($query, $search) => $query->where('name', 'like', '%'.$search.'%'))
            ->orderBy('day_of_week')
            ->orderBy('starts_at')
            ->paginate(20)
            ->withQueryString();

        $sites = Site::query()->orderBy('name')->get(['id', 'name']);

        return Inertia::render('shift-templates/index', [
            'templates' => $templates->through(fn (ShiftTemplate $template) => [
                'id' => $template->id,
                'name' => $template->name,
                'day_of_week' => $template->day_of_week,
                'starts_at' => $template->starts_at,
                'ends_at' => $template->ends_at,
                'schedule_blocks' => $template->schedule_blocks ?? [],
                'status' => $template->status,
                'active' => $template->active,
                'site' => $template->site ? ['id' => $template->site->id, 'name' => $template->site->name] : null,
                'users' => $template->users->map(fn (User $user) => ['id' => $user->id, 'name' => $user->name]),
                'created_at' => $template->created_at?->toIso8601String(),
            ]),
            'filters' => $filters,
            'sites' => $sites,
        ]);
    }

    public function create()
    {
        $this->authorize('create', ShiftTemplate::class);

        $sites = Site::query()->orderBy('name')->get(['id', 'name']);
        $users = User::query()->orderBy('name')->get(['id', 'name', 'email', 'role']);

        return Inertia::render('shift-templates/create', [
            'sites' => $sites,
            'users' => $users,
        ]);
    }

    public function store(StoreShiftTemplateRequest $request)
    {
        $this->authorize('create', ShiftTemplate::class);

        $payload = $request->validated();
        $userIds = $payload['assigned_user_ids'] ?? [];
        $weeks = (int) ($payload['generate_weeks'] ?? 4);
        $blocks = $this->normalizeScheduleBlocks($payload['schedule_blocks'] ?? []);
        $computed = $this->computeScheduleFields($blocks);
        $payload['schedule_blocks'] = $blocks;
        $payload['days_mask'] = $computed['days_mask'];
        $payload['day_of_week'] = $computed['day_of_week'];
        $payload['starts_at'] = $computed['starts_at'];
        $payload['ends_at'] = $computed['ends_at'];
        unset($payload['assigned_user_ids'], $payload['generate_weeks']);

        $template = DB::transaction(function () use ($payload, $userIds) {
            $template = ShiftTemplate::create($payload);
            $template->users()->sync($userIds);

            return $template;
        });

        if ($weeks > 0) {
            $timezone = $request->user()?->tenant?->timezone ?? config('app.timezone');
            $this->generateForTemplates(collect([$template]), $weeks, $timezone);
        }

        return redirect()
            ->route('shift-templates.edit', $template)
            ->with('success', $weeks > 0 ? 'Vorlage gespeichert und Schichten erzeugt.' : 'Vorlage gespeichert.');
    }

    public function edit(ShiftTemplate $shiftTemplate)
    {
        $this->authorize('update', $shiftTemplate);

        $shiftTemplate->load(['site', 'users']);
        $sites = Site::query()->orderBy('name')->get(['id', 'name']);
        $users = User::query()->orderBy('name')->get(['id', 'name', 'email', 'role']);

        return Inertia::render('shift-templates/edit', [
            'template' => [
                'id' => $shiftTemplate->id,
                'name' => $shiftTemplate->name,
                'day_of_week' => $shiftTemplate->day_of_week,
                'starts_at' => $shiftTemplate->starts_at,
                'ends_at' => $shiftTemplate->ends_at,
                'schedule_blocks' => $shiftTemplate->schedule_blocks ?? [],
                'status' => $shiftTemplate->status,
                'active' => $shiftTemplate->active,
                'notes' => $shiftTemplate->notes,
                'site_id' => $shiftTemplate->site_id,
                'assigned_user_ids' => $shiftTemplate->users->pluck('id')->values(),
            ],
            'sites' => $sites,
            'users' => $users,
        ]);
    }

    public function update(UpdateShiftTemplateRequest $request, ShiftTemplate $shiftTemplate)
    {
        $this->authorize('update', $shiftTemplate);

        $payload = $request->validated();
        $userIds = $payload['assigned_user_ids'] ?? [];
        $weeks = (int) ($payload['generate_weeks'] ?? 0);
        $blocks = $this->normalizeScheduleBlocks($payload['schedule_blocks'] ?? []);
        $computed = $this->computeScheduleFields($blocks);
        $payload['schedule_blocks'] = $blocks;
        $payload['days_mask'] = $computed['days_mask'];
        $payload['day_of_week'] = $computed['day_of_week'];
        $payload['starts_at'] = $computed['starts_at'];
        $payload['ends_at'] = $computed['ends_at'];
        unset($payload['assigned_user_ids'], $payload['generate_weeks']);

        DB::transaction(function () use ($shiftTemplate, $payload, $userIds) {
            $shiftTemplate->update($payload);
            $shiftTemplate->users()->sync($userIds);
        });

        if ($weeks > 0) {
            $timezone = $request->user()?->tenant?->timezone ?? config('app.timezone');
            $this->generateForTemplates(collect([$shiftTemplate]), $weeks, $timezone);
        }

        return redirect()
            ->route('shift-templates.edit', $shiftTemplate)
            ->with('success', $weeks > 0 ? 'Vorlage gespeichert und Schichten erzeugt.' : 'Vorlage gespeichert.');
    }

    public function destroy(ShiftTemplate $shiftTemplate)
    {
        $this->authorize('delete', $shiftTemplate);

        $shiftTemplate->delete();

        return redirect()->route('shift-templates.index');
    }

    public function generate(Request $request)
    {
        $this->authorize('create', ShiftTemplate::class);

        $weeks = max(1, min(12, $request->integer('weeks', 4)));
        $timezone = $request->user()?->tenant?->timezone ?? config('app.timezone');

        $templates = ShiftTemplate::query()
            ->where('active', true)
            ->with(['users', 'site'])
            ->get();

        $created = $this->generateForTemplates($templates, $weeks, $timezone);

        return redirect()
            ->back()
            ->with('success', "{$created} Schichten erzeugt.");
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

    private function generateForTemplates(Collection $templates, int $weeks, string $timezone): int
    {
        if ($weeks <= 0) {
            return 0;
        }

        $startOfWeek = Carbon::now($timezone)->startOfWeek(Carbon::MONDAY);
        $created = 0;

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
                    $created += 1;
                }
            }
        }

        return $created;
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

    private function computeScheduleFields(array $blocks): array
    {
        $daysMask = 0;
        foreach ($blocks as $block) {
            $daysMask |= 1 << (int) $block['day_of_week'];
        }

        $first = $blocks[0] ?? ['day_of_week' => 0, 'starts_at' => '00:00', 'ends_at' => '00:00'];

        return [
            'days_mask' => $daysMask,
            'day_of_week' => (int) $first['day_of_week'],
            'starts_at' => $first['starts_at'],
            'ends_at' => $first['ends_at'],
        ];
    }
}
