# Architecture

## Tenancy
- Strategie: Single DB, alle tenant-spezifischen Tabellen tragen `tenant_id`.
- Auflösung:
  - Web: `SetTenantFromUser` (Tenant aus eingeloggtem User).
  - Lead API: `SetTenantFromApiKey` (Tenant via API-Key Header).
- Scoping: Global Scope (`BelongsToTenant`) filtert nach `tenant_id`, wenn ein Tenant-Kontext gesetzt ist.

## AuthZ (Rollen & Policies)
- Rollen (Enum): `superadmin`, `firm_admin`, `dispatcher`, `hr`, `employee`, `contractor_user`, `customer_readonly`.
- Policies:
  - Aktuell `LeadPolicy` für Inbox-Zugriff.
  - `AbsencePolicy` für Abwesenheiten (Admins/HR/Disponent + Self-Service Mitarbeiter).
  - `superadmin` kann alles (`Gate::before`).

## Audit Logging (Konzept)
- Audit-Events loggen Änderungen an Schichten, Zeiten, Abwesenheiten, Angeboten.
- Struktur (geplant): `AuditLog` mit `tenant_id`, `actor_id`, `entity_type`, `entity_id`, `before`, `after`, `action`, `ip`, `user_agent`.
 - Implementiert: `AuditLog` Einträge für `Offer`, `Shift`, `Assignment`, `TimeEntry`, `Absence` bei create/update/delete.
 - Backoffice-UI: `/audit-logs` mit Filter (Action, Entity, Actor, Datum, Request-ID).

## Zeiterfassung
- Check-in/out Endpoints speichern Zeitstempel + optional GPS-Daten.
- Regelwerk & Plausibilität (Geofence, Zeitfenster) folgen in Phase 5.2.
 - Implementiert: Basis-Plausibilitätschecks (Zeitfenster, Assignment, Geofence-Radius) + Rule-Flags (z.B. `negative_break`, `checkout_before_checkin`).

## Schließzeiten & Schichtvorlagen
- Objekte können wiederkehrende Schließzeiten (Wochentag + Zeitfenster) definieren.
- Schicht-Validierung prüft Überschneidungen und blockiert kollidierende Schichten.
- Regelmäßige Schichten werden als `shift_templates` gepflegt und bei Bedarf in echte Schichten erzeugt (Nächste 4 Wochen).

## Mitarbeiter-Portal (Self-Service)
- Route `/my` zeigt eigene Schichten, offene Zeiteinträge, Zeit-Übersicht (letzte 30 Tage).
- Check-in/out direkt aus dem Portal (mit optionalem GPS).
- Abwesenheiten (Urlaub/Krank) können vom Mitarbeiter selbst gemeldet werden.

## Rule Engine (Konzept)
- Minimaler Regel-Engine-Skeleton `RuleEngine` für zukünftige Arbeitszeit-/Pausenlogik.
- Ziel: tenant-konfigurierbare Regeln evaluieren und Flags/Audit-Events erzeugen.
- Implementiert (erste Stufe): Abwesenheiten erhalten `rule_flags` (z.B. `overlap`, `long_absence`, `sick_without_note`).

## Background Jobs
- Mailversand, PDF-Generierung, Exporte sollen asynchron über Queue laufen.
- Aktuell Queue-Driver: `database`.
 - Angebotversand nutzt Job + PDF-Generierung (Dompdf).

## API Versioning
- Prefix: `/api/v1`.
- FormRequests für Validierung, Resources für Responses.

## Security
- API-Key pro Tenant (nur gehasht gespeichert).
- Rate Limiting für Lead-Inbox (`leads` Limiter, 60/min/IP).
 - Angebots-PDFs werden im lokalen Storage abgelegt und per Mail verschickt.
