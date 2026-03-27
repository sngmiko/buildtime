'use client'

import { useActionState, useState } from 'react'
import { createDiaryEntry, getWeatherForLocation, type DiaryState } from '@/actions/diary'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { CloudSun, Loader2 } from 'lucide-react'
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
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [weatherError, setWeatherError] = useState<string | null>(null)
  const [weatherValue, setWeatherValue] = useState('')
  const [temperatureValue, setTemperatureValue] = useState('')
  const [windValue, setWindValue] = useState('')

  const today = new Date().toISOString().split('T')[0]

  async function handleLoadWeather() {
    if (!navigator.geolocation) {
      setWeatherError('GPS nicht verfügbar')
      return
    }
    setWeatherLoading(true)
    setWeatherError(null)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const result = await getWeatherForLocation(pos.coords.latitude, pos.coords.longitude)
          if (result) {
            setWeatherValue(result.weather)
            setTemperatureValue(String(result.temperature))
            // Map wind speed string like "12 km/h" to nearest option
            const kmh = parseInt(result.wind, 10)
            let windOption = 'Windstill'
            if (kmh >= 62) windOption = 'Sturm'
            else if (kmh >= 39) windOption = 'Stark'
            else if (kmh >= 29) windOption = 'Frisch'
            else if (kmh >= 20) windOption = 'Mäßig'
            else if (kmh >= 6) windOption = 'Leicht'
            setWindValue(windOption)
          } else {
            setWeatherError('Wetterdaten konnten nicht geladen werden')
          }
        } catch {
          setWeatherError('Fehler beim Laden der Wetterdaten')
        } finally {
          setWeatherLoading(false)
        }
      },
      () => {
        setWeatherError('Standortzugriff verweigert')
        setWeatherLoading(false)
      },
      { timeout: 10000, enableHighAccuracy: false }
    )
  }

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
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-slate-700">Wetterbedingungen</p>
          <button
            type="button"
            onClick={handleLoadWeather}
            disabled={weatherLoading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            {weatherLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CloudSun className="h-3.5 w-3.5" />}
            Wetter laden
          </button>
        </div>
        {weatherError && <p className="mb-2 text-xs text-red-600">{weatherError}</p>}
        <div className="grid grid-cols-3 gap-3">
          <Select
            label="Wetter"
            name="weather"
            options={WEATHER_OPTIONS}
            value={weatherValue}
            onChange={(e) => setWeatherValue(e.target.value)}
          />
          <Input
            label="Temperatur (°C)"
            name="temperature"
            type="number"
            min="-50"
            max="60"
            placeholder="z. B. 18"
            value={temperatureValue}
            onChange={(e) => setTemperatureValue(e.target.value)}
          />
          <Select
            label="Wind"
            name="wind"
            options={WIND_OPTIONS}
            value={windValue}
            onChange={(e) => setWindValue(e.target.value)}
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
