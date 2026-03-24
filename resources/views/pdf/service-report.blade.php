<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="utf-8">
    <title>{{ $report['title'] ?? 'Leistungsverzeichnis' }} {{ $offer->number ?? '' }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; color: #1f2937; font-size: 11px; }
        .header { display: flex; justify-content: space-between; margin-bottom: 16px; }
        .title { font-size: 18px; font-weight: bold; }
        .muted { color: #6b7280; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th, td { border-bottom: 1px solid #e5e7eb; padding: 6px 4px; text-align: left; vertical-align: top; }
        th { font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #6b7280; }
        .section-title { margin-top: 18px; font-size: 12px; font-weight: bold; }
        .days { text-align: center; width: 20px; }
        .tight { width: 80px; }
        .small { font-size: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <div class="title">{{ $report['title'] ?? 'Leistungsverzeichnis' }}</div>
            <div class="muted">{{ $offer->number ?? '—' }}</div>
        </div>
        <div class="small">
            <div>Kunde: {{ $offer->customer?->name ?? '—' }}</div>
            <div>Objekt: {{ $offer->site?->name ?? '—' }}</div>
        </div>
    </div>

    <div class="muted small">{{ $report['schedule_note'] ?? '' }}</div>

    <div class="section-title">Reinigungsplan</div>
    <table>
        <thead>
            <tr>
                <th class="tight">Raum-Nr.</th>
                <th>Raumart/Bezeichnung</th>
                <th class="tight">Bodenbelag</th>
                <th class="tight">Fläche m²</th>
                <th class="tight">Häufigkeit</th>
                <th class="days">Mo</th>
                <th class="days">Di</th>
                <th class="days">Mi</th>
                <th class="days">Do</th>
                <th class="days">Fr</th>
                <th class="days">Sa</th>
                <th class="days">So</th>
                <th class="tight">Woche</th>
            </tr>
        </thead>
        <tbody>
            @forelse(($report['plan_rows'] ?? []) as $row)
                <tr>
                    <td>{{ $row['area'] ?? '' }}</td>
                    <td>{{ $row['room'] ?? '' }}</td>
                    <td>{{ $row['flooring'] ?? '' }}</td>
                    <td>{{ $row['size_m2'] ?? '' }}</td>
                    <td>{{ $row['frequency'] ?? '' }}</td>
                    <td class="days">{{ !empty($row['days']['mo']) ? 'x' : '' }}</td>
                    <td class="days">{{ !empty($row['days']['di']) ? 'x' : '' }}</td>
                    <td class="days">{{ !empty($row['days']['mi']) ? 'x' : '' }}</td>
                    <td class="days">{{ !empty($row['days']['do']) ? 'x' : '' }}</td>
                    <td class="days">{{ !empty($row['days']['fr']) ? 'x' : '' }}</td>
                    <td class="days">{{ !empty($row['days']['sa']) ? 'x' : '' }}</td>
                    <td class="days">{{ !empty($row['days']['so']) ? 'x' : '' }}</td>
                    <td>{{ $row['week'] ?? '' }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="13" class="muted">Keine Räume erfasst.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    @foreach(($report['sections'] ?? []) as $section)
        <div class="section-title">{{ $section['title'] ?? 'Leistungsbereich' }}</div>
        <table>
            <thead>
                <tr>
                    <th>Auszuführende Tätigkeiten</th>
                    <th class="tight">Häufigkeit</th>
                    <th class="days">Mo</th>
                    <th class="days">Di</th>
                    <th class="days">Mi</th>
                    <th class="days">Do</th>
                    <th class="days">Fr</th>
                    <th class="days">Sa</th>
                    <th class="days">So</th>
                    <th class="tight">Woche</th>
                </tr>
            </thead>
            <tbody>
                @foreach(($section['tasks'] ?? []) as $task)
                    <tr>
                        <td>{{ $task['label'] ?? '' }}</td>
                        <td>{{ $task['frequency'] ?? '' }}</td>
                        <td class="days">{{ !empty($task['days']['mo']) ? 'x' : '' }}</td>
                        <td class="days">{{ !empty($task['days']['di']) ? 'x' : '' }}</td>
                        <td class="days">{{ !empty($task['days']['mi']) ? 'x' : '' }}</td>
                        <td class="days">{{ !empty($task['days']['do']) ? 'x' : '' }}</td>
                        <td class="days">{{ !empty($task['days']['fr']) ? 'x' : '' }}</td>
                        <td class="days">{{ !empty($task['days']['sa']) ? 'x' : '' }}</td>
                        <td class="days">{{ !empty($task['days']['so']) ? 'x' : '' }}</td>
                        <td>{{ $task['week'] ?? '' }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @endforeach
</body>
</html>
