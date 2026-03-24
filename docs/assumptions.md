# Annahmen

- Lokale Entwicklung nutzt SQLite, um Setup-Aufwand gering zu halten.
- Multi-Tenant erfolgt über `tenant_id` in Tabellen (Single DB) für MVP.
- Tenant-Auflösung erfolgt zunächst über eingeloggte User bzw. API-Key (keine Subdomains in Phase 0-2).
- Lead-Inbox-Auth verwendet einen API-Key pro Tenant (HMAC später möglich).
- Kunden/Objekte haben optionale Adress- und Geo-Daten; GPS/Geofence wird später konfigurierbar.
- Inventarverwaltung startet als einfache Item-Liste mit aktuellem Standort (`site_id`) und Movement-Historie.
- Schließzeiten werden pro Objekt als wiederkehrende Wochentage mit Zeitfenster gepflegt.
- Regelmäßige Schichten werden als Vorlagen gespeichert und bei Bedarf in echte Schichten für kommende Wochen erzeugt.
