import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ClockDisplay } from '@/components/time/clock-display'
import { ClockInForm } from '@/components/time/clock-in-form'
import { ClockOutForm } from '@/components/time/clock-out-form'
import { DailyEntries } from '@/components/time/daily-entries'
import { Card } from '@/components/ui/card'
import { Phone } from 'lucide-react'
import type { TimeEntry, ConstructionSite } from '@/lib/types'

export default async function StempelnPage({
  searchParams,
}: {
  searchParams: Promise<{ site?: string }>
}) {
  const { site: defaultSiteId } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const { data: sites } = await supabase
    .from('construction_sites')
    .select('*')
    .eq('status', 'active')
    .order('name')

  const { data: openEntry } = await supabase
    .from('time_entries')
    .select('*')
    .eq('user_id', user.id)
    .is('clock_out', null)
    .maybeSingle()

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  // Calculate week bounds for schedule
  const weekStart = new Date(todayStart)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)

  const [{ data: todayEntries }, { data: weekSchedule }] = await Promise.all([
    supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', user.id)
      .gte('clock_in', todayStart.toISOString())
      .order('clock_in', { ascending: false }),
    supabase
      .from('schedule_entries')
      .select('*, construction_sites(name)')
      .eq('user_id', user.id)
      .gte('date', weekStart.toISOString().split('T')[0])
      .lte('date', weekEnd.toISOString().split('T')[0])
      .order('date'),
  ])

  const siteName = openEntry
    ? (sites as ConstructionSite[])?.find((s) => s.id === openEntry.site_id)?.name || 'Unbekannt'
    : ''

  // Get site contact info if clocked in
  const activeSite = openEntry
    ? (sites as (ConstructionSite & { contact_name?: string | null; contact_phone?: string | null; contact_role?: string | null })[])?.find((s) => s.id === openEntry.site_id)
    : null
  const siteContact = activeSite?.contact_name ? activeSite : null

  const DAY_NAMES = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

  return (
    <div className="flex flex-1 flex-col items-center gap-8 p-4 pt-8">
      <ClockDisplay />

      {openEntry ? (
        <ClockOutForm entry={openEntry as TimeEntry} siteName={siteName} />
      ) : (
        <ClockInForm sites={(sites as ConstructionSite[]) || []} defaultSiteId={defaultSiteId} />
      )}

      {openEntry && siteContact && (
        <div className="w-full max-w-md">
          <Card className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">{siteContact.contact_name}</p>
              <p className="text-xs text-slate-500">{siteContact.contact_role || 'Ansprechpartner'}</p>
            </div>
            {siteContact.contact_phone && (
              <a
                href={`tel:${siteContact.contact_phone}`}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 hover:bg-emerald-200"
              >
                <Phone className="h-5 w-5" />
              </a>
            )}
          </Card>
        </div>
      )}

      {weekSchedule && weekSchedule.length > 0 && (
        <div className="w-full max-w-md">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Diese Woche</h3>
          <div className="space-y-1">
            {weekSchedule.map((entry: { id: string; date: string; start_time?: string | null; end_time?: string | null; construction_sites?: { name: string } | null; notes?: string | null }) => {
              const d = new Date(entry.date)
              const dayName = DAY_NAMES[d.getDay() === 0 ? 6 : d.getDay() - 1]
              const dateStr = d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
              const isToday = entry.date === todayStart.toISOString().split('T')[0]
              return (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${isToday ? 'bg-[#1e3a5f] text-white' : 'bg-slate-50 text-slate-700'}`}
                >
                  <span className="font-medium w-16">{dayName}, {dateStr}</span>
                  <span className="flex-1 mx-3 truncate text-xs opacity-80">
                    {entry.construction_sites?.name || entry.notes || ''}
                  </span>
                  {(entry.start_time || entry.end_time) && (
                    <span className="text-xs opacity-70 shrink-0">
                      {entry.start_time?.slice(0, 5)}{entry.end_time ? `–${entry.end_time.slice(0, 5)}` : ''}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="w-full max-w-md">
        <DailyEntries
          entries={(todayEntries as TimeEntry[]) || []}
          sites={(sites as ConstructionSite[]) || []}
        />
      </div>
    </div>
  )
}
