'use client'

import { useState, useEffect } from 'react'

export default function StempelnPage() {
  const [time, setTime] = useState(new Date())
  const [isClockedIn, setIsClockedIn] = useState(false)

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
    <div className="flex flex-1 flex-col items-center justify-center gap-8 p-4">
      {/* Time display */}
      <div className="text-center">
        <p className="text-6xl font-bold tabular-nums text-slate-900 sm:text-7xl">
          {formattedTime}
        </p>
        <p className="mt-2 text-sm text-slate-500">{formattedDate}</p>
      </div>

      {/* Clock in/out button */}
      <button
        onClick={() => setIsClockedIn(!isClockedIn)}
        className={`group relative flex h-40 w-40 items-center justify-center rounded-full shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 sm:h-48 sm:w-48 ${
          isClockedIn
            ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30'
            : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30'
        }`}
      >
        <div className="text-center text-white">
          <p className="text-lg font-bold sm:text-xl">
            {isClockedIn ? 'Ausstempeln' : 'Einstempeln'}
          </p>
        </div>
        {/* Pulse ring */}
        {isClockedIn && (
          <span className="absolute inset-0 animate-ping rounded-full bg-red-400 opacity-20" />
        )}
      </button>

      {/* Status */}
      <div className="text-center">
        <p className={`text-sm font-medium ${isClockedIn ? 'text-emerald-600' : 'text-slate-500'}`}>
          {isClockedIn
            ? `Eingestempelt seit ${time.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`
            : 'Noch nicht eingestempelt'}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          GPS-Standort wird beim Stempeln erfasst
        </p>
      </div>
    </div>
  )
}
