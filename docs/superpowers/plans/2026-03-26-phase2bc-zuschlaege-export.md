# Phase 2b+2c: Zuschläge, Zeitkorrektur, Übersichten & Export — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add surcharge detection (night/weekend/holiday), manager time correction, weekly/monthly views with period navigation, and CSV/PDF export.

**Architecture:** Surcharges computed at runtime (not stored). German holidays via Easter-based calculation. Manager edit/delete via admin-level RLS policies. CSV export as server action. PDF via browser print view.

**Tech Stack:** Next.js 16.2.1, TypeScript, Tailwind CSS 4, Supabase, Zod, Vitest

---

## File Structure (New/Modified)

```
buildtime/
├── supabase/migrations/
│   └── 00003_time_entry_editing.sql        # ALTER TABLE + new RLS policies
├── lib/
│   ├── types.ts                             # Add edited_by/edited_at to TimeEntry
│   ├── surcharges.ts                        # Holiday calc + surcharge detection
│   └── validations/
│       └── time-entries.ts                  # Add editEntrySchema
├── actions/
│   ├── time-entries.ts                      # Add updateEntry, deleteEntry
│   └── export.ts                            # CSV export action
├── app/(app)/
│   ├── zeiten/page.tsx                      # Rewrite: period nav + surcharges + export
│   ├── zeiten/druck/page.tsx                # Print view for PDF export
│   ├── zeitmanagement/page.tsx              # Manager time overview
│   ├── zeitmanagement/[id]/page.tsx         # Edit single entry
│   └── dashboard/page.tsx                   # Update stats
├── components/
│   ├── time/
│   │   ├── period-nav.tsx                   # Week/month navigation
│   │   ├── surcharge-badges.tsx             # Night/WE/Holiday badges
│   │   ├── time-entry-row.tsx               # Shared entry row with badges
│   │   └── entry-edit-form.tsx              # Edit form for managers
│   └── layout/
│       └── manager-sidebar.tsx              # Add Zeitmanagement nav item
├── tests/
│   └── lib/
│       ├── surcharges.test.ts               # Holiday + surcharge tests
│       └── validations/time-entries.test.ts # Add edit schema tests
```

---

## Task 1: DB Migration + Types + Validation

**Files:** migration, lib/types.ts, lib/validations/time-entries.ts, tests

Create `supabase/migrations/00003_time_entry_editing.sql`:

```sql
-- Phase 2b: Time entry editing by managers
ALTER TABLE time_entries ADD COLUMN edited_by UUID REFERENCES profiles(id);
ALTER TABLE time_entries ADD COLUMN edited_at TIMESTAMPTZ;

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

Update `lib/types.ts` — add to TimeEntry type:
```typescript
  edited_by: string | null
  edited_at: string | null
```

Add to `lib/validations/time-entries.ts`:
```typescript
export const editEntrySchema = z.object({
  clock_in: z.string().min(1, 'Startzeit ist erforderlich'),
  clock_out: z.string().min(1, 'Endzeit ist erforderlich'),
  break_minutes: z.coerce.number().int().min(0).max(480),
  site_id: z.string().min(1, 'Baustelle ist erforderlich'),
  notes: z.string().max(500).optional().or(z.literal('')),
})
```

Add test for editEntrySchema in tests.

---

## Task 2: Surcharges Utility + Tests

**Files:** lib/surcharges.ts, tests/lib/surcharges.test.ts

German federal holidays (Easter-based) + surcharge detection.

`lib/surcharges.ts`:
- `getGermanHolidays(year: number): Date[]` — all federal holidays
- `getSurcharges(clockIn: string, clockOut: string): { isNight: boolean, nightMinutes: number, isWeekend: boolean, isHoliday: boolean, holidayName?: string }`
- Night = any time between 23:00 and 06:00
- Weekend = Saturday or Sunday
- Holiday = clock_in date is a federal holiday

Tests: verify holidays for 2026, surcharge detection for various time ranges.

---

## Task 3: Server Actions — Edit, Delete, CSV Export

**Files:** actions/time-entries.ts (extend), actions/export.ts (new)

Add to `actions/time-entries.ts`:
- `updateEntry(entryId, prevState, formData)` — manager edits entry, sets edited_by/edited_at
- `deleteEntry(entryId)` — manager deletes entry

Create `actions/export.ts`:
- `exportCSV(userId, startDate, endDate)` — returns CSV string with semicolons, German format

---

## Task 4: Shared UI Components

**Files:** components/time/period-nav.tsx, surcharge-badges.tsx, time-entry-row.tsx

- `PeriodNav`: Client component, week/month toggle + prev/next arrows, emits date range changes via URL searchParams
- `SurchargeBadges`: Renders night/weekend/holiday badges
- `TimeEntryRow`: Shared row component used in both /zeiten and /zeitmanagement

---

## Task 5: Worker Zeiten Page Rewrite

**Files:** app/(app)/zeiten/page.tsx

Rewrite with:
- PeriodNav (week/month selector with navigation)
- Surcharge badges on each entry
- Summary section: total hours, night hours, weekend hours, holiday hours
- CSV download button
- "Drucken" button linking to /zeiten/druck

---

## Task 6: Print View + CSV Download

**Files:** app/(app)/zeiten/druck/page.tsx

Print-optimized page:
- No navigation, clean table layout
- Company name, employee name, period header
- Auto-triggers window.print() on load
- @media print styles

---

## Task 7: Zeitmanagement Page (Manager)

**Files:** app/(app)/zeitmanagement/page.tsx, app/(app)/zeitmanagement/[id]/page.tsx, components/time/entry-edit-form.tsx

Manager overview:
- Employee dropdown to filter
- PeriodNav for date range
- All entries with surcharge badges
- Edit button → /zeitmanagement/[id]
- Delete button with confirmation
- CSV/PDF export per employee

Edit page:
- Form with clock_in, clock_out, break_minutes, site dropdown, notes
- Shows "Bearbeitet von X am Y" if previously edited

---

## Task 8: Navigation + Dashboard Update + Final Verification

**Files:** components/layout/manager-sidebar.tsx, app/(app)/dashboard/page.tsx

- Add "Zeitmanagement" nav item (icon: ClipboardList)
- Dashboard: add week total as subtitle under daily hours
- Run tests, tsc, lint, build
