import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ExternalLink } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import { SokaExportButton } from './soka-export'

export default async function SokaBauPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('company_id, role').eq('id', user.id).single()
  if (!profile || profile.role !== 'owner') redirect('/dashboard')

  const { data: company } = await supabase.from('companies').select('*').eq('id', profile.company_id).single()
  if (!company) redirect('/dashboard')

  // Calculate current month SOKA costs
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0)
  const { data: workers } = await supabase.from('profiles').select('id, first_name, last_name, hourly_rate, soka_arbeitnehmer_nr').eq('role', 'worker')
  const { data: entries } = await supabase.from('time_entries').select('user_id, clock_in, clock_out, break_minutes').gte('clock_in', monthStart.toISOString()).not('clock_out', 'is', null)

  let totalBrutto = 0
  const workerStats: { name: string; hours: number; brutto: number }[] = []
  for (const w of workers || []) {
    const wEntries = (entries || []).filter((e: { user_id: string }) => e.user_id === w.id)
    const hours = wEntries.reduce((s: number, e: { clock_in: string; clock_out: string; break_minutes: number }) =>
      s + Math.max(0, (new Date(e.clock_out).getTime() - new Date(e.clock_in).getTime()) / 3600000 - e.break_minutes / 60), 0)
    const brutto = hours * (w.hourly_rate || 0)
    totalBrutto += brutto
    if (hours > 0) workerStats.push({ name: `${w.first_name} ${w.last_name}`, hours: Math.round(hours * 10) / 10, brutto })
  }

  const urlaubUmlage = totalBrutto * (Number(company.soka_umlagesatz_urlaub) || 14.3) / 100
  const bildungUmlage = totalBrutto * (Number(company.soka_umlagesatz_berufsbildung) || 2.6) / 100
  const renteUmlage = totalBrutto * (Number(company.soka_umlagesatz_rente) || 3.2) / 100
  const gesamtUmlage = urlaubUmlage + bildungUmlage + renteUmlage

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">SOKA-BAU</h1>
          <p className="text-sm text-slate-500">Sozialkassen der Bauwirtschaft</p>
        </div>
        <a href="https://kundenportal.soka-bau.de" target="_blank" rel="noopener noreferrer">
          <Button variant="outline"><ExternalLink className="h-4 w-4" /> SOKA-BAU Portal</Button>
        </a>
      </div>

      {/* Monthly overview */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="p-4 text-center">
          <p className="text-xl font-bold text-slate-900">{formatCurrency(totalBrutto)}</p>
          <p className="text-xs text-slate-500">Bruttolohnsumme</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xl font-bold text-blue-600">{formatCurrency(urlaubUmlage)}</p>
          <p className="text-xs text-slate-500">Urlaub ({company.soka_umlagesatz_urlaub || 14.3}%)</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xl font-bold text-emerald-600">{formatCurrency(bildungUmlage)}</p>
          <p className="text-xs text-slate-500">Berufsbildung ({company.soka_umlagesatz_berufsbildung || 2.6}%)</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xl font-bold text-[#1e3a5f]">{formatCurrency(gesamtUmlage)}</p>
          <p className="text-xs text-slate-500">Gesamt-Umlage</p>
        </Card>
      </div>

      {/* Worker table */}
      {workerStats.length > 0 && (
        <Card className="p-0">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="font-semibold text-slate-900">Beitragsübersicht aktueller Monat</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-6 py-3 text-left font-medium text-slate-500">Mitarbeiter</th>
                <th className="px-6 py-3 text-right font-medium text-slate-500">Stunden</th>
                <th className="px-6 py-3 text-right font-medium text-slate-500">Bruttolohn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {workerStats.map((w, i) => (
                <tr key={i}>
                  <td className="px-6 py-3 font-medium text-slate-900">{w.name}</td>
                  <td className="px-6 py-3 text-right text-slate-600">{w.hours}h</td>
                  <td className="px-6 py-3 text-right text-slate-900">{formatCurrency(w.brutto)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <SokaExportButton />
    </div>
  )
}
