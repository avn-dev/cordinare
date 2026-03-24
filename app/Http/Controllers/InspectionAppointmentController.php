<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreInspectionAppointmentRequest;
use App\Http\Requests\UpdateInspectionAppointmentRequest;
use App\Mail\InspectionConfirmationMail;
use App\Models\Customer;
use App\Models\InspectionAppointment;
use App\Models\Site;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class InspectionAppointmentController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', InspectionAppointment::class);

        $tenantId = $request->user()?->tenant_id;

        $appointments = InspectionAppointment::query()
            ->with(['site', 'customer', 'assignedUser'])
            ->where('tenant_id', $tenantId)
            ->latest('starts_at')
            ->paginate(20)
            ->withQueryString();

        $sites = Site::query()
            ->where('tenant_id', $tenantId)
            ->orderBy('name')
            ->get(['id', 'name', 'customer_id']);

        $customers = Customer::query()
            ->where('tenant_id', $tenantId)
            ->orderBy('name')
            ->get(['id', 'name', 'email']);

        $users = User::query()
            ->where('tenant_id', $tenantId)
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('inspections/index', [
            'appointments' => $appointments->through(fn (InspectionAppointment $appointment) => [
                'id' => $appointment->id,
                'status' => $appointment->status,
                'starts_at' => $appointment->starts_at?->toIso8601String(),
                'ends_at' => $appointment->ends_at?->toIso8601String(),
                'sent_at' => $appointment->sent_at?->toIso8601String(),
                'notes' => $appointment->notes,
                'site' => $appointment->site ? [
                    'id' => $appointment->site->id,
                    'name' => $appointment->site->name,
                ] : null,
                'customer' => $appointment->customer ? [
                    'id' => $appointment->customer->id,
                    'name' => $appointment->customer->name,
                    'email' => $appointment->customer->email,
                ] : null,
                'assigned_user' => $appointment->assignedUser ? [
                    'id' => $appointment->assignedUser->id,
                    'name' => $appointment->assignedUser->name,
                ] : null,
            ]),
            'sites' => $sites,
            'customers' => $customers,
            'users' => $users,
            'current_user_id' => $request->user()?->id,
        ]);
    }

    public function store(StoreInspectionAppointmentRequest $request)
    {
        $this->authorize('create', InspectionAppointment::class);

        $payload = $request->validated();
        $tenantId = $request->user()?->tenant_id;

        $appointment = InspectionAppointment::create([
            'tenant_id' => $tenantId,
            'site_id' => $payload['site_id'],
            'customer_id' => $payload['customer_id'],
            'assigned_user_id' => $payload['assigned_user_id'] ?? $request->user()?->id,
            'starts_at' => $payload['starts_at'],
            'ends_at' => $payload['ends_at'] ?? null,
            'notes' => $payload['notes'] ?? null,
            'status' => 'planned',
            'email_subject' => $this->defaultSubject($payload['site_id']),
            'email_body' => $this->defaultBody(
                $payload['site_id'],
                $payload['starts_at'],
                $payload['ends_at'] ?? null,
                $payload['notes'] ?? null,
            ),
        ]);

        return redirect()
            ->route('inspections.compose', $appointment)
            ->with('success', 'Besichtigungstermin angelegt. Bitte E-Mail prüfen und senden.');
    }

    public function update(UpdateInspectionAppointmentRequest $request, InspectionAppointment $appointment)
    {
        $this->authorize('update', $appointment);

        $appointment->update([
            'status' => $request->validated('status'),
        ]);

        return redirect()
            ->back()
            ->with('success', 'Status aktualisiert.');
    }

    public function resend(Request $request, InspectionAppointment $appointment)
    {
        $this->authorize('update', $appointment);

        $payload = $request->validate([
            'email_subject' => ['nullable', 'string', 'max:255'],
            'email_body' => ['nullable', 'string', 'max:5000'],
        ]);

        if ($payload !== []) {
            $appointment->update(array_filter($payload, fn ($value) => $value !== null));
        }

        $this->sendConfirmation($appointment, true);

        return redirect()
            ->back()
            ->with('success', 'Terminbestätigung wurde erneut gesendet.');
    }

    public function preview(InspectionAppointment $appointment)
    {
        $this->authorize('view', $appointment);

        $appointment->loadMissing(['customer', 'site']);

        return view('emails.inspection-confirmation', [
            'appointment' => $appointment,
        ]);
    }

    public function compose(InspectionAppointment $appointment)
    {
        $this->authorize('view', $appointment);

        $appointment->loadMissing(['customer', 'site']);

        $subject = $appointment->email_subject ?: $this->defaultSubject($appointment->site_id);
        $body = $appointment->email_body ?: $this->defaultBody(
            $appointment->site_id,
            $appointment->starts_at?->toIso8601String() ?? now()->toIso8601String(),
            $appointment->ends_at?->toIso8601String(),
            $appointment->notes,
        );

        return Inertia::render('inspections/compose', [
            'appointment' => [
                'id' => $appointment->id,
                'email_subject' => $subject,
                'email_body' => $body,
                'site' => $appointment->site ? [
                    'id' => $appointment->site->id,
                    'name' => $appointment->site->name,
                ] : null,
                'customer' => $appointment->customer ? [
                    'id' => $appointment->customer->id,
                    'name' => $appointment->customer->name,
                    'email' => $appointment->customer->email,
                ] : null,
                'starts_at' => $appointment->starts_at?->toIso8601String(),
                'ends_at' => $appointment->ends_at?->toIso8601String(),
                'notes' => $appointment->notes,
            ],
            'preview_url' => route('inspections.preview', $appointment),
            'send_url' => route('inspections.resend', $appointment),
        ]);
    }

    public function calendar(Request $request)
    {
        $this->authorize('viewAny', InspectionAppointment::class);

        $user = $request->user();
        $tenantId = $user?->tenant_id;
        $monthParam = $request->string('month')->toString();

        $monthStart = now()->startOfMonth();
        if ($monthParam !== '') {
            try {
                $monthStart = now()->createFromFormat('Y-m', $monthParam)->startOfMonth();
            } catch (\Throwable) {
                $monthStart = now()->startOfMonth();
            }
        }
        $monthEnd = $monthStart->copy()->endOfMonth();

        $appointments = InspectionAppointment::query()
            ->with(['site', 'customer'])
            ->where('tenant_id', $tenantId)
            ->where('assigned_user_id', $user?->id)
            ->whereBetween('starts_at', [$monthStart, $monthEnd])
            ->orderBy('starts_at')
            ->get();

        return Inertia::render('inspections/calendar', [
            'month' => $monthStart->format('Y-m'),
            'appointments' => $appointments->map(fn (InspectionAppointment $appointment) => [
                'id' => $appointment->id,
                'status' => $appointment->status,
                'starts_at' => $appointment->starts_at?->toIso8601String(),
                'ends_at' => $appointment->ends_at?->toIso8601String(),
                'site' => $appointment->site ? [
                    'id' => $appointment->site->id,
                    'name' => $appointment->site->name,
                ] : null,
                'customer' => $appointment->customer ? [
                    'id' => $appointment->customer->id,
                    'name' => $appointment->customer->name,
                ] : null,
            ]),
        ]);
    }

    private function sendConfirmation(InspectionAppointment $appointment, bool $force = false): void
    {
        $appointment->loadMissing(['customer', 'site']);

        if (! $appointment->customer?->email) {
            return;
        }

        if ($appointment->sent_at && ! $force) {
            return;
        }

        if (! $appointment->email_subject) {
            $appointment->email_subject = $this->defaultSubject($appointment->site_id);
        }
        if (! $appointment->email_body) {
            $appointment->email_body = $this->defaultBody(
                $appointment->site_id,
                $appointment->starts_at?->toIso8601String() ?? now()->toIso8601String(),
                $appointment->ends_at?->toIso8601String(),
                $appointment->notes,
            );
        }

        Mail::to($appointment->customer->email)->send(new InspectionConfirmationMail($appointment));

        $appointment->update([
            'sent_at' => now(),
            'status' => $appointment->status === 'planned' ? 'confirmed' : $appointment->status,
            'email_subject' => $appointment->email_subject,
            'email_body' => $appointment->email_body,
        ]);
    }

    private function defaultSubject(int $siteId): string
    {
        $site = Site::query()->select('id', 'name')->find($siteId);
        return 'Terminbestätigung Besichtigung: '.($site?->name ?? 'Objekt');
    }

    private function defaultBody(int $siteId, string $startsAt, ?string $endsAt, ?string $notes): string
    {
        $site = Site::query()->find($siteId);
        $start = Carbon::parse($startsAt)->format('d.m.Y H:i');
        $end = $endsAt ? Carbon::parse($endsAt)->format('H:i') : null;

        $address = trim(implode(' ', array_filter([
            $site?->address_line1,
            $site?->address_line2,
            $site?->postal_code,
            $site?->city,
        ])));

        $lines = [
            'Guten Tag,',
            '',
            'hiermit bestätigen wir den Besichtigungstermin.',
            '',
            'Objekt: '.($site?->name ?? '—'),
            'Adresse: '.($address !== '' ? $address : '—'),
            'Datum/Uhrzeit: '.$start.($end ? ' – '.$end : ''),
        ];

        if ($notes) {
            $lines[] = '';
            $lines[] = 'Hinweise: '.$notes;
        }

        $lines[] = '';
        $lines[] = 'Mit freundlichen Grüßen';

        return implode("\n", $lines);
    }
}
