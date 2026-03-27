'use client'

import { useActionState } from 'react'
import { createDiaryEntry, type DiaryState } from '@/actions/diary'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type { ConstructionSite } from '@/lib/types'

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
  sites: ConstructionSite[]
}

export function DiaryEntryForm({ sites }: Props) {
  const [state, action, pending] = useActionState<DiaryState, FormData>(createDiaryEntry, null)

  const today = new Date().toISOString().split('T')[0]

  const siteOptions = [
    { value: '', label: '— Baustelle wählen —' },
    ...sites.map(s => ({ value: s.id, label: s.name })),
  ]

  return (
    <form action={action} className="flex flex-col gap-4">
      <Select
        label="Baustelle"
        name="site_id"
        options={siteOptions}
        required
        error={state?.errors?.site_id?.[0]}
      />

      <Input
        label="Datum"
        name="entry_date"
        type="date"
        defaultValue={today}
        required
        error={state?.errors?.entry_date?.[0]}
      />

      <div className="border-t border-slate-100 pt-4">
        <p className="mb-3 text-sm font-medium text-slate-700">Wetterbedingungen</p>
        <div className="grid grid-cols-3 gap-3">
          <Select label="Wetter" name="weather" options={WEATHER_OPTIONS} />
          <Input label="Temperatur (°C)" name="temperature" type="number" min="-50" max="60" placeholder="z. B. 18" />
          <Select label="Wind" name="wind" options={WIND_OPTIONS} />
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
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-1 focus:ring-[#1e3a5f]"
          placeholder="Was wurde heute geleistet? Welche Arbeiten wurden durchgeführt?"
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
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-1 focus:ring-[#1e3a5f]"
          placeholder="Unfälle, Beinaheunfälle, besondere Ereignisse..."
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Mängel</label>
        <textarea
          name="defects"
          rows={2}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-1 focus:ring-[#1e3a5f]"
          placeholder="Festgestellte Mängel an Materialien, Ausführung etc."
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Behinderungen</label>
        <textarea
          name="hindrances"
          rows={2}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-1 focus:ring-[#1e3a5f]"
          placeholder="Lieferverzögerungen, Wetter, fehlende Genehmigungen..."
        />
      </div>

      {state?.message && <p className="text-sm text-red-600">{state.message}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? 'Speichern...' : 'Eintrag erstellen'}
      </Button>
    </form>
  )
}
