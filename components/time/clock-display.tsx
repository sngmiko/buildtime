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
