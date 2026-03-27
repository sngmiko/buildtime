'use client'

import { useActionState, useState, useCallback } from 'react'
import { clockIn, type TimeEntryState } from '@/actions/time-entries'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { MapPin, Loader2 } from 'lucide-react'
import type { ConstructionSite } from '@/lib/types'

export function ClockInForm({ sites, defaultSiteId }: { sites: ConstructionSite[]; defaultSiteId?: string }) {
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
      className="flex flex-col items-center gap-6"
    >
      <div className="w-full max-w-xs">
        <Select
          label="Baustelle"
          name="site_id"
          options={[{ value: '', label: 'Baustelle wählen...' }, ...siteOptions]}
          error={state?.errors?.site_id?.[0]}
          defaultValue={defaultSiteId || ''}
        />
      </div>

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
