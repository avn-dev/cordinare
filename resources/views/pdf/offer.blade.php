<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="utf-8">
    <title>Angebot {{ $offer->number }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; color: #1f2937; font-size: 12px; }
        .header { display: flex; justify-content: space-between; margin-bottom: 24px; }
        .title { font-size: 20px; font-weight: bold; }
        .muted { color: #6b7280; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { border-bottom: 1px solid #e5e7eb; padding: 8px 0; text-align: left; }
        th { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; }
        .total { text-align: right; font-size: 14px; font-weight: bold; margin-top: 16px; }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <div class="title">Angebot</div>
            <div class="muted">{{ $offer->number }}</div>
        </div>
        <div>
            <div>Version {{ $offer->version }}</div>
            <div class="muted">Gültig bis: {{ $offer->valid_until?->format('d.m.Y') ?? '—' }}</div>
        </div>
    </div>

    <div>
        <strong>Kunde:</strong> {{ $offer->customer->name }}<br>
        @if($offer->site)
            <strong>Objekt:</strong> {{ $offer->site->name }}<br>
        @endif
    </div>

    <table>
        <thead>
            <tr>
                <th>Leistung</th>
                <th>Menge</th>
                <th>Preis</th>
                <th>Intervall</th>
            </tr>
        </thead>
        <tbody>
            @foreach($offer->items as $item)
                <tr>
                    <td>{{ $item->description }}</td>
                    <td>{{ $item->quantity }} {{ $item->unit }}</td>
                    <td>{{ number_format($item->quantity * $item->unit_price, 2, ',', '.') }} {{ $offer->currency }}</td>
                    <td>{{ $item->interval ?? '—' }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="total">
        Gesamt: {{ number_format($offer->items->sum(fn ($i) => $i->quantity * $i->unit_price), 2, ',', '.') }} {{ $offer->currency }}
    </div>

    @if($offer->notes)
        <p class="muted">{{ $offer->notes }}</p>
    @endif
</body>
</html>
