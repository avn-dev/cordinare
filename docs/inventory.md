# Inventar (MVP)

## Ziel

Übersichtliche Inventarverwaltung pro Objekt, inkl. Standort-Historie. Damit ist nachvollziehbar, welche Geräte wo hinterlegt sind und wann sie zuletzt bewegt wurden.

## Datenmodell

- `inventory_items`
  - `tenant_id`
  - `site_id` (optional, aktueller Standort)
  - `name`, `category`, `serial_number`
  - `status` (`active`, `maintenance`, `lost`, `inactive`)
  - `condition` (`good`, `needs_service`, `damaged`)
  - `quantity`, `unit`
  - `last_seen_at`
  - `notes`, `meta`

- `inventory_movements`
  - `inventory_item_id`
  - `from_site_id`, `to_site_id`
  - `moved_by`, `moved_at`
  - `notes`

## Verhalten

- Inventar-Einträge sind Tenant-gebunden.
- Beim Anlegen mit Standort wird automatisch ein Movement-Eintrag erzeugt.
- Bei Standortwechsel wird automatisch ein Movement-Eintrag erzeugt.
- Die Historie wird im Edit-Screen angezeigt.

## UI

- `/inventory`
  - Filter: Objekt, Status, Kategorie, Suche
  - Liste mit Status-/Zustands-Badges
  - Direktes Bearbeiten/Löschen

- `/inventory/create`
  - Inventar anlegen

- `/inventory/{id}/edit`
  - Inventar bearbeiten
  - Standort-Historie
