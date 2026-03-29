import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { CalendarDays, LayoutGrid, Clock } from 'lucide-react'

export default async function DispositionPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; week?: string; period?: string; offset?: string; user?: string }>
}) {
  const params = await searchParams
  const activeTab = params.tab || 'wochenplan'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['owner', 'foreman', 'super_admin'].includes(profile.role)) redirect('/stempeln')

  const TABS = [
    { id: 'wochenplan', label: 'Wochenplan', icon: LayoutGrid },
    { id: 'kalender', label: 'Kalender & Team', icon: CalendarDays },
    { id: 'zeiten', label: 'Zeitübersicht', icon: Clock },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Disposition</h1>
        <p className="text-sm text-slate-500">Planung, Zuweisungen und Zeitübersicht</p>
      </div>

      <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1">
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <Link key={t.id} href={`?tab=${t.id}`}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === t.id ? 'bg-[#1e3a5f] text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            ><Icon className="h-4 w-4" />{t.label}</Link>
          )
        })}
      </div>

      {activeTab === 'wochenplan' && <WochenplanTab params={params} />}
      {activeTab === 'kalender' && <KalenderTab />}
      {activeTab === 'zeiten' && <ZeitenTab params={params} />}
    </div>
  )
}

// Import and render the existing components inline
async function WochenplanTab({ params }: { params: Record<string, string | undefined> }) {
  // Reuse the planning grid logic from /planung
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  const weekOffset = parseInt(params.week || '0', 10)
  const now = new Date()
  const monday = new Date(now)
  monday.setDate(monday.getDate() - monday.getDay() + 1 + weekOffset * 7)
  monday.setHours(0, 0, 0, 0)

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(d.getDate() + i)
    return d
  })

  const startStr = days[0].toISOString().split('T')[0]
  const endStr = days[6].toISOString().split('T')[0]

  const [{ data: workers }, { data: sites }, { data: entries }] = await Promise.all([
    supabase.from('profiles').select('id, first_name, last_name, role').in('role', ['worker', 'foreman']).order('last_name'),
    supabase.from('construction_sites').select('id, name').eq('status', 'active'),
    supabase.from('schedule_entries').select('*').gte('date', startStr).lte('date', endStr),
  ])

  const entryMap = new Map<string, string>()
  for (const e of entries || []) {
    entryMap.set(`${e.user_id}:${e.date}`, (sites || []).find((s: { id: string }) => s.id === e.site_id)?.name || '?')
  }

  const dayLabels = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
  const weekLabel = `${days[0].toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })} – ${days[6].toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' })}`

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Link href={`?tab=wochenplan&week=${weekOffset - 1}`} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50">← Zurück</Link>
        <span className="text-sm font-medium text-slate-700">{weekLabel}</span>
        <div className="flex gap-2">
          {weekOffset !== 0 && <Link href="?tab=wochenplan" className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50">Heute</Link>}
          <Link href={`?tab=wochenplan&week=${weekOffset + 1}`} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50">Weiter →</Link>
        </div>
      </div>

      <Card className="p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="px-4 py-3 text-left font-medium text-slate-500 w-40">Mitarbeiter</th>
              {days.map((d, i) => (
                <th key={i} className="px-2 py-3 text-center font-medium text-slate-500 min-w-[100px]">
                  <div>{dayLabels[i]}</div>
                  <div className="text-[10px] text-slate-400">{d.toLocaleDateString('de-DE', { day: 'numeric', month: 'numeric' })}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(workers || []).map((w: { id: string; first_name: string; last_name: string }) => (
              <tr key={w.id}>
                <td className="px-4 py-3 font-medium text-slate-900">{w.first_name} {w.last_name}</td>
                {days.map((d, i) => {
                  const key = `${w.id}:${d.toISOString().split('T')[0]}`
                  const siteName = entryMap.get(key)
                  return (
                    <td key={i} className="px-2 py-3 text-center">
                      {siteName ? (
                        <span className="inline-block rounded-lg bg-[#1e3a5f]/10 px-2 py-1 text-xs font-medium text-[#1e3a5f]">{siteName}</span>
                      ) : (
                        <span className="text-slate-300">–</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

async function KalenderTab() {
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  const [{ data: workers }, { data: leaveToday }, { data: sickToday }] = await Promise.all([
    supabase.from('profiles').select('id, first_name, last_name, role, hourly_rate').in('role', ['worker', 'foreman']).order('last_name'),
    supabase.from('leave_requests').select('user_id').eq('status', 'approved').lte('start_date', new Date().toISOString().split('T')[0]).gte('end_date', new Date().toISOString().split('T')[0]),
    supabase.from('sick_days').select('user_id').lte('start_date', new Date().toISOString().split('T')[0]).gte('end_date', new Date().toISOString().split('T')[0]),
  ])

  // Get this week's time entries for capacity
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1)
  weekStart.setHours(0, 0, 0, 0)
  const { data: weekEntries } = await supabase.from('time_entries').select('user_id, clock_in, clock_out, break_minutes').gte('clock_in', weekStart.toISOString())

  const leaveSet = new Set((leaveToday || []).map((l: { user_id: string }) => l.user_id))
  const sickSet = new Set((sickToday || []).map((s: { user_id: string }) => s.user_id))

  // Calculate hours per worker this week
  const hoursMap = new Map<string, number>()
  for (const e of weekEntries || []) {
    if (!e.clock_out) continue
    const hours = Math.max(0, (new Date(e.clock_out).getTime() - new Date(e.clock_in).getTime()) / 3600000 - (e.break_minutes || 0) / 60)
    hoursMap.set(e.user_id, (hoursMap.get(e.user_id) || 0) + hours)
  }

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-semibold text-slate-900">Team-Verfügbarkeit</h3>
      <Card className="p-0">
        <div className="divide-y divide-slate-100">
          {(workers || []).map((w: { id: string; first_name: string; last_name: string; role: string }) => {
            const onLeave = leaveSet.has(w.id)
            const isSick = sickSet.has(w.id)
            const weekHours = hoursMap.get(w.id) || 0
            const capacity = 40
            const pct = Math.min(100, Math.round((weekHours / capacity) * 100))
            const barColor = onLeave || isSick ? 'bg-slate-300' : pct > 85 ? 'bg-red-500' : pct > 60 ? 'bg-amber-500' : 'bg-emerald-500'
            const dotColor = onLeave ? 'bg-slate-400' : isSick ? 'bg-slate-400' : pct > 85 ? 'bg-red-500' : pct > 60 ? 'bg-amber-500' : 'bg-emerald-500'
            const statusText = onLeave ? 'Urlaub' : isSick ? 'Krank' : `${Math.round(weekHours)}h / ${capacity}h`

            return (
              <div key={w.id} className="flex items-center gap-4 px-6 py-3">
                <div className={`h-2.5 w-2.5 rounded-full ${dotColor}`} />
                <div className="w-40">
                  <p className="text-sm font-medium text-slate-900">{w.first_name} {w.last_name}</p>
                  <p className="text-[10px] text-slate-400">{statusText}</p>
                </div>
                <div className="flex-1">
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <span className="text-xs text-slate-500 w-10 text-right">{pct}%</span>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

async function ZeitenTab({ params }: { params: Record<string, string | undefined> }) {
  const { createClient } = await import('@/lib/supabase/server')
  const { getDateRange } = await import('@/lib/date-utils')
  const { formatNumber } = await import('@/lib/format')
  const supabase = await createClient()

  const period = params.period || 'week'
  const offset = parseInt(params.offset || '0', 10)
  const selectedUserId = params.user || ''
  const { start, end } = getDateRange(period, offset)

  const { data: workers } = await supabase.from('profiles').select('id, first_name, last_name').in('role', ['worker', 'foreman']).order('last_name')

  let entriesQuery = supabase.from('time_entries').select('*, profiles(first_name, last_name), construction_sites(name)').gte('clock_in', start.toISOString()).lte('clock_in', end.toISOString()).order('clock_in', { ascending: false })
  if (selectedUserId) entriesQuery = entriesQuery.eq('user_id', selectedUserId)
  const { data: entries } = await entriesQuery

  const totalMinutes = (entries || []).reduce((s: number, e: { clock_in: string; clock_out: string | null; break_minutes: number }) => {
    if (!e.clock_out) return s
    return s + Math.max(0, (new Date(e.clock_out).getTime() - new Date(e.clock_in).getTime()) / 60000 - e.break_minutes)
  }, 0)

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-4 text-center">
        <p className="text-2xl font-bold text-slate-900">{formatNumber(totalMinutes / 60, 1)}h</p>
        <p className="text-xs text-slate-500">Gesamt {selectedUserId ? '' : 'alle Mitarbeiter'}</p>
      </Card>

      {(!entries || entries.length === 0) ? (
        <Card className="py-8 text-center text-sm text-slate-500">Keine Zeiteinträge in diesem Zeitraum</Card>
      ) : (
        <Card className="p-0">
          <div className="divide-y divide-slate-100">
            {(entries || []).map((e: { id: string; clock_in: string; clock_out: string | null; break_minutes: number; user_id: string; profiles: { first_name: string; last_name: string } | null; construction_sites: { name: string } | null }) => {
              const hours = e.clock_out ? Math.max(0, (new Date(e.clock_out).getTime() - new Date(e.clock_in).getTime()) / 3600000 - e.break_minutes / 60) : 0
              return (
                <div key={e.id} className="flex items-center justify-between px-6 py-3 text-sm">
                  <div>
                    <p className="font-medium text-slate-900">{e.profiles?.first_name} {e.profiles?.last_name}</p>
                    <p className="text-xs text-slate-500">
                      {e.construction_sites?.name} · {new Date(e.clock_in).toLocaleDateString('de-DE')} ·
                      {new Date(e.clock_in).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                      {e.clock_out ? ` – ${new Date(e.clock_out).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}` : ' – läuft'}
                    </p>
                  </div>
                  <span className="font-medium text-slate-700">{e.clock_out ? `${hours.toFixed(1)}h` : '–'}</span>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
