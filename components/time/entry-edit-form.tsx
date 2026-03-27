'use client'

import { useActionState } from 'react'
import { updateEntry, type TimeEntryState } from '@/actions/time-entries'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type { TimeEntry, ConstructionSite } from '@/lib/types'

function toLocalDateTimeValue(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function EntryEditForm({
  entry,
  sites,
}: {
  entry: TimeEntry
  sites: ConstructionSite[]
}) {
  const boundUpdate = updateEntry.bind(null, entry.id)
  const [state, action, pending] = useActionState<TimeEntryState, FormData>(boundUpdate, null)

  const siteOptions = sites.map((s) => ({ value: s.id, label: s.name }))

  return (
    <form action={action} className="flex flex-col gap-4">
      <Input
        label="Beginn"
        name="clock_in"
        type="datetime-local"
        defaultValue={toLocalDateTimeValue(entry.clock_in)}
        required
        error={state?.errors?.clock_in?.[0]}
      />
      <Input
        label="Ende"
        name="clock_out"
        type="datetime-local"
        defaultValue={entry.clock_out ? toLocalDateTimeValue(entry.clock_out) : ''}
        required
        error={state?.errors?.clock_out?.[0]}
      />
      <Input
        label="Pause (Minuten)"
        name="break_minutes"
        type="number"
        defaultValue={String(entry.break_minutes)}
        min="0"
        max="480"
        error={state?.errors?.break_minutes?.[0]}
      />
      <Select
        label="Baustelle"
        name="site_id"
        defaultValue={entry.site_id}
        options={siteOptions}
        error={state?.errors?.site_id?.[0]}
      />
      <Input
        label="Notiz (optional)"
        name="notes"
        defaultValue={entry.notes || ''}
        error={state?.errors?.notes?.[0]}
      />
      {entry.edited_at && (
        <p className="text-xs text-slate-400">
          Zuletzt bearbeitet am {new Date(entry.edited_at).toLocaleDateString('de-DE')}
        </p>
      )}
      {state?.message && (
        <p className={`text-sm ${state.success ? 'text-emerald-600' : 'text-red-600'}`}>
          {state.message}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? 'Speichern...' : 'Änderungen speichern'}
      </Button>
    </form>
  )
}
