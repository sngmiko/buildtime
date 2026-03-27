'use client'

import { useActionState } from 'react'
import { updateDiaryEntry, type DiaryState } from '@/actions/diary'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type { DiaryEntry, ConstructionSite } from '@/lib/types'

const WEATHER_OPTIONS = [
  { value: '', label: '— Wetter wählen —' },
  { value: 'Sonnig', label: 'Sonnig' },
  { value: 'Bewölkt', label: 'Bewölkt' },
  { value: 'Bedeckt', label: 'Bedeckt' },
  { value: 'Regnerisch', label: 'Regnerisch' },
  { value: 'Stark bewölkt', label: 'Stark bewölkt' },
  { value: 'Sturm', label: 'Sturm' },
  { value: 'Schnee', label: 'Schnee' },
  { value: 'Frost', label: 'Frost' },
]

const WIND_OPTIONS = [
  { value: '', label: '— Wind —' },
  { value: 'Windstill', label: 'Windstill' },
  { value: 'Leicht', label: 'Leicht' },
  { value: 'Mäßig', label: 'Mäßig' },
  { value: 'Frisch', label: 'Frisch' },
  { value: 'Stark', label: 'Stark' },
  { value: 'Sturm', label: 'Sturm' },
]

type Props = {
  entry: DiaryEntry
  sites: ConstructionSite[]
}

export function DiaryEditForm({ entry, sites }: Props) {
  const boundUpdate = updateDiaryEntry.bind(null, entry.id)
  const [state, action, pending] = useActionState<DiaryState, FormData>(boundUpdate, null)

  const siteOptions = [
    { value: '', label: '— Baustelle wählen —' },
    ...sites.map(s => ({ value: s.id, label: s.name })),
  ]

  return (
    <form action={action} className="flex flex-col gap-4">
      <Select
        label="Baustelle"
        name="site_id"
        defaultValue={entry.site_id}
        options={siteOptions}
        required
        error={state?.errors?.site_id?.[0]}
      />

      <Input
        label="Datum"
        name="entry_date"
        type="date"
        defaultValue={entry.entry_date}
        required
        error={state?.errors?.entry_date?.[0]}
      />

      <div className="border-t border-slate-100 pt-4">
        <p className="mb-3 text-sm font-medium text-slate-700">Wetterbedingungen</p>
        <div className="grid grid-cols-3 gap-3">
          <Select
            label="Wetter"
            name="weather"
            defaultValue={entry.weather || ''}
            options={WEATHER_OPTIONS}
          />
          <Input
            label="Temperatur (°C)"
            name="temperature"
            type="number"
            min="-50"
            max="60"
            defaultValue={entry.temperature?.toString() || ''}
          />
          <Select
            label="Wind"
            name="wind"
            defaultValue={entry.wind || ''}
            options={WIND_OPTIONS}
          />
        </div>
      </div>

      <div className="border-t border-slate-100 pt-4">
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Arbeitsbeschreibung <span className="text-red-500">*</span>
        </label>
        <textarea
          name="work_description"
          rows={4}
          required
          defaultValue={entry.work_description}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-1 focus:ring-[#1e3a5f]"
        />
        {state?.errors?.work_description && (
          <p className="mt-1 text-sm text-red-600">{state.errors.work_description[0]}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Besondere Vorkommnisse</label>
        <textarea
          name="incidents"
          rows={2}
          defaultValue={entry.incidents || ''}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-1 focus:ring-[#1e3a5f]"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Mängel</label>
        <textarea
          name="defects"
          rows={2}
          defaultValue={entry.defects || ''}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-1 focus:ring-[#1e3a5f]"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Behinderungen</label>
        <textarea
          name="hindrances"
          rows={2}
          defaultValue={entry.hindrances || ''}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-1 focus:ring-[#1e3a5f]"
        />
      </div>

      {state?.message && (
        <p className={`text-sm ${state.success ? 'text-emerald-600' : 'text-red-600'}`}>
          {state.message}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? 'Speichern...' : 'Eintrag speichern'}
      </Button>
    </form>
  )
}
