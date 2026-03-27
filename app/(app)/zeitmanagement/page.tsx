import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PeriodNav, getDateRange } from '@/components/time/period-nav'
import { TimeEntryRow, calcNetMinutes, formatHours } from '@/components/time/time-entry-row'
import { Printer } from 'lucide-react'
import type { TimeEntry, Profile } from '@/lib/types'

export default async function ZeitmanagementPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; offset?: string; user?: string }>
}) {
  const params = await searchParams
  const period = params.period || 'week'
  const offset = parseInt(params.offset || '0', 10)
  const selectedUserId = params.user || ''
  const { start, end } = getDateRange(period, offset)

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['owner', 'foreman'].includes(profile.role)) {
    redirect('/stempeln')
  }

  // Get all workers in company
  const { data: workers } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, role')
    .in('role', ['worker', 'foreman'])
    .order('last_name')

  const { data: sites } = await supabase
    .from('construction_sites')
    .select('id, name')

  const siteMap = new Map((sites || []).map((s: { id: string; name: string }) => [s.id, s.name]))

  // Get entries for selected worker (or all if none selected)
  let entriesQuery = supabase
    .from('time_entries')
    .select('*')
    .gte('clock_in', start.toISOString())
    .lte('clock_in', end.toISOString())
    .order('clock_in', { ascending: false })

  if (selectedUserId) {
    entriesQuery = entriesQuery.eq('user_id', selectedUserId)
  }

  const { data: entries } = await entriesQuery

  const typedEntries = (entries as TimeEntry[]) || []
  const workerMap = new Map(
    (workers as Profile[] || []).map((w) => [w.id, `${w.first_name} ${w.last_name}`])
  )

  const totalMinutes = typedEntries.reduce((sum, e) => sum + calcNetMinutes(e), 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Zeitmanagement</h1>
        <div className="flex gap-2">
          <Link href={`/zeiten/druck?period=${period}&offset=${offset}`}>
            <Button variant="outline" size="sm">
              <Printer className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
        <div className="flex-1">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Mitarbeiter</label>
          <form>
            <input type="hidden" name="period" value={period} />
            <input type="hidden" name="offset" value={offset} />
            <select
              name="user"
              defaultValue={selectedUserId}
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="">Alle Mitarbeiter</option>
              {(workers as Profile[] || []).map((w) => (
                <option key={w.id} value={w.id}>
                  {w.first_name} {w.last_name} ({w.role === 'foreman' ? 'Bauleiter' : 'Arbeiter'})
                </option>
              ))}
            </select>
            <Button type="submit" size="sm" className="mt-2">Filtern</Button>
          </form>
        </div>
      </div>

      <PeriodNav />

      <Card className="p-4 text-center">
        <p className="text-2xl font-bold text-slate-900">{formatHours(totalMinutes)}</p>
        <p className="text-xs text-slate-500">
          Gesamt {selectedUserId ? workerMap.get(selectedUserId) || '' : 'alle Mitarbeiter'}
        </p>
      </Card>

      {typedEntries.length === 0 ? (
        <Card className="py-8 text-center text-sm text-slate-500">
          Keine Einträge in diesem Zeitraum
        </Card>
      ) : (
        <Card className="p-0">
          <div className="divide-y divide-slate-100">
            {typedEntries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between">
                <div className="flex-1">
                  {!selectedUserId && (
                    <p className="px-4 pt-2 text-xs font-medium text-[#1e3a5f]">
                      {workerMap.get(entry.user_id) || 'Unbekannt'}
                    </p>
                  )}
                  <TimeEntryRow
                    entry={entry}
                    siteName={siteMap.get(entry.site_id) || 'Unbekannt'}
                  />
                </div>
                <div className="flex gap-1 pr-4">
                  <Link href={`/zeitmanagement/${entry.id}?period=${period}&offset=${offset}&user=${selectedUserId}`}>
                    <Button variant="ghost" size="sm">Bearbeiten</Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
