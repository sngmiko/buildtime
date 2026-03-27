'use server'

import { createClient } from '@/lib/supabase/server'
import { getSurcharges } from '@/lib/surcharges'
import type { TimeEntry } from '@/lib/types'

export async function exportCSV(
  userId: string,
  startDate: string,
  endDate: string
): Promise<string> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Nicht angemeldet')

  // Workers can only export their own data
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) throw new Error('Profil nicht gefunden')

  const targetUserId = profile.role === 'worker' ? user.id : userId

  const { data: entries } = await supabase
    .from('time_entries')
    .select('*, construction_sites(name)')
    .eq('user_id', targetUserId)
    .gte('clock_in', startDate)
    .lte('clock_in', endDate)
    .order('clock_in')

  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('first_name, last_name')
    .eq('id', targetUserId)
    .single()

  const name = targetProfile
    ? `${targetProfile.first_name} ${targetProfile.last_name}`
    : 'Unbekannt'

  // BOM for Excel UTF-8 compatibility
  let csv = '\ufeff'
  csv += `Stundenzettel: ${name}\r\n`
  csv += `Zeitraum: ${new Date(startDate).toLocaleDateString('de-DE')} - ${new Date(endDate).toLocaleDateString('de-DE')}\r\n`
  csv += '\r\n'
  csv += 'Datum;Baustelle;Beginn;Ende;Pause (min);Netto (Std);Nacht;Wochenende;Feiertag\r\n'

  let totalNet = 0

  for (const entry of (entries || []) as (TimeEntry & { construction_sites: { name: string } | null })[]) {
    if (!entry.clock_out) continue

    const site = entry.construction_sites?.name || 'Unbekannt'
    const date = new Date(entry.clock_in).toLocaleDateString('de-DE')
    const start = new Date(entry.clock_in).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
    const end = new Date(entry.clock_out).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
    const diffMs = new Date(entry.clock_out).getTime() - new Date(entry.clock_in).getTime()
    const netMinutes = Math.max(0, diffMs / 60000 - entry.break_minutes)
    const netHours = (netMinutes / 60).toFixed(2).replace('.', ',')
    totalNet += netMinutes

    const surcharges = getSurcharges(entry.clock_in, entry.clock_out)

    csv += `${date};${site};${start};${end};${entry.break_minutes};${netHours}`
    csv += `;${surcharges.isNight ? 'x' : ''};${surcharges.isWeekend ? 'x' : ''};${surcharges.isHoliday ? 'x' : ''}\r\n`
  }

  csv += `\r\nGesamt;;;;;;;${(totalNet / 60).toFixed(2).replace('.', ',')} Std.\r\n`

  return csv
}
