import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getDateRange } from '@/lib/date-utils'
import { getSurcharges } from '@/lib/surcharges'
import type { TimeEntry, Profile, Company } from '@/lib/types'

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })
}

function calcNet(entry: TimeEntry): number {
  if (!entry.clock_out) return 0
  const diffMs = new Date(entry.clock_out).getTime() - new Date(entry.clock_in).getTime()
  return Math.max(0, diffMs / 60000 - entry.break_minutes)
}

function fmtH(min: number): string {
  return `${Math.floor(min / 60)}:${Math.round(min % 60).toString().padStart(2, '0')}`
}

export default async function DruckPage({
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

  const [
    { data: profile },
    { data: company },
    { data: entries },
    { data: sites },
  ] = await Promise.all([
    supabase.from('profiles').select('first_name, last_name, company_id').eq('id', user.id).single<Pick<Profile, 'first_name' | 'last_name' | 'company_id'>>(),
    supabase.from('companies').select('name').single(),
    supabase.from('time_entries').select('*').eq('user_id', user.id).gte('clock_in', start.toISOString()).lte('clock_in', end.toISOString()).order('clock_in'),
    supabase.from('construction_sites').select('id, name'),
  ])

  const siteMap = new Map((sites || []).map((s: { id: string; name: string }) => [s.id, s.name]))
  const typedEntries = (entries as TimeEntry[]) || []
  const totalNet = typedEntries.reduce((s, e) => s + calcNet(e), 0)

  const periodLabel = `${start.toLocaleDateString('de-DE')} – ${end.toLocaleDateString('de-DE')}`

  return (
    <div className="mx-auto max-w-3xl p-8 print:p-0">
      {/* Auto-print script */}
      <script dangerouslySetInnerHTML={{ __html: 'window.onload=function(){window.print()}' }} />

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          nav, header, aside, footer, button { display: none !important; }
          body { background: white !important; }
          .no-print { display: none !important; }
        }
      `}} />

      <div className="mb-6 border-b border-slate-300 pb-4">
        <h1 className="text-xl font-bold">Stundenzettel</h1>
        <p className="text-sm text-slate-600">{company?.name || ''}</p>
        <p className="text-sm text-slate-600">
          {profile ? `${profile.first_name} ${profile.last_name}` : ''}
        </p>
        <p className="text-sm text-slate-600">Zeitraum: {periodLabel}</p>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-300 text-left">
            <th className="pb-2 font-medium">Datum</th>
            <th className="pb-2 font-medium">Baustelle</th>
            <th className="pb-2 font-medium">Beginn</th>
            <th className="pb-2 font-medium">Ende</th>
            <th className="pb-2 font-medium text-right">Pause</th>
            <th className="pb-2 font-medium text-right">Netto</th>
            <th className="pb-2 font-medium text-center">Z</th>
          </tr>
        </thead>
        <tbody>
          {typedEntries.map((entry) => {
            const net = calcNet(entry)
            const s = entry.clock_out ? getSurcharges(entry.clock_in, entry.clock_out) : null
            const flags = [
              s?.isNight ? 'N' : '',
              s?.isWeekend ? 'WE' : '',
              s?.isHoliday ? 'FT' : '',
            ].filter(Boolean).join(',')
            return (
              <tr key={entry.id} className="border-b border-slate-100">
                <td className="py-1.5">{formatDate(entry.clock_in)}</td>
                <td className="py-1.5">{siteMap.get(entry.site_id) || '–'}</td>
                <td className="py-1.5">{formatTime(entry.clock_in)}</td>
                <td className="py-1.5">{entry.clock_out ? formatTime(entry.clock_out) : '–'}</td>
                <td className="py-1.5 text-right">{entry.break_minutes > 0 ? `${entry.break_minutes}` : ''}</td>
                <td className="py-1.5 text-right font-medium">{entry.clock_out ? fmtH(net) : '–'}</td>
                <td className="py-1.5 text-center text-xs text-slate-500">{flags}</td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-slate-300">
            <td colSpan={5} className="py-2 font-bold">Gesamt</td>
            <td className="py-2 text-right font-bold">{fmtH(totalNet)}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>

      <div className="mt-12 flex justify-between text-sm text-slate-500">
        <div>
          <p className="mb-8">_________________________</p>
          <p>Unterschrift Arbeitnehmer</p>
        </div>
        <div>
          <p className="mb-8">_________________________</p>
          <p>Unterschrift Arbeitgeber</p>
        </div>
      </div>
    </div>
  )
}
