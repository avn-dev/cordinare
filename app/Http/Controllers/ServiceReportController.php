<?php

namespace App\Http\Controllers;

use App\Http\Resources\OfferResource;
use App\Enums\UserRole;
use App\Models\Offer;
use App\Models\ServiceReport;
use App\Models\Shift;
use App\Models\Site;
use App\Support\ServiceReports\ServiceReportTemplate;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ServiceReportController extends Controller
{
    public function edit(Offer $offer)
    {
        $this->authorize('view', $offer);

        $offer->load(['customer', 'site']);

        $report = ServiceReport::query()->firstOrCreate(
            ['offer_id' => $offer->id],
            [
                'tenant_id' => $offer->tenant_id,
                'payload' => ServiceReportTemplate::defaultPayload(),
            ]
        );

        return Inertia::render('offers/service-report', [
            'offer' => OfferResource::make($offer)->resolve(),
            'report' => $report->payload,
        ]);
    }

    public function update(Request $request, Offer $offer)
    {
        $this->authorize('update', $offer);

        $payload = $request->validate([
            'payload' => ['required', 'array'],
            'payload.title' => ['required', 'string', 'max:120'],
            'payload.schedule_note' => ['nullable', 'string', 'max:255'],
            'payload.plan_rows' => ['array'],
            'payload.plan_rows.*.area' => ['nullable', 'string', 'max:50'],
            'payload.plan_rows.*.room' => ['nullable', 'string', 'max:150'],
            'payload.plan_rows.*.flooring' => ['nullable', 'string', 'max:80'],
            'payload.plan_rows.*.size_m2' => ['nullable', 'string', 'max:40'],
            'payload.plan_rows.*.frequency' => ['nullable', 'string', 'max:80'],
            'payload.plan_rows.*.week' => ['nullable', 'string', 'max:40'],
            'payload.plan_rows.*.days' => ['array'],
            'payload.plan_rows.*.days.*' => ['boolean'],
            'payload.sections' => ['array'],
            'payload.sections.*.title' => ['required', 'string', 'max:255'],
            'payload.sections.*.tasks' => ['array'],
            'payload.sections.*.tasks.*.label' => ['required', 'string', 'max:255'],
            'payload.sections.*.tasks.*.frequency' => ['nullable', 'string', 'max:80'],
            'payload.sections.*.tasks.*.week' => ['nullable', 'string', 'max:40'],
            'payload.sections.*.tasks.*.days' => ['array'],
            'payload.sections.*.tasks.*.days.*' => ['boolean'],
        ])['payload'];

        $report = ServiceReport::query()->firstOrCreate(
            ['offer_id' => $offer->id],
            [
                'tenant_id' => $offer->tenant_id,
                'payload' => ServiceReportTemplate::defaultPayload(),
            ]
        );

        $report->payload = $this->normalizePayload($payload);
        $report->pdf_path = null;
        $report->save();

        return redirect()
            ->route('offers.service-report.edit', $offer)
            ->with('success', 'Leistungsverzeichnis gespeichert.');
    }

    public function pdf(Offer $offer)
    {
        $this->authorize('view', $offer);

        $offer->load(['customer', 'site']);

        $report = ServiceReport::query()->firstOrCreate(
            ['offer_id' => $offer->id],
            [
                'tenant_id' => $offer->tenant_id,
                'payload' => ServiceReportTemplate::defaultPayload(),
            ]
        );

        return $this->downloadReportPdf($offer, $report);
    }

    public function sitePdf(Request $request, Site $site)
    {
        $user = $request->user();

        if ($user?->role === UserRole::Employee) {
            $assigned = Shift::query()
                ->where('site_id', $site->id)
                ->whereHas('assignments', fn ($query) => $query->where('user_id', $user->id))
                ->exists();

            abort_unless($assigned, 403);
        } else {
            $this->authorize('view', $site);
        }

        $offer = Offer::query()
            ->where('site_id', $site->id)
            ->whereHas('serviceReport')
            ->latest()
            ->first();

        abort_unless($offer, 404);

        $offer->load(['customer', 'site']);
        $report = $offer->serviceReport;

        return $this->downloadReportPdf($offer, $report);
    }

    private function normalizePayload(array $payload): array
    {
        $payload['plan_rows'] = array_map(function (array $row): array {
            $row['days'] = $this->normalizeDays($row['days'] ?? []);
            $row['week'] = $row['week'] ?? '';
            return $row;
        }, $payload['plan_rows'] ?? []);

        $payload['sections'] = array_map(function (array $section): array {
            $section['tasks'] = array_map(function (array $task): array {
                $task['days'] = $this->normalizeDays($task['days'] ?? []);
                $task['week'] = $task['week'] ?? '';
                return $task;
            }, $section['tasks'] ?? []);
            return $section;
        }, $payload['sections'] ?? []);

        return $payload;
    }

    private function sortPayloadForPdf(array $payload): array
    {
        $payload['plan_rows'] = $this->sortByFrequency($payload['plan_rows'] ?? []);

        $payload['sections'] = array_map(function (array $section): array {
            $section['tasks'] = $this->sortByFrequency($section['tasks'] ?? []);
            return $section;
        }, $payload['sections'] ?? []);

        return $payload;
    }

    private function sortByFrequency(array $rows): array
    {
        $indexed = array_map(function ($row, $index) {
            return [
                'row' => $row,
                'index' => $index,
                'key' => $this->frequencySortKey($row['frequency'] ?? '', $row['days'] ?? []),
            ];
        }, $rows, array_keys($rows));

        usort($indexed, function (array $a, array $b): int {
            [$rankA, $countA, $labelA] = $a['key'];
            [$rankB, $countB, $labelB] = $b['key'];

            if ($rankA !== $rankB) {
                return $rankA <=> $rankB;
            }
            if ($countA !== $countB) {
                return $countA <=> $countB;
            }
            if ($labelA !== $labelB) {
                return $labelA <=> $labelB;
            }
            return $a['index'] <=> $b['index'];
        });

        return array_map(fn (array $item) => $item['row'], $indexed);
    }

    private function frequencySortKey(?string $frequency, array $days): array
    {
        $raw = trim((string) $frequency);
        $dayCount = 0;
        foreach (['mo', 'di', 'mi', 'do', 'fr', 'sa', 'so'] as $day) {
            if (! empty($days[$day])) {
                $dayCount++;
            }
        }
        if ($raw === '') {
            return [99, 0, -$dayCount, ''];
        }

        $normalized = function_exists('mb_strtolower') ? mb_strtolower($raw) : strtolower($raw);
        $normalized = preg_replace('/\s+/', ' ', $normalized) ?? $normalized;

        $count = 0;
        if (preg_match('/(\d+)/', $normalized, $matches)) {
            $count = (int) $matches[1];
        }

        if (str_contains($normalized, 'täglich') || str_contains($normalized, 'taeglich')) {
            $rank = 10;
        } elseif (str_contains($normalized, 'wöchentlich') || str_contains($normalized, 'woechentlich')) {
            $rank = 20;
        } elseif (str_contains($normalized, 'monatlich')) {
            $rank = 30;
        } elseif (str_contains($normalized, 'jährlich') || str_contains($normalized, 'jaehrlich')) {
            $rank = 40;
        } elseif (str_contains($normalized, 'bedarf')) {
            $rank = 80;
        } else {
            $rank = 70;
        }

        return [$rank, $count, -$dayCount, $normalized];
    }

    private function normalizeDays(array $days): array
    {
        return [
            'mo' => (bool) ($days['mo'] ?? false),
            'di' => (bool) ($days['di'] ?? false),
            'mi' => (bool) ($days['mi'] ?? false),
            'do' => (bool) ($days['do'] ?? false),
            'fr' => (bool) ($days['fr'] ?? false),
            'sa' => (bool) ($days['sa'] ?? false),
            'so' => (bool) ($days['so'] ?? false),
        ];
    }

    private function downloadReportPdf(Offer $offer, ServiceReport $report)
    {
        if (! $report->pdf_path || ! Storage::disk('local')->exists($report->pdf_path)) {
            $filename = $offer->number ? $offer->number : 'offer-'.$offer->id;
            $path = 'service-reports/'.$report->id.'/'.$filename.'-leistungsverzeichnis.pdf';

            $payload = $this->sortPayloadForPdf($report->payload);

            $pdf = Pdf::loadView('pdf.service-report', [
                'offer' => $offer,
                'report' => $payload,
            ]);
            Storage::disk('local')->put($path, $pdf->output());

            $report->pdf_path = $path;
            $report->save();
        }

        return Storage::disk('local')->download($report->pdf_path);
    }
}
