<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateSiteIssueStatusRequest;
use App\Models\SiteIssue;
use App\Models\SiteIssueFile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class SiteIssueController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', SiteIssue::class);

        $issues = SiteIssue::query()
            ->with(['site.customer'])
            ->where('tenant_id', $request->user()?->tenant_id)
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('qm/index', [
            'issues' => $issues->through(fn (SiteIssue $issue) => [
                'id' => $issue->id,
                'status' => $issue->status,
                'message' => $issue->message,
                'created_at' => optional($issue->created_at)->toIso8601String(),
                'site' => $issue->site ? [
                    'id' => $issue->site->id,
                    'name' => $issue->site->name,
                    'customer' => $issue->site->customer?->name,
                ] : null,
            ]),
        ]);
    }

    public function show(SiteIssue $issue)
    {
        $this->authorize('view', $issue);

        $issue->load(['site.customer', 'files']);

        return Inertia::render('qm/show', [
            'issue' => [
                'id' => $issue->id,
                'status' => $issue->status,
                'message' => $issue->message,
                'created_at' => optional($issue->created_at)->toIso8601String(),
                'site' => $issue->site ? [
                    'id' => $issue->site->id,
                    'name' => $issue->site->name,
                    'customer' => $issue->site->customer?->name,
                ] : null,
                'files' => $issue->files->map(fn (SiteIssueFile $file) => [
                    'id' => $file->id,
                    'name' => $file->original_name,
                    'url' => route('qm.issues.file', [$issue, $file]),
                    'download_url' => route('qm.issues.download', [$issue, $file]),
                ]),
            ],
        ]);
    }

    public function update(UpdateSiteIssueStatusRequest $request, SiteIssue $issue)
    {
        $this->authorize('view', $issue);

        $issue->update([
            'status' => $request->validated('status'),
        ]);

        return redirect()
            ->back()
            ->with('success', 'Status aktualisiert.');
    }

    public function file(SiteIssue $issue, SiteIssueFile $file)
    {
        $this->authorize('view', $issue);

        if ($file->site_issue_id !== $issue->id) {
            abort(404);
        }

        return Storage::disk('local')->response($file->path, $file->original_name, [
            'Content-Type' => $file->mime_type ?? 'application/octet-stream',
        ]);
    }

    public function download(SiteIssue $issue, SiteIssueFile $file)
    {
        $this->authorize('view', $issue);

        if ($file->site_issue_id !== $issue->id) {
            abort(404);
        }

        return Storage::disk('local')->download($file->path, $file->original_name ?? basename($file->path), [
            'Content-Type' => $file->mime_type ?? 'application/octet-stream',
        ]);
    }
}
