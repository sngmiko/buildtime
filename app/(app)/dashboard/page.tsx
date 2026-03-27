import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Users, HardHat, Clock, Mail } from 'lucide-react'
import type { Profile } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, company_id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const [
    { count: activeWorkers },
    { count: activeSites },
    { data: todayEntries },
    { count: openInvitations },
    { data: clockedInNow },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'worker'),
    supabase.from('construction_sites').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('time_entries').select('clock_in, clock_out, break_minutes').gte('clock_in', todayStart.toISOString()),
    supabase.from('invitations').select('*', { count: 'exact', head: true }).is('accepted_at', null).gt('expires_at', new Date().toISOString()),
    supabase.from('time_entries').select('user_id, clock_in, site_id, profiles(first_name, last_name), construction_sites(name)').is('clock_out', null),
  ])

  const totalMinutes = (todayEntries || []).reduce((sum: number, e: { clock_in: string; clock_out: string | null; break_minutes: number }) => {
    if (!e.clock_out) return sum
    const diffMs = new Date(e.clock_out).getTime() - new Date(e.clock_in).getTime()
    return sum + Math.max(0, diffMs / 60000 - e.break_minutes)
  }, 0)
  const totalHours = (totalMinutes / 60).toFixed(1)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Guten Morgen' : hour < 18 ? 'Guten Tag' : 'Guten Abend'

  const stats = [
    { label: 'Mitarbeiter', value: String(activeWorkers || 0), icon: Users, color: 'text-[--color-primary]', bg: 'bg-blue-50' },
    { label: 'Aktive Baustellen', value: String(activeSites || 0), icon: HardHat, color: 'text-[--color-accent-dark]', bg: 'bg-amber-50' },
    { label: 'Stunden heute', value: totalHours, icon: Clock, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Offene Einladungen', value: String(openInvitations || 0), icon: Mail, color: 'text-violet-600', bg: 'bg-violet-50' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {greeting}, {profile.first_name || 'Willkommen'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">Hier ist Ihre Tagesübersicht</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="flex items-center gap-4 p-5">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${stat.bg}`}>
                <Icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            </Card>
          )
        })}
      </div>

      <Card>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Aktuell eingestempelt</h2>
        {(!clockedInNow || clockedInNow.length === 0) ? (
          <p className="text-sm text-slate-500">Niemand ist gerade eingestempelt</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {clockedInNow.map((entry: Record<string, unknown>) => {
              const p = entry.profiles as { first_name: string; last_name: string } | null
              const s = entry.construction_sites as { name: string } | null
              const clockIn = new Date(entry.clock_in as string)
              const since = clockIn.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
              return (
                <div key={entry.user_id as string} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <span className="font-medium text-slate-900">
                      {p ? `${p.first_name} ${p.last_name}` : 'Unbekannt'}
                    </span>
                    <span className="ml-2 text-slate-500">{s?.name || ''}</span>
                  </div>
                  <span className="text-xs text-emerald-600">seit {since}</span>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
