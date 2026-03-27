import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ClockDisplay } from '@/components/time/clock-display'
import { ClockInForm } from '@/components/time/clock-in-form'
import { ClockOutForm } from '@/components/time/clock-out-form'
import { DailyEntries } from '@/components/time/daily-entries'
import type { TimeEntry, ConstructionSite } from '@/lib/types'

export default async function StempelnPage() {
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

  const { data: todayEntries } = await supabase
    .from('time_entries')
    .select('*')
    .eq('user_id', user.id)
    .gte('clock_in', todayStart.toISOString())
    .order('clock_in', { ascending: false })

  const siteName = openEntry
    ? (sites as ConstructionSite[])?.find((s) => s.id === openEntry.site_id)?.name || 'Unbekannt'
    : ''

  return (
    <div className="flex flex-1 flex-col items-center gap-8 p-4 pt-8">
      <ClockDisplay />

      {openEntry ? (
        <ClockOutForm entry={openEntry as TimeEntry} siteName={siteName} />
      ) : (
        <ClockInForm sites={(sites as ConstructionSite[]) || []} />
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
