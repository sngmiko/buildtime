# Phase 2b+2c: Zeitkorrektur, Zuschläge, Übersichten & Export

**Projekt:** BuildTime
**Phase:** 2b+2c (kombiniert)
**Datum:** 2026-03-26
**Abhängigkeit:** Phase 2a (Stempeluhr, Baustellen, time_entries) ist fertig

## Scope

### In Scope

- Zeitkorrektur durch Bauleiter (Einträge bearbeiten/löschen)
- Überstunden-Flags: Nachtarbeit (23-06 Uhr), Wochenende, Feiertag
- Deutsche Feiertage (bundesweit, hardcoded)
- Wochen- und Monatsübersicht für Worker
- Bauleiter-Zeitmanagement: Alle Zeiten aller Mitarbeiter sehen/bearbeiten
- CSV-Export (Stundenzettel pro Mitarbeiter/Zeitraum)
- PDF-Export (Druckansicht Stundenzettel)

### Nicht in Scope

- Monetäre Zuschlagsberechnung (Eurobetrag — Phase 5: Kalkulation)
- Schichtplanung
- Abwesenheitsverwaltung (Urlaub, Krank)

## Datenmodell-Erweiterung

```sql
-- Migration 00003: time entry editing + surcharge flags
ALTER TABLE time_entries ADD COLUMN edited_by UUID REFERENCES profiles(id);
ALTER TABLE time_entries ADD COLUMN edited_at TIMESTAMPTZ;

-- RLS: Bauleiter/Owner können alle Einträge ihrer Firma bearbeiten
CREATE POLICY "manager_update_company_entries" ON time_entries
  FOR UPDATE USING (
    company_id = public.get_my_company_id()
    AND public.get_my_role() IN ('owner', 'foreman')
  );

CREATE POLICY "manager_delete_company_entries" ON time_entries
  FOR DELETE USING (
    company_id = public.get_my_company_id()
    AND public.get_my_role() IN ('owner', 'foreman')
  );
```

Zuschläge werden **nicht gespeichert**, sondern zur Laufzeit berechnet aus `clock_in`/`clock_out` Zeitstempeln + deutscher Feiertagsliste.

## Zuschläge-Logik

### Berechnung

Für jeden Zeiteintrag wird berechnet:
- **Nachtarbeit:** Anteil der Arbeitszeit zwischen 23:00-06:00
- **Wochenende:** Samstag oder Sonntag
- **Feiertag:** Datum ist in der Bundesfeiertags-Liste

Diese Flags werden als berechnete Properties in einer Utility-Funktion zurückgegeben, nicht in der DB gespeichert.

### Deutsche Feiertage (bundesweit)

Feste Feiertage + Osterbasis-Berechnung:
- Neujahr (1.1.)
- Karfreitag (Ostern - 2)
- Ostermontag (Ostern + 1)
- Tag der Arbeit (1.5.)
- Christi Himmelfahrt (Ostern + 39)
- Pfingstmontag (Ostern + 50)
- Tag der Deutschen Einheit (3.10.)
- 1. Weihnachtsfeiertag (25.12.)
- 2. Weihnachtsfeiertag (26.12.)

## UI-Seiten

### /zeiten — Erweitert (Worker)

- Periodenwähler: Woche / Monat (statt nur 7 Tage)
- Navigation: Vor/Zurück-Pfeile für Woche/Monat
- Pro Eintrag: Zuschlag-Badges (Nacht/WE/Feiertag)
- Zusammenfassung: Gesamt, Nacht, WE, Feiertag getrennt
- Export-Buttons: CSV / PDF

### /zeitmanagement — Neu (Owner/Foreman)

- Mitarbeiter-Dropdown: Worker auswählen
- Periodenwähler: Woche / Monat
- Tabelle: Alle Einträge des Workers
- Bearbeiten: Inline-Edit oder Modal für clock_in, clock_out, break_minutes, site
- Löschen: Mit Bestätigung
- Zuschlag-Badges wie bei /zeiten
- Export-Buttons: CSV / PDF pro Mitarbeiter

### /dashboard — Update

- "Stunden diese Woche" statt "Stunden heute" als zweite Zeile unter der Tageszahl

## Server Actions

```
actions/time-entries.ts (erweitern):
  - updateEntry(entryId, formData) → Bauleiter bearbeitet Eintrag
  - deleteEntry(entryId) → Bauleiter löscht Eintrag

actions/export.ts (neu):
  - exportCSV(userId, startDate, endDate) → CSV string
  - exportPDF wird client-seitig gelöst (Druckansicht)
```

## Validierung

```
lib/validations/time-entries.ts (erweitern):
  - editEntrySchema: { clock_in, clock_out, break_minutes, site_id, notes }
```

## Export-Format

### CSV

```
Datum;Baustelle;Beginn;Ende;Pause (min);Netto (Std);Nacht;Wochenende;Feiertag
2026-03-24;Neubau Hauptstr. 5;07:00;16:30;45;8,75;;;
2026-03-25;Sanierung Parkstr.;06:00;15:00;30;8,50;x;;
```

Semikolon-getrennt (DE-Standard), UTF-8 mit BOM.

### PDF

Browser-Druckansicht: Eigene Route `/zeiten/druck` mit print-optimiertem Layout. User druckt als PDF über den Browser. Kein PDF-Library nötig.
