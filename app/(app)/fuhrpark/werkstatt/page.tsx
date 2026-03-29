import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Wrench, Clock, Euro } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import type { WorkshopEntry } from '@/lib/types'

const REASON_LABELS: Record<string, string> = { repair: 'Reparatur', maintenance: 'Wartung', tuev: 'TÜV/HU', inspection: 'Inspektion', accident: 'Unfallschaden' }
const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  received: { label: 'Eingegangen', color: 'bg-amber-100 text-amber-800' },
  in_repair: { label: 'In Reparatur', color: 'bg-blue-100 text-blue-800' },
  done: { label: 'Fertig', color: 'bg-emerald-100 text-emerald-800' },
  picked_up: { label: 'Abgeholt', color: 'bg-slate-100 text-slate-600' },
}

export default async function WerkstattPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status: filterStatus } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['owner', 'foreman', 'super_admin'].includes(profile.role)) redirect('/dashboard')

  let query = supabase.from('workshop_entries').select('*').order('entered_at', { ascending: false })
  if (filterStatus && filterStatus !== 'all') {
    query = query.eq('status', filterStatus)
  }
  const { data: entries } = await query

  // Get entity names
  const { data: vehicles } = await supabase.from('vehicles').select('id, license_plate, make, model')
  const { data: equipment } = await supabase.from('equipment').select('id, name')
  const vehicleMap = new Map((vehicles || []).map((v: { id: string; license_plate: string; make: string; model: string }) => [v.id, `${v.license_plate} (${v.make} ${v.model})`]))
  const equipmentMap = new Map((equipment || []).map((e: { id: string; name: string }) => [e.id, e.name]))

  const typedEntries = (entries as WorkshopEntry[]) || []
  const activeCount = typedEntries.filter(e => e.status !== 'picked_up').length
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0)
  const monthCosts = typedEntries.filter(e => new Date(e.created_at) >= monthStart).reduce((s, e) => s + Number(e.cost_parts) + Number(e.cost_labor) + Number(e.cost_external), 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Werkstatt</h1>
          <p className="text-sm text-slate-500">Fahrzeuge und Maschinen in Reparatur/Wartung</p>
        </div>
        <Link href="/fuhrpark/werkstatt/neu">
          <Button><Plus className="h-4 w-4" /> Neuer Aufenthalt</Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50"><Wrench className="h-5 w-5 text-amber-600" /></div>
          <div><p className="text-xl font-bold text-slate-900">{activeCount}</p><p className="text-xs text-slate-500">Aktuell in Werkstatt</p></div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50"><Clock className="h-5 w-5 text-blue-600" /></div>
          <div><p className="text-xl font-bold text-slate-900">{typedEntries.length}</p><p className="text-xs text-slate-500">Aufenthalte gesamt</p></div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50"><Euro className="h-5 w-5 text-emerald-600" /></div>
          <div><p className="text-xl font-bold text-slate-900">{formatCurrency(monthCosts)}</p><p className="text-xs text-slate-500">Kosten diesen Monat</p></div>
        </Card>
      </div>

      {/* Status filter */}
      <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1">
        {[
          { key: 'all', label: 'Alle' },
          { key: 'received', label: 'Eingegangen' },
          { key: 'in_repair', label: 'In Reparatur' },
          { key: 'done', label: 'Fertig' },
          { key: 'picked_up', label: 'Abgeholt' },
        ].map(f => (
          <Link key={f.key} href={`?status=${f.key}`}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${(filterStatus || 'all') === f.key ? 'bg-[#1e3a5f] text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >{f.label}</Link>
        ))}
      </div>

      {typedEntries.length === 0 ? (
        <Card className="py-12 text-center text-sm text-slate-500">Keine Werkstattaufenthalte</Card>
      ) : (
        <Card className="p-0">
          <div className="divide-y divide-slate-100">
            {typedEntries.map(e => {
              const name = e.entity_type === 'vehicle' ? vehicleMap.get(e.entity_id) : equipmentMap.get(e.entity_id)
              const st = STATUS_LABELS[e.status] || STATUS_LABELS.received
              const totalCost = Number(e.cost_parts) + Number(e.cost_labor) + Number(e.cost_external)
              const days = e.completed_at
                ? Math.ceil((new Date(e.completed_at).getTime() - new Date(e.entered_at).getTime()) / 86400000)
                : Math.ceil((Date.now() - new Date(e.entered_at).getTime()) / 86400000)

              return (
                <Link key={e.id} href={`/fuhrpark/werkstatt/${e.id}`}>
                  <div className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900">{name || 'Unbekannt'}</p>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${st.color}`}>{st.label}</span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {REASON_LABELS[e.reason]} · {days} Tag(e) · {new Date(e.entered_at).toLocaleDateString('de-DE')}
                        {e.workshop_name && ` · ${e.workshop_name}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-slate-900">{formatCurrency(totalCost)}</p>
                      <p className="text-xs text-slate-500">{e.entity_type === 'vehicle' ? 'Fahrzeug' : 'Maschine'}</p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
