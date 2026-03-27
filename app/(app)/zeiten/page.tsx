import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Printer } from 'lucide-react'
import { PeriodNav } from '@/components/time/period-nav'
import { getDateRange } from '@/lib/date-utils'
import { TimeEntryRow, calcNetMinutes, formatHours } from '@/components/time/time-entry-row'
import { getSurcharges } from '@/lib/surcharges'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { TimeEntry } from '@/lib/types'
import { CSVDownload } from './csv-download'

export default async function ZeitenPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; offset?: string }>
}) {
  const params = await searchParams
  const period = params.period || 'week'
  const offset = parseInt(params.offset || '0', 10)
  const { start, end } = getDateRange(period, offset)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: entries } = await supabase
    .from('time_entries')
    .select('*')
    .eq('user_id', user.id)
    .gte('clock_in', start.toISOString())
    .lte('clock_in', end.toISOString())
    .order('clock_in', { ascending: false })

  const { data: sites } = await supabase
    .from('construction_sites')
    .select('id, name')

  const siteMap = new Map((sites || []).map((s: { id: string; name: string }) => [s.id, s.name]))
  const typedEntries = (entries as TimeEntry[]) || []

  // Group by date
  const grouped = typedEntries.reduce<Record<string, TimeEntry[]>>((acc, entry) => {
    const dateKey = new Date(entry.clock_in).toLocaleDateString('de-DE')
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(entry)
    return acc
  }, {})

  // Summary stats
  const totalMinutes = typedEntries.reduce((sum, e) => sum + calcNetMinutes(e), 0)
  let nightMinutes = 0
  let weekendMinutes = 0
  let holidayMinutes = 0
  for (const e of typedEntries) {
    if (!e.clock_out) continue
    const s = getSurcharges(e.clock_in, e.clock_out)
    const net = calcNetMinutes(e)
    if (s.isNight) nightMinutes += net
    if (s.isWeekend) weekendMinutes += net
    if (s.isHoliday) holidayMinutes += net
  }

  const periodLabel = period === 'month' ? 'Monat' : 'Woche'

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Meine Zeiten</h1>
        <div className="flex gap-2">
          <Link href={`/zeiten/druck?period=${period}&offset=${offset}`}>
            <Button variant="outline" size="sm">
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Drucken</span>
            </Button>
          </Link>
          <CSVDownload userId={user.id} startDate={start.toISOString()} endDate={end.toISOString()} />
        </div>
      </div>

      <PeriodNav />

      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{formatHours(totalMinutes)}</p>
          <p className="text-xs text-slate-500">Gesamt ({periodLabel})</p>
        </Card>
        {nightMinutes > 0 && (
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-indigo-600">{formatHours(nightMinutes)}</p>
            <p className="text-xs text-slate-500">Nachtarbeit</p>
          </Card>
        )}
        {weekendMinutes > 0 && (
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{formatHours(weekendMinutes)}</p>
            <p className="text-xs text-slate-500">Wochenende</p>
          </Card>
        )}
        {holidayMinutes > 0 && (
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-rose-600">{formatHours(holidayMinutes)}</p>
            <p className="text-xs text-slate-500">Feiertag</p>
          </Card>
        )}
      </div>

      {/* Entries by day */}
      {Object.keys(grouped).length === 0 ? (
        <Card className="py-8 text-center text-sm text-slate-500">
          Keine Einträge in diesem Zeitraum
        </Card>
      ) : (
        Object.entries(grouped).map(([date, dayEntries]) => {
          const dayTotal = dayEntries.reduce((sum, e) => sum + calcNetMinutes(e), 0)
          return (
            <div key={date}>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-700">
                  {new Date(dayEntries[0].clock_in).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })}
                </h2>
                <span className="text-sm text-slate-500">{formatHours(dayTotal)} Std.</span>
              </div>
              <Card className="p-0">
                <div className="divide-y divide-slate-100">
                  {dayEntries.map((entry) => (
                    <TimeEntryRow
                      key={entry.id}
                      entry={entry}
                      siteName={siteMap.get(entry.site_id) || 'Unbekannt'}
                    />
                  ))}
                </div>
              </Card>
            </div>
          )
        })
      )}
    </div>
  )
}
