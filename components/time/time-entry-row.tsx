import { getSurcharges } from '@/lib/surcharges'
import { SurchargeBadges } from './surcharge-badges'
import type { TimeEntry } from '@/lib/types'

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

export function calcNetMinutes(entry: TimeEntry): number {
  if (!entry.clock_out) return 0
  const diffMs = new Date(entry.clock_out).getTime() - new Date(entry.clock_in).getTime()
  return Math.max(0, diffMs / 60000 - entry.break_minutes)
}

export function formatHours(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return `${h}:${m.toString().padStart(2, '0')}`
}

export function TimeEntryRow({
  entry,
  siteName,
  showActions,
  onEdit,
  onDelete,
}: {
  entry: TimeEntry
  siteName: string
  showActions?: boolean
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}) {
  const surcharges = entry.clock_out ? getSurcharges(entry.clock_in, entry.clock_out) : null
  const net = calcNetMinutes(entry)

  return (
    <div className="flex items-center justify-between px-4 py-3 text-sm">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium text-slate-900">{siteName}</p>
          {surcharges && <SurchargeBadges surcharges={surcharges} />}
        </div>
        <p className="text-xs text-slate-500">
          {formatTime(entry.clock_in)}
          {entry.clock_out ? ` – ${formatTime(entry.clock_out)}` : ' – läuft'}
          {entry.break_minutes > 0 && ` · ${entry.break_minutes}min Pause`}
          {entry.edited_at && ' · bearbeitet'}
        </p>
        {entry.photo_url && <span className="text-xs text-blue-500">📷 Foto</span>}
      </div>
      <div className="flex items-center gap-2">
        <span className="font-medium text-slate-700">
          {entry.clock_out ? formatHours(net) : '–'}
        </span>
        {showActions && (
          <div className="flex gap-1">
            {onEdit && (
              <button onClick={() => onEdit(entry.id)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              </button>
            )}
            {onDelete && (
              <button onClick={() => onDelete(entry.id)} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
