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
