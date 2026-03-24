# API

## Lead Inbox
### POST /api/v1/leads
Erstellt einen Lead (Kontaktanfrage) für den zugehörigen Tenant.

Header:
- `X-Lead-Api-Key: <tenant-api-key>` (konfigurierbar via `CORDINARE_LEAD_API_KEY_HEADER`)

Request:
```json
{
  "name": "Max Mustermann",
  "email": "max@example.com",
  "phone": "+49 170 123456",
  "message": "Bitte rufen Sie mich an.",
  "source": "website",
  "tags": ["contact-form"],
  "meta": {"campaign": "winter-2026"},
  "follow_up_at": "2026-02-20T09:00:00+01:00"
}
```

Response (201):
```json
{
  "data": {
    "id": 1,
    "status": "new",
    "name": "Max Mustermann",
    "email": "max@example.com",
    "phone": "+49 170 123456",
    "message": "Bitte rufen Sie mich an.",
    "source": "website",
    "tags": ["contact-form"],
    "meta": {"campaign": "winter-2026", "ip": "127.0.0.1", "user_agent": "..."},
    "follow_up_at": "2026-02-20T09:00:00+01:00",
    "created_at": "2026-02-14T03:05:00+01:00"
  }
}
```

Fehler:
- 401: fehlender oder ungültiger API-Key.
- 422: Validierungsfehler.

## Leads (Backoffice)
### GET /leads/{lead}
Zeigt Lead-Details inkl. Konvertierungs-Form.

### POST /leads/{lead}/convert
Konvertiert einen Lead zu Kunde (optional inkl. Objekt).

## Customers (Backoffice API)
### GET /api/v1/customers
Listet Kunden.

### POST /api/v1/customers
Erstellt einen Kunden.

Request:
```json
{
  "name": "Musterkunde GmbH",
  "status": "active",
  "contact_name": "Laura Muster",
  "email": "kontakt@musterkunde.de",
  "phone": "+49 30 123456",
  "notes": "Wöchentliche Reinigung"
}
```

## Sites (Backoffice API)
### GET /api/v1/sites
Listet Objekte.

### POST /api/v1/sites
Erstellt ein Objekt.

Request:
```json
{
  "customer_id": 1,
  "name": "Objekt West",
  "status": "active",
  "address_line1": "Musterstraße 1",
  "postal_code": "10115",
  "city": "Berlin",
  "country": "DE",
  "time_windows": [
    {"day": "monday", "from": "06:00", "to": "10:00"}
  ]
}
```
Backoffice UI:
- `/sites` (Filter: Kunde, Status, Suche, Sortierung)
- `/sites/create`, `/sites/{site}/edit`

## Offers (Backoffice API)
### GET /api/v1/offers
Listet Angebote.

### POST /api/v1/offers
Erstellt ein Angebot inklusive Items.

Request:
```json
{
  "customer_id": 1,
  "site_id": 2,
  "number": "OFF-20260214-ABC123",
  "currency": "EUR",
  "valid_until": "2026-03-01",
  "items": [
    {
      "description": "Grundreinigung",
      "quantity": 2,
      "unit": "Std",
      "unit_price": 45,
      "interval": "einmalig"
    }
  ]
}
```

### POST /api/v1/offers/{offer}/send
Stößt den Versand (Mail + PDF) asynchron an.
Web-UI PDF Download:
- `GET /offers/{offer}/pdf`

## Shifts (Backoffice API)
### GET /api/v1/shifts
Listet Schichten.

### POST /api/v1/shifts
Erstellt eine Schicht.

Request:
```json
{
  "site_id": 1,
  "title": "Frühschicht Objekt West",
  "starts_at": "2026-02-15T06:00:00+01:00",
  "ends_at": "2026-02-15T14:00:00+01:00",
  "required_roles": ["employee"],
  "status": "scheduled"
}
```

## Assignments (Backoffice API)
### POST /api/v1/assignments
Weist Mitarbeitende einer Schicht zu.

Request:
```json
{
  "shift_id": 1,
  "user_id": 5,
  "role": "employee",
  "status": "assigned"
}
```

## Time Entries (Mobile/API)
### POST /api/v1/time-entries/check-in
Check-in inkl. optionaler GPS-Daten.

Request:
```json
{
  "shift_id": 1,
  "latitude": 52.52,
  "longitude": 13.405,
  "accuracy": 12
}
```

### POST /api/v1/time-entries/{timeEntry}/check-out
Check-out inkl. Pause, optional GPS.

Request:
```json
{
  "break_minutes": 30,
  "latitude": 52.52,
  "longitude": 13.405,
  "accuracy": 10,
  "notes": "Alles erledigt."
}
```

Plausibilitätschecks:
- Check-in nur im definierten Zeitfenster (konfigurierbar).
- Mitarbeiter muss der Schicht zugewiesen sein.
- Geofence-Abweichungen werden als `anomaly_flags` gespeichert.
 - Regel-Flags: `negative_break`, `checkout_before_checkin`.

### GET /time-entries/export/csv
CSV-Export für Zeiterfassungen (nur Admin/HR/Disponent).
Query-Parameter (optional):
- `user_id`, `shift_id`, `from`, `to`, `flag`

## Absences (Backoffice API)
### GET /api/v1/absences
Listet Abwesenheiten.
Filter:
- `status`, `type`, `user_id`, `from`, `to`, `flag`

### POST /api/v1/absences
Erstellt eine Abwesenheit (z.B. Urlaub, Krankheit).

Request:
```json
{
  "user_id": 5,
  "type": "vacation",
  "starts_on": "2026-02-20",
  "ends_on": "2026-02-22",
  "notes": "Kurzurlaub"
}
```
Hinweis:
- Mitarbeiter-Requests setzen `status` immer auf `pending` und ignorieren fremde `user_id`.
- Response enthält `rule_flags` (z.B. `overlap`, `long_absence`, `sick_without_note`).

### PUT /api/v1/absences/{absence}
Aktualisiert eine Abwesenheit (Status, Notizen).
Hinweis:
- Mitarbeiter können den `status` nicht ändern.

## Exporte (Backoffice)
### GET /absences/export/csv
CSV-Export für Abwesenheiten (nur Admin/HR/Disponent).
Query-Parameter (optional):
- `status`, `type`, `user_id`, `from`, `to`, `flag`

## Audit Logs (Backoffice API)
### GET /api/v1/audit-logs
Listet Audit-Logs.
Filter:
- `action`, `auditable_type`, `actor_id`, `request_id`, `from`, `to`

### GET /audit-logs/export/csv
CSV-Export für Audit-Logs (nur Admin/HR/Disponent).
Query-Parameter (optional):
- `action`, `auditable_type`, `actor_id`, `request_id`, `from`, `to`
