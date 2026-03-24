# Cordinare

Cordinare ist ein SaaS-Backoffice für Reinigungs- und Sicherheitsunternehmen. Der Fokus liegt auf Lead-Management, Kunden/Objekten, Angebotswesen, Schichtplanung, Abwesenheiten und Zeiterfassung – DSGVO-konform und auditierbar.

## Stack
- Backend: Laravel 12
- Frontend: React (Inertia + Starter Kit)
- Auth: Laravel Fortify
- Tests: Pest
- DB (lokal): SQLite

**DB-Wahl (Begründung):** SQLite ist für lokale Entwicklung schnell und wartungsarm (keine separate DB-Instanz). Für Produktion und Multi-Tenant-Betrieb ist PostgreSQL vorgesehen.

## Setup (lokal)
1. Abhängigkeiten installieren
```
composer install
npm install
```
2. Environment-Datei anlegen
```
cp .env.example .env
php artisan key:generate
```
3. DB vorbereiten
```
php artisan migrate
```
4. Assets bauen
```
npm run dev
```

## Tenancy (MVP)
- Strategie: Single DB + `tenant_id` in allen tenant-spezifischen Tabellen.
- Tenant-Auflösung:
  - Web: über eingeloggten User (`SetTenantFromUser` Middleware).
  - API (Lead Inbox): über API-Key Header (`SetTenantFromApiKey`).

Details: `docs/architecture.md`.

## Lead Inbox API (MVP)
Endpoint:
- `POST /api/v1/leads`

Header:
- `X-Lead-Api-Key: <tenant-api-key>` (konfigurierbar via `CORDINARE_LEAD_API_KEY_HEADER`)

Beispiel-Payload:
```json
{
  "name": "Max Mustermann",
  "email": "max@example.com",
  "phone": "+49 170 123456",
  "message": "Bitte rufen Sie mich an.",
  "source": "website",
  "tags": ["contact-form"],
  "meta": {"campaign": "winter-2026"}
}
```

### Tenant + API-Key anlegen (lokal)
Empfohlen via Artisan (sicher, inkl. optionalem Admin-User):
```
php artisan cordinare:tenant:create "Beispiel GmbH" --email=admin@beispiel.de
```
Der Klartext-API-Key wird **nur einmal** ausgegeben. Bitte sicher ablegen.

Optional: Admin-User überspringen
```
php artisan cordinare:tenant:create "Beispiel GmbH" --no-user
```

## Login & UI
1. Admin-User per Command erstellen (siehe oben).
2. App starten und im Browser öffnen.
3. Login unter `/login` mit dem Admin-User.
4. Inbox unter `/leads`.
5. Lead öffnen (`/leads/{lead}`) und in Kunden konvertieren.
6. Objekt anlegen unter `/sites/create` und filtern unter `/sites`.
7. Mitarbeiter verwalten unter `/users`.
8. Schichten planen im Kalender unter `/shifts`.
9. Inventar verwalten unter `/inventory`.
10. Regelmäßige Schichten unter `/shift-templates`.

## Zusätzliche Commands
User für bestehenden Tenant:
```
php artisan cordinare:user:create <TENANT_ID> user@firma.de --name="Mira Beispiel" --role=dispatcher
```

Demo-Daten:
```
php artisan cordinare:demo:seed --leads=20 --customers=5 --sites=10 --offers=6 --shifts=6
```
Optional mit vorhandenem Tenant:
```
php artisan cordinare:demo:seed --tenant=<TENANT_ID> --leads=10 --customers=3 --sites=6 --offers=4 --shifts=4
```
Demo-Accounts:
- Admin: `admin@cordinare.local`
- Mitarbeiter: `mitarbeiter@cordinare.local`
- Passwort: `ChangeMe123456`

API-Key Rotation:
```
php artisan cordinare:tenant:rotate-key <TENANT_ID>
```

Leads CSV Export:
```
php artisan cordinare:leads:export <TENANT_ID>
```
Time Entries CSV Export:
```
php artisan cordinare:time-entries:export <TENANT_ID>
```
Filter (optional):
- `--user=`, `--shift=`, `--from=`, `--to=`, `--flag=`
Absences CSV Export:
```
php artisan cordinare:absences:export <TENANT_ID>
```
Filter (optional):
- `--status=`, `--type=`, `--user=`, `--from=`, `--to=`, `--flag=`

Angebote:
- UI: `/offers`
- Versand: Button „Senden“ (PDF + Mail via Queue)
 - CLI: `php artisan cordinare:offer:send <OFFER_ID>`

Abwesenheiten:
- UI: `/absences`

Audit Logs:
- UI: `/audit-logs`

Audit Logs CSV Export:
```
php artisan cordinare:audit-logs:export <TENANT_ID>
```

Queue Worker (lokal):
```
php artisan queue:work --once
```

## Qualität
- Linting: `composer test:lint`
- Tests: `php artisan test`

## Dokumentation
- `docs/architecture.md`
- `docs/api.md`
- `docs/data-protection.md`
- `docs/inventory.md`
- `docs/assumptions.md`
