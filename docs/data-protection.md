# Datenschutz (DSGVO)

## Grundprinzipien
- Datenminimierung: Lead-Daten sind optional; nur notwendige Felder erfassen.
- Zweckbindung: Lead-Inbox dient der Kontaktaufnahme und Angebotsanbahnung.
- Zugriffskontrolle: Rollenbasierte Policies.
- Auditierbarkeit: Änderungen an kritischen Entitäten werden protokolliert (AuditLog).

## Standort-/GPS-Daten (Konzept)
- Speicherung nur für Zeiterfassung erforderlich.
- Granularität und Retention tenant-konfigurierbar (Standard 365 Tage).
- Kein Klartext-Passwortspeicher; Zugangsdaten nur als Metadaten (kein Secret-Storage in Klartext).

## Aufbewahrung & Löschung
- Tenant-Feld `data_retention_days` definiert Standard-Retention.
- Lösch-/Exportkonzept wird pro Entität implementiert (Phase 6).
 - Angebots-PDFs werden im Storage abgelegt und müssen in Retention-Regeln berücksichtigt werden.

## Protokollierung
- IP/User-Agent werden für Lead-Inbox als Metadaten gespeichert.
- Audit-Logs erfassen Änderungen an Schichten, Zeiten, Abwesenheiten und Angeboten.
 - Audit-Logs werden inkl. IP/User-Agent + Request-ID gespeichert.
 - Audit-Logs sind im Backoffice unter `/audit-logs` einsehbar (rollenbasiert).
