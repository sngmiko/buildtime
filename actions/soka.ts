'use server'

import { createClient } from '@/lib/supabase/server'
import { getSurcharges } from '@/lib/surcharges'
import { formatCurrency } from '@/lib/format'

export async function generateSokaReport(month: number, year: number): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Nicht angemeldet')

  const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile) throw new Error('Profil nicht gefunden')

  const { data: company } = await supabase.from('companies').select('name, soka_betriebskonto_nr, soka_umlagesatz_urlaub, soka_umlagesatz_berufsbildung, soka_umlagesatz_rente').eq('id', profile.company_id).single()

  // Get all workers with SOKA data
  const { data: workers } = await supabase.from('profiles').select('id, first_name, last_name, hourly_rate, soka_arbeitnehmer_nr').eq('role', 'worker')

  // Get time entries for the month
  const monthStart = new Date(year, month - 1, 1)
  const monthEnd = new Date(year, month, 0, 23, 59, 59)

  const { data: entries } = await supabase.from('time_entries').select('user_id, clock_in, clock_out, break_minutes').gte('clock_in', monthStart.toISOString()).lte('clock_in', monthEnd.toISOString()).not('clock_out', 'is', null)

  // Calculate per worker
  const workerData: { name: string; anNr: string; brutto: number; urlaubUmlage: number; bildungUmlage: number; renteUmlage: number; gesamt: number }[] = []

  for (const w of workers || []) {
    const workerEntries = (entries || []).filter((e: { user_id: string }) => e.user_id === w.id)
    const totalHours = workerEntries.reduce((s: number, e: { clock_in: string; clock_out: string; break_minutes: number }) => {
      return s + Math.max(0, (new Date(e.clock_out).getTime() - new Date(e.clock_in).getTime()) / 3600000 - e.break_minutes / 60)
    }, 0)

    const brutto = totalHours * (w.hourly_rate || 0)
    const urlaubUmlage = brutto * (Number(company?.soka_umlagesatz_urlaub) || 14.3) / 100
    const bildungUmlage = brutto * (Number(company?.soka_umlagesatz_berufsbildung) || 2.6) / 100
    const renteUmlage = brutto * (Number(company?.soka_umlagesatz_rente) || 3.2) / 100

    if (totalHours > 0) {
      workerData.push({
        name: `${w.last_name}, ${w.first_name}`,
        anNr: w.soka_arbeitnehmer_nr || '–',
        brutto: Math.round(brutto * 100) / 100,
        urlaubUmlage: Math.round(urlaubUmlage * 100) / 100,
        bildungUmlage: Math.round(bildungUmlage * 100) / 100,
        renteUmlage: Math.round(renteUmlage * 100) / 100,
        gesamt: Math.round((urlaubUmlage + bildungUmlage + renteUmlage) * 100) / 100,
      })
    }
  }

  // Generate CSV
  const monthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']

  let csv = '\ufeff' // BOM
  csv += `SOKA-BAU Meldung;${monthNames[month - 1]} ${year}\r\n`
  csv += `Betriebskonto-Nr;${company?.soka_betriebskonto_nr || '–'}\r\n`
  csv += `Firma;${company?.name || '–'}\r\n\r\n`
  csv += 'AN-Nr;Name;Bruttolohn;Urlaub-Umlage;Bildung-Umlage;Rente-Umlage;Gesamt\r\n'

  for (const w of workerData) {
    csv += `${w.anNr};${w.name};${w.brutto.toFixed(2).replace('.', ',')};${w.urlaubUmlage.toFixed(2).replace('.', ',')};${w.bildungUmlage.toFixed(2).replace('.', ',')};${w.renteUmlage.toFixed(2).replace('.', ',')};${w.gesamt.toFixed(2).replace('.', ',')}\r\n`
  }

  const totals = workerData.reduce((s, w) => ({
    brutto: s.brutto + w.brutto,
    urlaubUmlage: s.urlaubUmlage + w.urlaubUmlage,
    bildungUmlage: s.bildungUmlage + w.bildungUmlage,
    renteUmlage: s.renteUmlage + w.renteUmlage,
    gesamt: s.gesamt + w.gesamt,
  }), { brutto: 0, urlaubUmlage: 0, bildungUmlage: 0, renteUmlage: 0, gesamt: 0 })

  csv += `\r\nGESAMT;;${totals.brutto.toFixed(2).replace('.', ',')};${totals.urlaubUmlage.toFixed(2).replace('.', ',')};${totals.bildungUmlage.toFixed(2).replace('.', ',')};${totals.renteUmlage.toFixed(2).replace('.', ',')};${totals.gesamt.toFixed(2).replace('.', ',')}\r\n`

  return csv
}

export async function generateMonthlyExport(month: number, year: number): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Nicht angemeldet')

  const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile) throw new Error('Profil nicht gefunden')

  const { data: company } = await supabase.from('companies').select('name').eq('id', profile.company_id).single()
  const { data: workers } = await supabase.from('profiles').select('id, first_name, last_name, hourly_rate').in('role', ['worker', 'foreman'])

  const monthStart = new Date(year, month - 1, 1)
  const monthEnd = new Date(year, month, 0, 23, 59, 59)

  const [{ data: entries }, { data: leave }, { data: sick }] = await Promise.all([
    supabase.from('time_entries').select('user_id, clock_in, clock_out, break_minutes').gte('clock_in', monthStart.toISOString()).lte('clock_in', monthEnd.toISOString()).not('clock_out', 'is', null),
    supabase.from('leave_requests').select('user_id, days').eq('status', 'approved').gte('start_date', monthStart.toISOString().split('T')[0]).lte('end_date', monthEnd.toISOString().split('T')[0]),
    supabase.from('sick_days').select('user_id, days').gte('start_date', monthStart.toISOString().split('T')[0]).lte('end_date', monthEnd.toISOString().split('T')[0]),
  ])

  const monthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']

  let csv = '\ufeff'
  csv += `Stundennachweise;${company?.name};${monthNames[month - 1]} ${year}\r\n\r\n`
  csv += 'Pers-Nr;Nachname;Vorname;Stunden Gesamt;Nacht-Std;WE-Std;Feiertag-Std;Bruttolohn;Urlaubstage;Krankheitstage\r\n'

  for (const w of workers || []) {
    const workerEntries = (entries || []).filter((e: { user_id: string }) => e.user_id === w.id)

    let totalHours = 0, nightHours = 0, weekendHours = 0, holidayHours = 0
    for (const e of workerEntries as { clock_in: string; clock_out: string; break_minutes: number }[]) {
      const hours = Math.max(0, (new Date(e.clock_out).getTime() - new Date(e.clock_in).getTime()) / 3600000 - e.break_minutes / 60)
      totalHours += hours
      const surcharges = getSurcharges(e.clock_in, e.clock_out)
      if (surcharges.isNight) nightHours += hours
      if (surcharges.isWeekend) weekendHours += hours
      if (surcharges.isHoliday) holidayHours += hours
    }

    const leaveDays = (leave || []).filter((l: { user_id: string }) => l.user_id === w.id).reduce((s: number, l: { days: number }) => s + l.days, 0)
    const sickDays = (sick || []).filter((s: { user_id: string }) => s.user_id === w.id).reduce((sum: number, s: { days: number }) => sum + s.days, 0)
    const brutto = totalHours * (w.hourly_rate || 0)

    csv += `${w.id.slice(0, 8)};${w.last_name};${w.first_name};${totalHours.toFixed(1).replace('.', ',')};${nightHours.toFixed(1).replace('.', ',')};${weekendHours.toFixed(1).replace('.', ',')};${holidayHours.toFixed(1).replace('.', ',')};${brutto.toFixed(2).replace('.', ',')};${leaveDays};${sickDays}\r\n`
  }

  return csv
}
