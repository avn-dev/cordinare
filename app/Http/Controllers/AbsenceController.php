<?php

namespace App\Http\Controllers;

use App\Http\Resources\AbsenceResource;
use App\Models\Absence;
use App\Models\User;
use App\Enums\UserRole;
use App\Http\Requests\StoreAbsenceRequest;
use App\Http\Requests\UpdateAbsenceRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use App\Support\Exports\AbsenceCsvExporter;
use Inertia\Inertia;

class AbsenceController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', Absence::class);

        $filters = [
            'status' => $request->string('status')->toString(),
            'type' => $request->string('type')->toString(),
            'user_id' => $request->integer('user_id') ?: null,
            'from' => $request->string('from')->toString(),
            'to' => $request->string('to')->toString(),
            'flag' => $request->string('flag')->toString(),
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
            ->paginate(20)
            ->withQueryString();

        $summaryBase = Absence::query()
            ->when($filters['type'], fn ($query, $type) => $query->where('type', $type))
            ->when($filters['user_id'], fn ($query, $userId) => $query->where('user_id', $userId))
            ->when($filters['from'], fn ($query, $from) => $query->whereDate('starts_on', '>=', $from))
            ->when($filters['to'], fn ($query, $to) => $query->whereDate('ends_on', '<=', $to))
            ->when($filters['flag'], fn ($query, $flag) => $query->whereJsonContains('rule_flags', $flag));

        $summary = [
            'total' => (clone $summaryBase)->count(),
            'pending' => (clone $summaryBase)->where('status', 'pending')->count(),
            'approved' => (clone $summaryBase)->where('status', 'approved')->count(),
            'rejected' => (clone $summaryBase)->where('status', 'rejected')->count(),
            'flagged' => (clone $summaryBase)
                ->whereNotNull('rule_flags')
                ->where('rule_flags', '!=', '[]')
                ->count(),
        ];

        $user = $request->user();
        $canAssignUser = $this->canAssignUser($user);

        return Inertia::render('absences/index', [
            'absences' => AbsenceResource::collection($absences),
            'filters' => $filters,
            'users' => $canAssignUser ? $this->userOptions() : [],
            'canAssignUser' => $canAssignUser,
            'summary' => $summary,
        ]);
    }

    public function create(Request $request)
    {
        $this->authorize('create', Absence::class);

        $user = $request->user();
        $canAssignUser = $this->canAssignUser($user);

        return Inertia::render('absences/create', [
            'users' => $canAssignUser ? $this->userOptions() : [],
            'canAssignUser' => $canAssignUser,
        ]);
    }

    public function store(StoreAbsenceRequest $request)
    {
        $this->authorize('create', Absence::class);

        $payload = $request->validated();
        $user = $request->user();

        if (! $this->canAssignUser($user)) {
            $payload['user_id'] = $user->id;
            $payload['status'] = 'pending';
        }

        Absence::create($payload);

        return redirect()
            ->route('absences.index')
            ->with('success', 'Abwesenheit angelegt.');
    }

    public function edit(Absence $absence, Request $request)
    {
        $this->authorize('update', $absence);

        $absence->load('user');

        $user = $request->user();
        $canAssignUser = $this->canAssignUser($user);

        return Inertia::render('absences/edit', [
            'absence' => AbsenceResource::make($absence)->resolve(),
            'users' => $canAssignUser ? $this->userOptions() : [],
            'canAssignUser' => $canAssignUser,
        ]);
    }

    public function update(UpdateAbsenceRequest $request, Absence $absence)
    {
        $this->authorize('update', $absence);

        $payload = $request->validated();
        $user = $request->user();

        if (! $this->canAssignUser($user)) {
            unset($payload['user_id']);
            unset($payload['status']);
        }

        $absence->update($payload);

        return redirect()
            ->route('absences.index')
            ->with('success', 'Abwesenheit aktualisiert.');
    }

    public function destroy(Absence $absence)
    {
        $this->authorize('delete', $absence);

        $absence->delete();

        return redirect()
            ->route('absences.index')
            ->with('success', 'Abwesenheit gelöscht.');
    }

    public function export(Request $request)
    {
        $this->authorize('viewAny', Absence::class);

        $tenant = $request->user()->tenant;
        $filename = 'absences-'.$tenant->slug.'-'.Carbon::now()->format('Ymd_His').'.csv';
        $filters = [
            'status' => $request->string('status')->toString(),
            'type' => $request->string('type')->toString(),
            'user_id' => $request->integer('user_id') ?: null,
            'from' => $request->string('from')->toString(),
            'to' => $request->string('to')->toString(),
            'flag' => $request->string('flag')->toString(),
        ];

        return response()->streamDownload(function () use ($tenant, $filters) {
            $handle = fopen('php://output', 'w');
            AbsenceCsvExporter::writeToHandle($handle, $tenant->id, $filters);
            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    private function canAssignUser(?User $user): bool
    {
        if (! $user) {
            return false;
        }

        return $user->hasAnyRole([
            UserRole::Superadmin,
            UserRole::FirmAdmin,
            UserRole::Dispatcher,
            UserRole::Hr,
        ]);
    }

    private function userOptions()
    {
        return User::query()
            ->orderBy('name')
            ->get(['id', 'name', 'email']);
    }

}
