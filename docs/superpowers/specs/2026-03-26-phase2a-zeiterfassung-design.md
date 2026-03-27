# Phase 2a: Zeiterfassung — Stempeluhr-Kern

**Projekt:** BuildTime — ERP-Light SaaS für Bauunternehmer in Deutschland
**Phase:** 2a von 5 (Kernfeature)
**Datum:** 2026-03-26
**Tech-Stack:** Next.js 16.2.1, TypeScript, Tailwind CSS 4, Supabase (Auth + DB), Vercel
**Abhängigkeit:** Phase 1 (Auth, Rollen, UI-Shell) ist fertig

## Kontext

Phase 1 hat das Fundament gebaut: Auth, Multi-Tenancy, Rollen (Owner/Foreman/Worker), UI-Shell. Die Stempeluhr-Seite existiert bereits als interaktiver Prototyp (Client-side State, kein Backend). Phase 2a ersetzt den Prototyp durch eine vollständige, persistente Zeiterfassung.

**Ziel:** Ein Arbeiter kann auf der Baustelle sein Handy zücken, eine Baustelle auswählen, einstempeln, Pause machen, ausstempeln — und der Bauleiter sieht die Zeiten sofort.

## Scope Phase 2a

### In Scope

- Baustellen erstellen/verwalten (Owner/Foreman)
- GPS-verifiziertes Einstempeln mit Baustellenauswahl
- GPS-verifiziertes Ausstempeln
- Pausenerfassung (manuelle Minuten-Eingabe beim Ausstempeln)
- Laufende Schicht anzeigen (eingestempelt seit wann, auf welcher Baustelle)
- Tagesübersicht für Worker (eigene Einträge mit Gesamtstunden)
- Dashboard-Statistiken live machen (echte Daten statt Dummy-Zahlen)
- RLS auf allen neuen Tabellen

### Nicht in Scope (Phase 2b/2c)

- Zeitkorrektur durch Bauleiter
- Überstunden/Zuschläge-Berechnung
- Wochen-/Monatsübersicht
- CSV/PDF Export
- Schichtplanung
- Abwesenheitsverwaltung

## Datenmodell

```sql
-- Baustellen
CREATE TABLE construction_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  name TEXT NOT NULL,
  address TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Zeiteinträge (eine Zeile pro Schicht)
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  site_id UUID NOT NULL REFERENCES construction_sites(id),
  clock_in TIMESTAMPTZ NOT NULL DEFAULT now(),
  clock_out TIMESTAMPTZ,                          -- NULL = aktuell eingestempelt
  clock_in_lat DOUBLE PRECISION,
  clock_in_lng DOUBLE PRECISION,
  clock_out_lat DOUBLE PRECISION,
  clock_out_lng DOUBLE PRECISION,
  break_minutes INTEGER NOT NULL DEFAULT 0,       -- manuelle Pauseneingabe
  notes TEXT,                                      -- optionale Notiz
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indizes
CREATE INDEX idx_sites_company ON construction_sites(company_id);
CREATE INDEX idx_sites_status ON construction_sites(company_id, status);
CREATE INDEX idx_time_entries_user ON time_entries(user_id);
CREATE INDEX idx_time_entries_site ON time_entries(site_id);
CREATE INDEX idx_time_entries_company_date ON time_entries(company_id, clock_in);
CREATE INDEX idx_time_entries_open ON time_entries(user_id, clock_out) WHERE clock_out IS NULL;
```

### Beziehungen

- `construction_sites.company_id` → `companies.id` (N:1)
- `construction_sites.created_by` → `profiles.id` (N:1)
- `time_entries.company_id` → `companies.id` (N:1)
- `time_entries.user_id` → `profiles.id` (N:1)
- `time_entries.site_id` → `construction_sites.id` (N:1)

### Laufende Schicht

Eine laufende Schicht wird erkannt durch `clock_out IS NULL`. Ein Arbeiter kann maximal eine offene Schicht haben. Dies wird durch einen Partial Unique Index erzwungen:

```sql
CREATE UNIQUE INDEX idx_one_open_entry_per_user ON time_entries(user_id) WHERE clock_out IS NULL;
```

## Row-Level Security

```sql
ALTER TABLE construction_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- CONSTRUCTION_SITES
CREATE POLICY "select_company_sites" ON construction_sites
  FOR SELECT USING (company_id = auth.company_id());

CREATE POLICY "manage_company_sites" ON construction_sites
  FOR ALL USING (
    company_id = auth.company_id()
    AND auth.user_role() IN ('owner', 'foreman')
  );

-- TIME_ENTRIES
CREATE POLICY "select_company_entries" ON time_entries
  FOR SELECT USING (company_id = auth.company_id());

CREATE POLICY "worker_own_entries" ON time_entries
  FOR INSERT WITH CHECK (
    company_id = auth.company_id()
    AND user_id = auth.uid()
  );

CREATE POLICY "worker_update_own_open" ON time_entries
  FOR UPDATE USING (
    user_id = auth.uid()
    AND clock_out IS NULL
  ) WITH CHECK (
    user_id = auth.uid()
  );
```

### RLS-Prinzipien

- Alle Firmenmitglieder können Baustellen und Zeiteinträge der eigenen Firma sehen
- Nur Owner/Foreman können Baustellen verwalten
- Worker können eigene Zeiteinträge erstellen (einstempeln)
- Worker können nur ihre eigene offene Schicht aktualisieren (ausstempeln, Pause eintragen)
- Zeitkorrektur durch Bauleiter kommt in Phase 2b

## Stempeluhr-Flow

### Einstempeln

1. Worker öffnet `/stempeln`
2. Aktive Baustellen der Firma werden geladen
3. Worker wählt Baustelle aus Dropdown
4. Worker tippt "Einstempeln"
5. Browser fragt GPS-Position ab (Geolocation API)
6. Server Action: INSERT INTO time_entries (user_id, site_id, clock_in, clock_in_lat, clock_in_lng, company_id)
7. UI wechselt zu "Eingestempelt"-Ansicht

### Ausstempeln

1. Worker sieht laufende Schicht (Baustelle, Dauer, Startzeit)
2. Worker kann optionale Pause eintragen (Minuten-Feld)
3. Worker tippt "Ausstempeln"
4. Browser fragt GPS-Position ab
5. Server Action: UPDATE time_entries SET clock_out, clock_out_lat, clock_out_lng, break_minutes WHERE id = entry.id AND clock_out IS NULL
6. UI wechselt zurück zu "Einstempeln"-Ansicht

### GPS-Handling

- GPS wird nur beim aktiven Stempeln abgefragt (kein Hintergrund-Tracking)
- Wenn GPS nicht verfügbar: Stempeln trotzdem erlauben, lat/lng bleiben NULL
- GPS-Timeout: 10 Sekunden, dann ohne GPS fortfahren
- User sieht Hinweis "GPS-Standort wird erfasst..." während der Abfrage

## UI-Änderungen

### /stempeln (Worker) — Redesign

**Nicht eingestempelt:**
- Große Uhr (besteht bereits)
- Dropdown: Baustelle auswählen (aktive Baustellen)
- Großer grüner Button "Einstempeln"
- Darunter: Tagesübersicht (heutige Einträge)

**Eingestempelt:**
- Große Uhr (besteht)
- Info: "Baustelle XY · Seit 07:32 · 4h 23min"
- Pauseneingabe: Nummernfeld "Pause (Minuten)"
- Großer roter Button "Ausstempeln"
- Darunter: Tagesübersicht

### /zeiten (Worker) — Neue Seite

- Kalenderansicht: Tage mit Einträgen markiert
- Für MVP: Einfache Liste der letzten 7 Tage
- Pro Tag: Baustelle, Startzeit, Endzeit, Pause, Netto-Stunden
- Gesamtstunden der Woche

### /baustellen (Owner/Foreman) — Neue Seite

- Liste aller Baustellen der Firma
- Status-Badge: Aktiv / Pausiert / Abgeschlossen
- "Neue Baustelle"-Button → Formular (Name, Adresse, Status)
- Bearbeiten/Status ändern

### /dashboard — Live-Daten

- "Aktive Mitarbeiter" → Anzahl Worker mit offener Schicht heute
- "Aktive Baustellen" → Anzahl Baustellen mit Status 'active'
- "Stunden heute" → Summe aller heutigen Arbeitsstunden (Firma)
- "Offene Einladungen" → echte Zählung aus invitations-Tabelle
- Neue Sektion: "Aktuell eingestempelt" — Liste aller Worker mit offener Schicht (Name, Baustelle, Seit)

### Navigation — Updates

- Sidebar: "Baustellen"-Menüpunkt hinzufügen (Icon: HardHat, zwischen Mitarbeiter und Firma)
- Worker Bottom-Nav: "Meine Zeiten" Tab verlinkt auf `/zeiten`

## Server Actions

### Zeiterfassung

```
actions/time-entries.ts:
  - clockIn(formData: FormData) → Baustelle + GPS → INSERT
  - clockOut(formData: FormData) → Pause + GPS → UPDATE
  - getActiveEntry() → offene Schicht des Users oder null
  - getTodayEntries() → heutige Einträge des Users
```

### Baustellen

```
actions/sites.ts:
  - createSite(formData: FormData) → INSERT
  - updateSite(formData: FormData) → UPDATE
```

## Validierung

```
lib/validations/time-entries.ts:
  - clockInSchema: { site_id: UUID required }
  - clockOutSchema: { break_minutes: number 0-480, notes: string optional }

lib/validations/sites.ts:
  - siteSchema: { name: string required, address: string optional, status: enum }
```

## Neue Typen

```typescript
// lib/types.ts — erweitern
export type ConstructionSite = {
  id: string
  company_id: string
  name: string
  address: string | null
  status: 'active' | 'completed' | 'paused'
  created_by: string
  created_at: string
  updated_at: string
}

export type TimeEntry = {
  id: string
  company_id: string
  user_id: string
  site_id: string
  clock_in: string
  clock_out: string | null
  clock_in_lat: number | null
  clock_in_lng: number | null
  clock_out_lat: number | null
  clock_out_lng: number | null
  break_minutes: number
  notes: string | null
  created_at: string
  updated_at: string
}
```

## Routing-Übersicht (Änderungen)

| Route | Zugang | Beschreibung | Aktion |
|---|---|---|---|
| `/stempeln` | Worker | GPS-Stempeluhr mit Baustellenauswahl | **Redesign** |
| `/zeiten` | Worker | Letzte 7 Tage Zeitübersicht | **Neu** |
| `/baustellen` | Owner, Foreman | Baustellenverwaltung | **Neu** |
| `/baustellen/neu` | Owner, Foreman | Neue Baustelle erstellen | **Neu** |
| `/dashboard` | Owner, Foreman | Live-Statistiken | **Update** |

## Testing-Strategie

- Unit Tests: Zod-Schemas (clockIn, clockOut, site)
- Unit Tests: Arbeitszeitberechnung (Brutto - Pause = Netto)
- Integration: Stempel-Flow (clockIn → getActiveEntry → clockOut)
- RLS Tests: Worker A kann nicht Zeiten von Worker B sehen/bearbeiten
