<?php

namespace App\Http\Controllers;

use App\Http\Resources\LeadResource;
use App\Models\Absence;
use App\Models\Lead;
use App\Models\Offer;
use App\Models\Shift;
use App\Models\Site;
use App\Models\TimeEntry;
use App\Models\SiteIssue;
use App\Enums\UserRole;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        if ($request->user()?->role === UserRole::Employee) {
            return redirect()->route('employee.portal');
        }

        $tenantId = $request->user()?->tenant_id;
        $timezone = $request->user()?->tenant?->timezone ?? config('app.timezone');

        $startOfMonth = Carbon::now($timezone)->startOfMonth();
        $endOfMonth = Carbon::now($timezone)->endOfMonth();
        $startOfWeek = Carbon::now($timezone)->startOfWeek(Carbon::MONDAY);
        $endOfWeek = Carbon::now($timezone)->endOfWeek(Carbon::SUNDAY);

        $leadCount = Lead::query()
            ->where('tenant_id', $tenantId)
            ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
            ->count();

        $activeSites = Site::query()
            ->where('tenant_id', $tenantId)
            ->where('status', 'active')
            ->count();

        $shiftCount = Shift::query()
            ->where('tenant_id', $tenantId)
            ->whereBetween('starts_at', [$startOfWeek, $endOfWeek])
            ->count();

        $pendingTimeEntries = TimeEntry::query()
            ->where('tenant_id', $tenantId)
            ->whereNull('check_out_at')
            ->count();

        $pendingAbsences = Absence::query()
            ->where('tenant_id', $tenantId)
            ->where('status', 'pending')
            ->count();

        $offersSent = Offer::query()
            ->where('tenant_id', $tenantId)
            ->where('status', 'sent')
            ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
            ->count();

        $openIssues = SiteIssue::query()
            ->where('tenant_id', $tenantId)
            ->where('status', 'open')
            ->count();

        $recentLeads = Lead::query()
            ->where('tenant_id', $tenantId)
            ->latest()
            ->limit(5)
            ->get();

        $recentShifts = Shift::query()
            ->where('tenant_id', $tenantId)
            ->whereBetween('starts_at', [$startOfWeek, $endOfWeek])
            ->orderBy('starts_at')
            ->limit(5)
            ->get();

        $recentIssues = SiteIssue::query()
            ->with('site')
            ->where('tenant_id', $tenantId)
            ->latest()
            ->limit(5)
            ->get();

        return Inertia::render('dashboard', [
            'metrics' => [
                [
                    'label' => 'Neue Leads (Monat)',
                    'value' => $leadCount,
                    'delta' => $leadCount === 0 ? 'Keine neuen Leads' : 'Aktiv',
                    'tone' => 'amber',
                ],
                [
                    'label' => 'Aktive Objekte',
                    'value' => $activeSites,
                    'delta' => 'Live Standorte',
                    'tone' => 'emerald',
                ],
                [
                    'label' => 'Schichten diese Woche',
                    'value' => $shiftCount,
                    'delta' => 'Planungsfenster',
                    'tone' => 'sky',
                ],
                [
                    'label' => 'Offene Check-outs',
                    'value' => $pendingTimeEntries,
                    'delta' => 'Zeitprüfung ausstehend',
                    'tone' => 'rose',
                ],
            ],
            'alerts' => [
                [
                    'label' => 'Abwesenheiten offen',
                    'value' => $pendingAbsences,
                ],
                [
                    'label' => 'Angebote gesendet (Monat)',
                    'value' => $offersSent,
                ],
                [
                    'label' => 'Reklamationen offen',
                    'value' => $openIssues,
                ],
            ],
            'recent' => [
                'leads' => LeadResource::collection($recentLeads),
                'shifts' => $recentShifts->map(fn (Shift $shift) => [
                    'id' => $shift->id,
                    'title' => $shift->title,
                    'starts_at' => $shift->starts_at?->toIso8601String(),
                    'ends_at' => $shift->ends_at?->toIso8601String(),
                ]),
                'issues' => $recentIssues->map(fn (SiteIssue $issue) => [
                    'id' => $issue->id,
                    'message' => $issue->message,
                    'created_at' => $issue->created_at?->toIso8601String(),
                    'site' => $issue->site ? [
                        'id' => $issue->site->id,
                        'name' => $issue->site->name,
                    ] : null,
                ]),
            ],
        ]);
    }
}
