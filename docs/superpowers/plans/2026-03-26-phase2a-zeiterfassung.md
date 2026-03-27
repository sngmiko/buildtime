# Phase 2a: Zeiterfassung Stempeluhr-Kern — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the prototype time clock with a fully persistent, GPS-verified clock in/out system with construction site management, break tracking, and live dashboard statistics.

**Architecture:** New `construction_sites` and `time_entries` tables with RLS. Server Actions for all mutations following Phase 1 patterns. GPS via Browser Geolocation API (client-side, passed to server). Partial unique index enforces one open shift per user.

**Tech Stack:** Next.js 16.2.1, TypeScript, Tailwind CSS 4, Supabase (Auth + Postgres + RLS), Zod, Vitest, Lucide React

**Spec:** `docs/superpowers/specs/2026-03-26-phase2a-zeiterfassung-design.md`

**Builds on:** Phase 1 foundation (auth, profiles, companies, RLS helpers, UI components)

---

## File Structure (New/Modified)

```
buildtime/
├── supabase/migrations/
│   └── 00002_time_tracking.sql           # New tables, RLS, indexes
├── lib/
│   ├── types.ts                           # Add ConstructionSite, TimeEntry types
│   └── validations/
│       ├── time-entries.ts                # clockIn, clockOut schemas
│       └── sites.ts                       # site schema
├── actions/
│   ├── time-entries.ts                    # clockIn, clockOut actions
│   └── sites.ts                           # createSite, updateSite actions
├── components/
│   ├── time/
│   │   ├── clock-display.tsx              # 'use client' — live clock
│   │   ├── clock-in-form.tsx              # 'use client' — site select + GPS + clock in
│   │   ├── clock-out-form.tsx             # 'use client' — break + GPS + clock out
│   │   └── daily-entries.tsx              # Server component — today's entries list
│   └── layout/
│       └── manager-sidebar.tsx            # Modify — add Baustellen nav item
├── app/(app)/
│   ├── stempeln/page.tsx                  # Rewrite — full time clock
│   ├── zeiten/page.tsx                    # New — worker time overview
│   ├── baustellen/
│   │   ├── page.tsx                       # New — site list
│   │   ├── neu/page.tsx                   # New — create site form
│   │   └── [id]/page.tsx                  # New — edit site
│   └── dashboard/page.tsx                 # Modify — live stats
├── tests/
│   └── lib/validations/
│       ├── time-entries.test.ts           # Validation tests
│       └── sites.test.ts                  # Validation tests
```

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/00002_time_tracking.sql`

- [ ] **Step 1: Create migration file**

Create `supabase/migrations/00002_time_tracking.sql`:

```sql
-- BuildTime Phase 2a: Zeiterfassung
-- Construction sites and time entries

-- =============================================================================
-- TABLES
-- =============================================================================
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

CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  site_id UUID NOT NULL REFERENCES construction_sites(id),
  clock_in TIMESTAMPTZ NOT NULL DEFAULT now(),
  clock_out TIMESTAMPTZ,
  clock_in_lat DOUBLE PRECISION,
  clock_in_lng DOUBLE PRECISION,
  clock_out_lat DOUBLE PRECISION,
  clock_out_lng DOUBLE PRECISION,
  break_minutes INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- INDEXES
-- =============================================================================
CREATE INDEX idx_sites_company ON construction_sites(company_id);
CREATE INDEX idx_sites_status ON construction_sites(company_id, status);
CREATE INDEX idx_time_entries_user ON time_entries(user_id);
CREATE INDEX idx_time_entries_site ON time_entries(site_id);
CREATE INDEX idx_time_entries_company_date ON time_entries(company_id, clock_in);

-- Enforce max one open shift per user
CREATE UNIQUE INDEX idx_one_open_entry_per_user ON time_entries(user_id) WHERE clock_out IS NULL;

-- =============================================================================
-- TRIGGERS
-- =============================================================================
CREATE TRIGGER sites_updated_at
  BEFORE UPDATE ON construction_sites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER time_entries_updated_at
  BEFORE UPDATE ON time_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
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

CREATE POLICY "worker_insert_own" ON time_entries
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

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/00002_time_tracking.sql
git commit -m "feat: add time tracking schema (construction_sites, time_entries, RLS)"
```

---

## Task 2: Types & Validation Schemas

**Files:**
- Modify: `lib/types.ts`
- Create: `lib/validations/time-entries.ts`
- Create: `lib/validations/sites.ts`
- Create: `tests/lib/validations/time-entries.test.ts`
- Create: `tests/lib/validations/sites.test.ts`

- [ ] **Step 1: Add new types to `lib/types.ts`**

Append to the existing file:

```typescript
export type SiteStatus = 'active' | 'completed' | 'paused'

export type ConstructionSite = {
  id: string
  company_id: string
  name: string
  address: string | null
  status: SiteStatus
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

- [ ] **Step 2: Write failing tests for time-entries validations**

Create `tests/lib/validations/time-entries.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { clockInSchema, clockOutSchema } from '@/lib/validations/time-entries'

describe('clockInSchema', () => {
  it('accepts valid clock-in data', () => {
    const result = clockInSchema.safeParse({
      site_id: '550e8400-e29b-41d4-a716-446655440000',
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing site_id', () => {
    const result = clockInSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('rejects empty site_id', () => {
    const result = clockInSchema.safeParse({ site_id: '' })
    expect(result.success).toBe(false)
  })
})

describe('clockOutSchema', () => {
  it('accepts valid clock-out with break', () => {
    const result = clockOutSchema.safeParse({
      entry_id: '550e8400-e29b-41d4-a716-446655440000',
      break_minutes: 30,
    })
    expect(result.success).toBe(true)
  })

  it('accepts clock-out without break', () => {
    const result = clockOutSchema.safeParse({
      entry_id: '550e8400-e29b-41d4-a716-446655440000',
      break_minutes: 0,
    })
    expect(result.success).toBe(true)
  })

  it('accepts clock-out with notes', () => {
    const result = clockOutSchema.safeParse({
      entry_id: '550e8400-e29b-41d4-a716-446655440000',
      break_minutes: 45,
      notes: 'Regen-Pause',
    })
    expect(result.success).toBe(true)
  })

  it('rejects negative break minutes', () => {
    const result = clockOutSchema.safeParse({
      entry_id: '550e8400-e29b-41d4-a716-446655440000',
      break_minutes: -10,
    })
    expect(result.success).toBe(false)
  })

  it('rejects break over 480 minutes', () => {
    const result = clockOutSchema.safeParse({
      entry_id: '550e8400-e29b-41d4-a716-446655440000',
      break_minutes: 500,
    })
    expect(result.success).toBe(false)
  })
})
```

- [ ] **Step 3: Run tests — should fail**

Run: `npx vitest run tests/lib/validations/time-entries.test.ts`

- [ ] **Step 4: Create time-entries validation**

Create `lib/validations/time-entries.ts`:

```typescript
import { z } from 'zod'

export const clockInSchema = z.object({
  site_id: z.string().min(1, 'Baustelle ist erforderlich'),
})

export const clockOutSchema = z.object({
  entry_id: z.string().min(1, 'Eintrag-ID ist erforderlich'),
  break_minutes: z.coerce
    .number()
    .int()
    .min(0, 'Pause kann nicht negativ sein')
    .max(480, 'Pause kann nicht mehr als 8 Stunden sein'),
  notes: z.string().max(500).optional().or(z.literal('')),
})

export type ClockInInput = z.infer<typeof clockInSchema>
export type ClockOutInput = z.infer<typeof clockOutSchema>
```

- [ ] **Step 5: Run time-entries tests — should pass**

Run: `npx vitest run tests/lib/validations/time-entries.test.ts`

- [ ] **Step 6: Write failing tests for sites validations**

Create `tests/lib/validations/sites.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { siteSchema } from '@/lib/validations/sites'

describe('siteSchema', () => {
  it('accepts valid site data', () => {
    const result = siteSchema.safeParse({
      name: 'Neubau Hauptstraße 5',
      address: 'Hauptstraße 5, 10115 Berlin',
      status: 'active',
    })
    expect(result.success).toBe(true)
  })

  it('accepts site with only name', () => {
    const result = siteSchema.safeParse({
      name: 'Baustelle A',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty name', () => {
    const result = siteSchema.safeParse({
      name: '',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid status', () => {
    const result = siteSchema.safeParse({
      name: 'Test',
      status: 'deleted',
    })
    expect(result.success).toBe(false)
  })

  it('accepts all valid statuses', () => {
    for (const status of ['active', 'completed', 'paused']) {
      const result = siteSchema.safeParse({ name: 'Test', status })
      expect(result.success).toBe(true)
    }
  })
})
```

- [ ] **Step 7: Run tests — should fail**

Run: `npx vitest run tests/lib/validations/sites.test.ts`

- [ ] **Step 8: Create sites validation**

Create `lib/validations/sites.ts`:

```typescript
import { z } from 'zod'

export const siteSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(200),
  address: z.string().max(500).optional().or(z.literal('')),
  status: z.enum(['active', 'completed', 'paused']).optional().default('active'),
})

export type SiteInput = z.infer<typeof siteSchema>
```

- [ ] **Step 9: Run all tests**

Run: `npx vitest run`
Expected: All tests pass (existing 16 + new ~10)

- [ ] **Step 10: Commit**

```bash
git add lib/types.ts lib/validations/time-entries.ts lib/validations/sites.ts tests/lib/validations/time-entries.test.ts tests/lib/validations/sites.test.ts
git commit -m "feat: add types and validation schemas for time tracking and sites"
```

---

## Task 3: Server Actions — Time Entries

**Files:**
- Create: `actions/time-entries.ts`

- [ ] **Step 1: Create time entries server actions**

Create `actions/time-entries.ts`:

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { clockInSchema, clockOutSchema } from '@/lib/validations/time-entries'

export type TimeEntryState = {
  errors?: Record<string, string[]>
  message?: string
  success?: boolean
} | null

export async function clockIn(prevState: TimeEntryState, formData: FormData): Promise<TimeEntryState> {
  const raw = {
    site_id: formData.get('site_id'),
  }

  const validated = clockInSchema.safeParse(raw)
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { message: 'Nicht angemeldet' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile) return { message: 'Profil nicht gefunden' }

  // Check for existing open entry
  const { data: openEntry } = await supabase
    .from('time_entries')
    .select('id')
    .eq('user_id', user.id)
    .is('clock_out', null)
    .maybeSingle()

  if (openEntry) {
    return { message: 'Sie sind bereits eingestempelt' }
  }

  const lat = formData.get('lat') ? parseFloat(formData.get('lat') as string) : null
  const lng = formData.get('lng') ? parseFloat(formData.get('lng') as string) : null

  const { error } = await supabase
    .from('time_entries')
    .insert({
      company_id: profile.company_id,
      user_id: user.id,
      site_id: validated.data.site_id,
      clock_in_lat: lat,
      clock_in_lng: lng,
    })

  if (error) {
    return { message: 'Einstempeln fehlgeschlagen' }
  }

  return { success: true }
}

export async function clockOut(prevState: TimeEntryState, formData: FormData): Promise<TimeEntryState> {
  const raw = {
    entry_id: formData.get('entry_id'),
    break_minutes: formData.get('break_minutes') || '0',
    notes: formData.get('notes') || '',
  }

  const validated = clockOutSchema.safeParse(raw)
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { message: 'Nicht angemeldet' }

  const lat = formData.get('lat') ? parseFloat(formData.get('lat') as string) : null
  const lng = formData.get('lng') ? parseFloat(formData.get('lng') as string) : null

  const { error, count } = await supabase
    .from('time_entries')
    .update({
      clock_out: new Date().toISOString(),
      clock_out_lat: lat,
      clock_out_lng: lng,
      break_minutes: validated.data.break_minutes,
      notes: validated.data.notes || null,
    })
    .eq('id', validated.data.entry_id)
    .eq('user_id', user.id)
    .is('clock_out', null)

  if (error || count === 0) {
    return { message: 'Ausstempeln fehlgeschlagen' }
  }

  return { success: true }
}
```

- [ ] **Step 2: Commit**

```bash
git add actions/time-entries.ts
git commit -m "feat: add clockIn and clockOut server actions"
```

---

## Task 4: Server Actions — Sites

**Files:**
- Create: `actions/sites.ts`

- [ ] **Step 1: Create site server actions**

Create `actions/sites.ts`:

```typescript
'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { siteSchema } from '@/lib/validations/sites'

export type SiteState = {
  errors?: Record<string, string[]>
  message?: string
  success?: boolean
} | null

export async function createSite(prevState: SiteState, formData: FormData): Promise<SiteState> {
  const raw = {
    name: formData.get('name'),
    address: formData.get('address') || undefined,
    status: formData.get('status') || 'active',
  }

  const validated = siteSchema.safeParse(raw)
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { message: 'Nicht angemeldet' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single()

  if (!profile || !['owner', 'foreman'].includes(profile.role)) {
    return { message: 'Keine Berechtigung' }
  }

  const { error } = await supabase
    .from('construction_sites')
    .insert({
      company_id: profile.company_id,
      name: validated.data.name,
      address: validated.data.address || null,
      status: validated.data.status,
      created_by: user.id,
    })

  if (error) {
    return { message: 'Baustelle konnte nicht erstellt werden' }
  }

  redirect('/baustellen')
}

export async function updateSite(
  siteId: string,
  prevState: SiteState,
  formData: FormData
): Promise<SiteState> {
  const raw = {
    name: formData.get('name'),
    address: formData.get('address') || undefined,
    status: formData.get('status') || 'active',
  }

  const validated = siteSchema.safeParse(raw)
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { message: 'Nicht angemeldet' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['owner', 'foreman'].includes(profile.role)) {
    return { message: 'Keine Berechtigung' }
  }

  const { error } = await supabase
    .from('construction_sites')
    .update({
      name: validated.data.name,
      address: validated.data.address || null,
      status: validated.data.status,
    })
    .eq('id', siteId)

  if (error) {
    return { message: 'Baustelle konnte nicht aktualisiert werden' }
  }

  return { success: true, message: 'Baustelle aktualisiert' }
}
```

- [ ] **Step 2: Commit**

```bash
git add actions/sites.ts
git commit -m "feat: add createSite and updateSite server actions"
```

---

## Task 5: Stempeluhr Page — Full Rewrite

**Files:**
- Create: `components/time/clock-display.tsx`
- Create: `components/time/clock-in-form.tsx`
- Create: `components/time/clock-out-form.tsx`
- Create: `components/time/daily-entries.tsx`
- Rewrite: `app/(app)/stempeln/page.tsx`

- [ ] **Step 1: Create clock display component**

Create `components/time/clock-display.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'

export function ClockDisplay() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const formattedTime = time.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  const formattedDate = time.toLocaleDateString('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="text-center">
      <p className="text-6xl font-bold tabular-nums text-slate-900 sm:text-7xl">
        {formattedTime}
      </p>
      <p className="mt-2 text-sm text-slate-500">{formattedDate}</p>
    </div>
  )
}
```

- [ ] **Step 2: Create clock-in form**

Create `components/time/clock-in-form.tsx`:

```typescript
'use client'

import { useActionState, useState, useCallback } from 'react'
import { clockIn, type TimeEntryState } from '@/actions/time-entries'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { MapPin, Loader2 } from 'lucide-react'
import type { ConstructionSite } from '@/lib/types'

export function ClockInForm({ sites }: { sites: ConstructionSite[] }) {
  const [state, action, pending] = useActionState<TimeEntryState, FormData>(clockIn, null)
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)

  const requestGps = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsStatus('error')
      return
    }
    setGpsStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setGpsStatus('done')
      },
      () => setGpsStatus('error'),
      { timeout: 10000, enableHighAccuracy: true }
    )
  }, [])

  const siteOptions = sites.map((s) => ({ value: s.id, label: s.name }))

  if (sites.length === 0) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center text-sm text-amber-700">
        Noch keine Baustellen vorhanden. Ein Bauleiter muss zuerst eine Baustelle anlegen.
      </div>
    )
  }

  return (
    <form
      action={action}
      onSubmit={() => { if (gpsStatus === 'idle') requestGps() }}
      className="flex flex-col items-center gap-6"
    >
      <Select
        label="Baustelle"
        name="site_id"
        options={[{ value: '', label: 'Baustelle wählen...' }, ...siteOptions]}
        error={state?.errors?.site_id?.[0]}
      />

      <input type="hidden" name="lat" value={coords?.lat ?? ''} />
      <input type="hidden" name="lng" value={coords?.lng ?? ''} />

      {state?.message && (
        <p className="text-sm text-red-600">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        onClick={requestGps}
        className="group relative flex h-40 w-40 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:scale-105 hover:bg-emerald-600 active:scale-95 disabled:opacity-50 sm:h-48 sm:w-48"
      >
        <div className="text-center text-white">
          {pending ? (
            <Loader2 className="mx-auto h-8 w-8 animate-spin" />
          ) : (
            <p className="text-lg font-bold sm:text-xl">Einstempeln</p>
          )}
        </div>
      </button>

      <div className="flex items-center gap-1.5 text-xs text-slate-400">
        <MapPin className="h-3.5 w-3.5" />
        {gpsStatus === 'loading' && 'GPS-Standort wird erfasst...'}
        {gpsStatus === 'done' && 'GPS-Standort erfasst'}
        {gpsStatus === 'error' && 'GPS nicht verfügbar — Stempeln ohne Standort'}
        {gpsStatus === 'idle' && 'GPS-Standort wird beim Stempeln erfasst'}
      </div>
    </form>
  )
}
```

- [ ] **Step 3: Create clock-out form**

Create `components/time/clock-out-form.tsx`:

```typescript
'use client'

import { useActionState, useState, useCallback, useEffect } from 'react'
import { clockOut, type TimeEntryState } from '@/actions/time-entries'
import { Input } from '@/components/ui/input'
import { MapPin, Loader2 } from 'lucide-react'
import type { TimeEntry, ConstructionSite } from '@/lib/types'

function formatDuration(startIso: string): string {
  const start = new Date(startIso)
  const now = new Date()
  const diffMs = now.getTime() - start.getTime()
  const hours = Math.floor(diffMs / 3600000)
  const minutes = Math.floor((diffMs % 3600000) / 60000)
  return `${hours}h ${minutes.toString().padStart(2, '0')}min`
}

export function ClockOutForm({
  entry,
  siteName,
}: {
  entry: TimeEntry
  siteName: string
}) {
  const [state, action, pending] = useActionState<TimeEntryState, FormData>(clockOut, null)
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [duration, setDuration] = useState(formatDuration(entry.clock_in))

  useEffect(() => {
    const interval = setInterval(() => setDuration(formatDuration(entry.clock_in)), 60000)
    return () => clearInterval(interval)
  }, [entry.clock_in])

  const requestGps = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsStatus('error')
      return
    }
    setGpsStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setGpsStatus('done')
      },
      () => setGpsStatus('error'),
      { timeout: 10000, enableHighAccuracy: true }
    )
  }, [])

  const clockInTime = new Date(entry.clock_in).toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <form action={action} className="flex flex-col items-center gap-6">
      <input type="hidden" name="entry_id" value={entry.id} />
      <input type="hidden" name="lat" value={coords?.lat ?? ''} />
      <input type="hidden" name="lng" value={coords?.lng ?? ''} />

      {/* Active shift info */}
      <div className="text-center">
        <p className="text-sm font-medium text-emerald-600">
          {siteName} &middot; Seit {clockInTime} &middot; {duration}
        </p>
      </div>

      {/* Break input */}
      <div className="w-full max-w-xs">
        <Input
          label="Pause (Minuten)"
          name="break_minutes"
          type="number"
          defaultValue="0"
          min="0"
          max="480"
          error={state?.errors?.break_minutes?.[0]}
        />
      </div>

      {/* Notes */}
      <div className="w-full max-w-xs">
        <Input
          label="Notiz (optional)"
          name="notes"
          placeholder="z.B. Regen-Pause"
          error={state?.errors?.notes?.[0]}
        />
      </div>

      {state?.message && (
        <p className="text-sm text-red-600">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        onClick={requestGps}
        className="group relative flex h-40 w-40 items-center justify-center rounded-full bg-red-500 shadow-lg shadow-red-500/30 transition-all duration-300 hover:scale-105 hover:bg-red-600 active:scale-95 disabled:opacity-50 sm:h-48 sm:w-48"
      >
        <div className="text-center text-white">
          {pending ? (
            <Loader2 className="mx-auto h-8 w-8 animate-spin" />
          ) : (
            <p className="text-lg font-bold sm:text-xl">Ausstempeln</p>
          )}
        </div>
        <span className="absolute inset-0 animate-ping rounded-full bg-red-400 opacity-20" />
      </button>

      <div className="flex items-center gap-1.5 text-xs text-slate-400">
        <MapPin className="h-3.5 w-3.5" />
        {gpsStatus === 'loading' && 'GPS-Standort wird erfasst...'}
        {gpsStatus === 'done' && 'GPS-Standort erfasst'}
        {gpsStatus === 'error' && 'GPS nicht verfügbar — Stempeln ohne Standort'}
        {gpsStatus === 'idle' && 'GPS-Standort wird beim Stempeln erfasst'}
      </div>
    </form>
  )
}
```

- [ ] **Step 4: Create daily entries component**

Create `components/time/daily-entries.tsx`:

```typescript
import type { TimeEntry, ConstructionSite } from '@/lib/types'

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

function calcHours(entry: TimeEntry): string {
  if (!entry.clock_out) return '–'
  const diffMs = new Date(entry.clock_out).getTime() - new Date(entry.clock_in).getTime()
  const netMinutes = Math.max(0, diffMs / 60000 - entry.break_minutes)
  const hours = Math.floor(netMinutes / 60)
  const mins = Math.round(netMinutes % 60)
  return `${hours}:${mins.toString().padStart(2, '0')}`
}

export function DailyEntries({
  entries,
  sites,
}: {
  entries: TimeEntry[]
  sites: ConstructionSite[]
}) {
  const siteMap = new Map(sites.map((s) => [s.id, s.name]))

  if (entries.length === 0) {
    return (
      <p className="text-center text-sm text-slate-400">
        Heute noch keine Einträge
      </p>
    )
  }

  const totalMinutes = entries.reduce((sum, e) => {
    if (!e.clock_out) return sum
    const diffMs = new Date(e.clock_out).getTime() - new Date(e.clock_in).getTime()
    return sum + Math.max(0, diffMs / 60000 - e.break_minutes)
  }, 0)
  const totalHours = Math.floor(totalMinutes / 60)
  const totalMins = Math.round(totalMinutes % 60)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Heute</h3>
        <span className="text-sm font-medium text-[--color-primary]">
          {totalHours}:{totalMins.toString().padStart(2, '0')} Std.
        </span>
      </div>
      <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
        {entries.map((entry) => (
          <div key={entry.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <div>
              <p className="font-medium text-slate-900">{siteMap.get(entry.site_id) || 'Unbekannt'}</p>
              <p className="text-xs text-slate-500">
                {formatTime(entry.clock_in)}
                {entry.clock_out ? ` – ${formatTime(entry.clock_out)}` : ' – läuft'}
                {entry.break_minutes > 0 && ` · ${entry.break_minutes}min Pause`}
              </p>
            </div>
            <span className="font-medium text-slate-700">{calcHours(entry)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Rewrite stempeln page**

Replace `app/(app)/stempeln/page.tsx`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ClockDisplay } from '@/components/time/clock-display'
import { ClockInForm } from '@/components/time/clock-in-form'
import { ClockOutForm } from '@/components/time/clock-out-form'
import { DailyEntries } from '@/components/time/daily-entries'
import type { TimeEntry, ConstructionSite } from '@/lib/types'

export default async function StempelnPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // Get active sites
  const { data: sites } = await supabase
    .from('construction_sites')
    .select('*')
    .eq('status', 'active')
    .order('name')

  // Get open entry (currently clocked in?)
  const { data: openEntry } = await supabase
    .from('time_entries')
    .select('*')
    .eq('user_id', user.id)
    .is('clock_out', null)
    .maybeSingle()

  // Get today's entries
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { data: todayEntries } = await supabase
    .from('time_entries')
    .select('*')
    .eq('user_id', user.id)
    .gte('clock_in', todayStart.toISOString())
    .order('clock_in', { ascending: false })

  const siteName = openEntry
    ? (sites as ConstructionSite[])?.find((s) => s.id === openEntry.site_id)?.name || 'Unbekannt'
    : ''

  return (
    <div className="flex flex-1 flex-col items-center gap-8 p-4 pt-8">
      <ClockDisplay />

      {openEntry ? (
        <ClockOutForm entry={openEntry as TimeEntry} siteName={siteName} />
      ) : (
        <ClockInForm sites={(sites as ConstructionSite[]) || []} />
      )}

      <div className="w-full max-w-md">
        <DailyEntries
          entries={(todayEntries as TimeEntry[]) || []}
          sites={(sites as ConstructionSite[]) || []}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add components/time/ app/(app)/stempeln/page.tsx
git commit -m "feat: rewrite stempeln page with GPS clock in/out, break tracking, daily entries"
```

---

## Task 6: Baustellen Pages

**Files:**
- Create: `app/(app)/baustellen/page.tsx`
- Create: `app/(app)/baustellen/neu/page.tsx`
- Create: `app/(app)/baustellen/neu/site-form.tsx`
- Create: `app/(app)/baustellen/[id]/page.tsx`
- Create: `app/(app)/baustellen/[id]/edit-site-form.tsx`

- [ ] **Step 1: Create baustellen list page**

Create `app/(app)/baustellen/page.tsx`:

```typescript
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { HardHat, Plus, MapPin } from 'lucide-react'
import type { ConstructionSite } from '@/lib/types'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: 'Aktiv', color: 'bg-emerald-100 text-emerald-700' },
  paused: { label: 'Pausiert', color: 'bg-amber-100 text-amber-700' },
  completed: { label: 'Abgeschlossen', color: 'bg-slate-100 text-slate-600' },
}

export default async function BaustellenPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['owner', 'foreman'].includes(profile.role)) {
    redirect('/stempeln')
  }

  const { data: sites } = await supabase
    .from('construction_sites')
    .select('*')
    .order('status')
    .order('name')

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Baustellen</h1>
        <Link href="/baustellen/neu">
          <Button>
            <Plus className="h-4 w-4" />
            Neue Baustelle
          </Button>
        </Link>
      </div>

      {(!sites || sites.length === 0) ? (
        <Card className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <HardHat className="h-8 w-8 text-slate-400" />
          </div>
          <p className="text-slate-500">Noch keine Baustellen vorhanden</p>
          <Link href="/baustellen/neu">
            <Button variant="accent">Erste Baustelle anlegen</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(sites as ConstructionSite[]).map((site) => {
            const status = STATUS_LABELS[site.status] || STATUS_LABELS.active
            return (
              <Link key={site.id} href={`/baustellen/${site.id}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{site.name}</h3>
                      {site.address && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                          <MapPin className="h-3 w-3" />
                          {site.address}
                        </p>
                      )}
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create new site form component**

Create `app/(app)/baustellen/neu/site-form.tsx`:

```typescript
'use client'

import { useActionState } from 'react'
import { createSite, type SiteState } from '@/actions/sites'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function SiteForm() {
  const [state, action, pending] = useActionState<SiteState, FormData>(createSite, null)

  return (
    <form action={action} className="flex flex-col gap-4">
      <Input
        label="Name der Baustelle"
        name="name"
        placeholder="z.B. Neubau Hauptstraße 5"
        required
        error={state?.errors?.name?.[0]}
      />
      <Input
        label="Adresse (optional)"
        name="address"
        placeholder="Straße, PLZ Ort"
        error={state?.errors?.address?.[0]}
      />
      {state?.message && (
        <p className="text-sm text-red-600">{state.message}</p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? 'Erstellen...' : 'Baustelle erstellen'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 3: Create new site page**

Create `app/(app)/baustellen/neu/page.tsx`:

```typescript
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { SiteForm } from './site-form'

export default function NeueBaustellePage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/baustellen" className="text-sm text-slate-500 hover:text-slate-900">
          Baustellen
        </Link>
        <span className="text-slate-300">/</span>
        <h1 className="text-2xl font-bold text-slate-900">Neue Baustelle</h1>
      </div>
      <Card className="max-w-lg">
        <SiteForm />
      </Card>
    </div>
  )
}
```

- [ ] **Step 4: Create edit site form**

Create `app/(app)/baustellen/[id]/edit-site-form.tsx`:

```typescript
'use client'

import { useActionState } from 'react'
import { updateSite, type SiteState } from '@/actions/sites'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type { ConstructionSite } from '@/lib/types'

export function EditSiteForm({ site }: { site: ConstructionSite }) {
  const boundUpdateSite = updateSite.bind(null, site.id)
  const [state, action, pending] = useActionState<SiteState, FormData>(boundUpdateSite, null)

  return (
    <form action={action} className="flex flex-col gap-4">
      <Input
        label="Name der Baustelle"
        name="name"
        defaultValue={site.name}
        required
        error={state?.errors?.name?.[0]}
      />
      <Input
        label="Adresse (optional)"
        name="address"
        defaultValue={site.address || ''}
        error={state?.errors?.address?.[0]}
      />
      <Select
        label="Status"
        name="status"
        defaultValue={site.status}
        options={[
          { value: 'active', label: 'Aktiv' },
          { value: 'paused', label: 'Pausiert' },
          { value: 'completed', label: 'Abgeschlossen' },
        ]}
        error={state?.errors?.status?.[0]}
      />
      {state?.message && (
        <p className={`text-sm ${state.success ? 'text-emerald-600' : 'text-red-600'}`}>
          {state.message}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? 'Speichern...' : 'Baustelle speichern'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 5: Create edit site page**

Create `app/(app)/baustellen/[id]/page.tsx`:

```typescript
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { EditSiteForm } from './edit-site-form'
import type { ConstructionSite } from '@/lib/types'

export default async function EditSitePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['owner', 'foreman'].includes(profile.role)) {
    redirect('/dashboard')
  }

  const { data: site } = await supabase
    .from('construction_sites')
    .select('*')
    .eq('id', id)
    .single()

  if (!site) notFound()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/baustellen" className="text-sm text-slate-500 hover:text-slate-900">
          Baustellen
        </Link>
        <span className="text-slate-300">/</span>
        <h1 className="text-2xl font-bold text-slate-900">{(site as ConstructionSite).name}</h1>
      </div>
      <Card className="max-w-lg">
        <EditSiteForm site={site as ConstructionSite} />
      </Card>
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add app/(app)/baustellen/
git commit -m "feat: add construction site management pages (list, create, edit)"
```

---

## Task 7: Worker Zeiten Page

**Files:**
- Create: `app/(app)/zeiten/page.tsx`

- [ ] **Step 1: Create zeiten page**

Create `app/(app)/zeiten/page.tsx`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Clock } from 'lucide-react'
import type { TimeEntry, ConstructionSite } from '@/lib/types'

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })
}

function calcNetMinutes(entry: TimeEntry): number {
  if (!entry.clock_out) return 0
  const diffMs = new Date(entry.clock_out).getTime() - new Date(entry.clock_in).getTime()
  return Math.max(0, diffMs / 60000 - entry.break_minutes)
}

export default async function ZeitenPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Last 7 days
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  weekAgo.setHours(0, 0, 0, 0)

  const { data: entries } = await supabase
    .from('time_entries')
    .select('*')
    .eq('user_id', user.id)
    .gte('clock_in', weekAgo.toISOString())
    .order('clock_in', { ascending: false })

  const { data: sites } = await supabase
    .from('construction_sites')
    .select('id, name')

  const siteMap = new Map((sites || []).map((s: { id: string; name: string }) => [s.id, s.name]))
  const typedEntries = (entries as TimeEntry[]) || []

  // Group by date
  const grouped = typedEntries.reduce<Record<string, TimeEntry[]>>((acc, entry) => {
    const dateKey = new Date(entry.clock_in).toLocaleDateString('de-DE')
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(entry)
    return acc
  }, {})

  const totalMinutes = typedEntries.reduce((sum, e) => sum + calcNetMinutes(e), 0)
  const totalHours = Math.floor(totalMinutes / 60)
  const totalMins = Math.round(totalMinutes % 60)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Meine Zeiten</h1>
        <div className="flex items-center gap-2 rounded-lg bg-[--color-primary] px-3 py-1.5 text-sm font-medium text-white">
          <Clock className="h-4 w-4" />
          {totalHours}:{totalMins.toString().padStart(2, '0')} Std. (7 Tage)
        </div>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <Card className="py-8 text-center text-sm text-slate-500">
          Keine Einträge in den letzten 7 Tagen
        </Card>
      ) : (
        Object.entries(grouped).map(([date, dayEntries]) => {
          const dayTotal = dayEntries.reduce((sum, e) => sum + calcNetMinutes(e), 0)
          const dayH = Math.floor(dayTotal / 60)
          const dayM = Math.round(dayTotal % 60)
          return (
            <div key={date}>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-700">
                  {formatDate(dayEntries[0].clock_in)}
                </h2>
                <span className="text-sm text-slate-500">
                  {dayH}:{dayM.toString().padStart(2, '0')} Std.
                </span>
              </div>
              <Card className="p-0">
                <div className="divide-y divide-slate-100">
                  {dayEntries.map((entry) => {
                    const net = calcNetMinutes(entry)
                    const h = Math.floor(net / 60)
                    const m = Math.round(net % 60)
                    return (
                      <div key={entry.id} className="flex items-center justify-between px-4 py-3 text-sm">
                        <div>
                          <p className="font-medium text-slate-900">
                            {siteMap.get(entry.site_id) || 'Unbekannt'}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatTime(entry.clock_in)}
                            {entry.clock_out ? ` – ${formatTime(entry.clock_out)}` : ' – läuft'}
                            {entry.break_minutes > 0 && ` · ${entry.break_minutes}min Pause`}
                          </p>
                        </div>
                        <span className="font-medium text-slate-700">
                          {entry.clock_out ? `${h}:${m.toString().padStart(2, '0')}` : '–'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </Card>
            </div>
          )
        })
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/(app)/zeiten/
git commit -m "feat: add worker time overview page (last 7 days)"
```

---

## Task 8: Navigation Update & Dashboard Live Data

**Files:**
- Modify: `components/layout/manager-sidebar.tsx`
- Rewrite: `app/(app)/dashboard/page.tsx`

- [ ] **Step 1: Add Baustellen to sidebar**

In `components/layout/manager-sidebar.tsx`, add `HardHat` to the import from lucide-react and add this entry to NAV_ITEMS after the Mitarbeiter entry:

```typescript
{ href: '/baustellen', label: 'Baustellen', icon: HardHat, roles: ['owner', 'foreman'] },
```

- [ ] **Step 2: Rewrite dashboard with live data**

Replace `app/(app)/dashboard/page.tsx`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Users, HardHat, Clock, Mail } from 'lucide-react'
import type { Profile, TimeEntry } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, company_id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // Live queries
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const [
    { count: activeWorkers },
    { count: activeSites },
    { data: todayEntries },
    { count: openInvitations },
    { data: clockedInNow },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'worker'),
    supabase.from('construction_sites').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('time_entries').select('clock_in, clock_out, break_minutes').gte('clock_in', todayStart.toISOString()),
    supabase.from('invitations').select('*', { count: 'exact', head: true }).is('accepted_at', null).gt('expires_at', new Date().toISOString()),
    supabase.from('time_entries').select('user_id, clock_in, site_id, profiles(first_name, last_name), construction_sites(name)').is('clock_out', null),
  ])

  // Calculate today's total hours
  const totalMinutes = (todayEntries || []).reduce((sum: number, e: { clock_in: string; clock_out: string | null; break_minutes: number }) => {
    if (!e.clock_out) return sum
    const diffMs = new Date(e.clock_out).getTime() - new Date(e.clock_in).getTime()
    return sum + Math.max(0, diffMs / 60000 - e.break_minutes)
  }, 0)
  const totalHours = (totalMinutes / 60).toFixed(1)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Guten Morgen' : hour < 18 ? 'Guten Tag' : 'Guten Abend'

  const stats = [
    { label: 'Mitarbeiter', value: String(activeWorkers || 0), icon: Users, color: 'text-[--color-primary]', bg: 'bg-blue-50' },
    { label: 'Aktive Baustellen', value: String(activeSites || 0), icon: HardHat, color: 'text-[--color-accent-dark]', bg: 'bg-amber-50' },
    { label: 'Stunden heute', value: totalHours, icon: Clock, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Offene Einladungen', value: String(openInvitations || 0), icon: Mail, color: 'text-violet-600', bg: 'bg-violet-50' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {greeting}, {profile.first_name || 'Willkommen'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">Hier ist Ihre Tagesübersicht</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="flex items-center gap-4 p-5">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${stat.bg}`}>
                <Icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Currently clocked in */}
      <Card>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Aktuell eingestempelt</h2>
        {(!clockedInNow || clockedInNow.length === 0) ? (
          <p className="text-sm text-slate-500">Niemand ist gerade eingestempelt</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {clockedInNow.map((entry: Record<string, unknown>) => {
              const p = entry.profiles as { first_name: string; last_name: string } | null
              const s = entry.construction_sites as { name: string } | null
              const clockIn = new Date(entry.clock_in as string)
              const since = clockIn.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
              return (
                <div key={entry.user_id as string} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <span className="font-medium text-slate-900">
                      {p ? `${p.first_name} ${p.last_name}` : 'Unbekannt'}
                    </span>
                    <span className="ml-2 text-slate-500">{s?.name || ''}</span>
                  </div>
                  <span className="text-xs text-emerald-600">seit {since}</span>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/layout/manager-sidebar.tsx app/(app)/dashboard/page.tsx
git commit -m "feat: add Baustellen nav item and live dashboard statistics"
```

---

## Task 9: Final Verification

- [ ] **Step 1: Run all tests**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: Build succeeds with all routes

- [ ] **Step 5: Fix any issues and commit**

```bash
git add -A
git commit -m "fix: resolve build/lint issues from Phase 2a implementation"
```
