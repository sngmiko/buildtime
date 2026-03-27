'use client'

import { useActionState, useState, useCallback, useEffect } from 'react'
import { clockOut, type TimeEntryState } from '@/actions/time-entries'
import { Input } from '@/components/ui/input'
import { MapPin, Loader2 } from 'lucide-react'
import type { TimeEntry } from '@/lib/types'

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

      <div className="text-center">
        <p className="text-sm font-medium text-emerald-600">
          {siteName} &middot; Seit {clockInTime} &middot; {duration}
        </p>
      </div>

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
