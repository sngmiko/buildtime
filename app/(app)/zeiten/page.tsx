import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Clock } from 'lucide-react'
import type { TimeEntry } from '@/lib/types'

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })
}

function calcNetMinutes(entry: TimeEntry): number {
  if (!entry.clock_out) return 0
  const diffMs = new Date(entry.clock_out).getTime() - new Date(entry.clock_in).getTime()
  return Math.max(0, diffMs / 60000 - entry.break_minutes)
}

export default async function ZeitenPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  weekAgo.setHours(0, 0, 0, 0)

  const { data: entries } = await supabase
    .from('time_entries')
    .select('*')
    .eq('user_id', user.id)
    .gte('clock_in', weekAgo.toISOString())
    .order('clock_in', { ascending: false })

  const { data: sites } = await supabase
    .from('construction_sites')
    .select('id, name')

  const siteMap = new Map((sites || []).map((s: { id: string; name: string }) => [s.id, s.name]))
  const typedEntries = (entries as TimeEntry[]) || []

  const grouped = typedEntries.reduce<Record<string, TimeEntry[]>>((acc, entry) => {
    const dateKey = new Date(entry.clock_in).toLocaleDateString('de-DE')
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(entry)
    return acc
  }, {})

  const totalMinutes = typedEntries.reduce((sum, e) => sum + calcNetMinutes(e), 0)
  const totalHours = Math.floor(totalMinutes / 60)
  const totalMins = Math.round(totalMinutes % 60)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Meine Zeiten</h1>
        <div className="flex items-center gap-2 rounded-lg bg-[--color-primary] px-3 py-1.5 text-sm font-medium text-white">
          <Clock className="h-4 w-4" />
          {totalHours}:{totalMins.toString().padStart(2, '0')} Std. (7 Tage)
        </div>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <Card className="py-8 text-center text-sm text-slate-500">
          Keine Einträge in den letzten 7 Tagen
        </Card>
      ) : (
        Object.entries(grouped).map(([date, dayEntries]) => {
          const dayTotal = dayEntries.reduce((sum, e) => sum + calcNetMinutes(e), 0)
          const dayH = Math.floor(dayTotal / 60)
          const dayM = Math.round(dayTotal % 60)
          return (
            <div key={date}>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-700">
                  {formatDate(dayEntries[0].clock_in)}
                </h2>
                <span className="text-sm text-slate-500">
                  {dayH}:{dayM.toString().padStart(2, '0')} Std.
                </span>
              </div>
              <Card className="p-0">
                <div className="divide-y divide-slate-100">
                  {dayEntries.map((entry) => {
                    const net = calcNetMinutes(entry)
                    const h = Math.floor(net / 60)
                    const m = Math.round(net % 60)
                    return (
                      <div key={entry.id} className="flex items-center justify-between px-4 py-3 text-sm">
                        <div>
                          <p className="font-medium text-slate-900">
                            {siteMap.get(entry.site_id) || 'Unbekannt'}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatTime(entry.clock_in)}
                            {entry.clock_out ? ` – ${formatTime(entry.clock_out)}` : ' – läuft'}
                            {entry.break_minutes > 0 && ` · ${entry.break_minutes}min Pause`}
                          </p>
                        </div>
                        <span className="font-medium text-slate-700">
                          {entry.clock_out ? `${h}:${m.toString().padStart(2, '0')}` : '–'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </Card>
            </div>
          )
        })
      )}
    </div>
  )
}
