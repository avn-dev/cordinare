<?php

namespace App\Http\Controllers;

use App\Http\Resources\TimeEntryResource;
use App\Http\Requests\TimeEntryIndexRequest;
use App\Models\TimeEntry;
use App\Models\User;
use App\Support\Exports\TimeEntryCsvExporter;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class TimeEntryController extends Controller
{
    public function index(TimeEntryIndexRequest $request)
    {
        $this->authorize('viewAny', TimeEntry::class);

        $filters = [
            'user_id' => $request->integer('user_id') ?: null,
            'shift_id' => $request->integer('shift_id') ?: null,
            'from' => $request->string('from')->toString(),
            'to' => $request->string('to')->toString(),
            'flag' => $request->string('flag')->toString(),
        ];

        $entries = TimeEntry::query()
            ->with(['shift.site', 'user'])
            ->when($filters['user_id'], fn ($query, $userId) => $query->where('user_id', $userId))
            ->when($filters['shift_id'], fn ($query, $shiftId) => $query->where('shift_id', $shiftId))
            ->when($filters['from'], fn ($query, $from) => $query->whereDate('check_in_at', '>=', $from))
            ->when($filters['to'], fn ($query, $to) => $query->whereDate('check_in_at', '<=', $to))
            ->when($filters['flag'], fn ($query, $flag) => $query->whereJsonContains('anomaly_flags', $flag))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        $users = User::query()
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('time-entries/index', [
            'entries' => TimeEntryResource::collection($entries),
            'filters' => $filters,
            'users' => $users,
        ]);
    }

    public function export(TimeEntryIndexRequest $request)
    {
        $this->authorize('viewAny', TimeEntry::class);

        $tenant = $request->user()->tenant;
        $filename = 'time-entries-'.$tenant->slug.'-'.Carbon::now()->format('Ymd_His').'.csv';
        $filters = [
            'user_id' => $request->integer('user_id') ?: null,
            'shift_id' => $request->integer('shift_id') ?: null,
            'from' => $request->string('from')->toString(),
            'to' => $request->string('to')->toString(),
            'flag' => $request->string('flag')->toString(),
        ];

        return response()->streamDownload(function () use ($tenant, $filters) {
            $handle = fopen('php://output', 'w');
            TimeEntryCsvExporter::writeToHandle($handle, $tenant->id, $filters);
            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }
}
