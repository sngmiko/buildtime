import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { ChevronLeft } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import { WorkshopActions } from './workshop-actions'
import type { WorkshopEntry } from '@/lib/types'

const REASON_LABELS: Record<string, string> = { repair: 'Reparatur', maintenance: 'Wartung', tuev: 'TÜV/HU', inspection: 'Inspektion', accident: 'Unfallschaden' }
const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  received: { label: 'Eingegangen', color: 'bg-amber-100 text-amber-800' },
  in_repair: { label: 'In Reparatur', color: 'bg-blue-100 text-blue-800' },
  done: { label: 'Fertig', color: 'bg-emerald-100 text-emerald-800' },
  picked_up: { label: 'Abgeholt', color: 'bg-slate-100 text-slate-600' },
}

export default async function WorkshopDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: entry } = await supabase.from('workshop_entries').select('*').eq('id', id).single()
  if (!entry) notFound()
  const e = entry as WorkshopEntry

  // Get entity name
  let entityName = 'Unbekannt'
  if (e.entity_type === 'vehicle') {
    const { data: v } = await supabase.from('vehicles').select('license_plate, make, model').eq('id', e.entity_id).single()
    if (v) entityName = `${v.license_plate} (${v.make} ${v.model})`
  } else {
    const { data: eq } = await supabase.from('equipment').select('name').eq('id', e.entity_id).single()
    if (eq) entityName = eq.name
  }

  const totalCost = Number(e.cost_parts) + Number(e.cost_labor) + Number(e.cost_external)
  const days = e.completed_at
    ? Math.ceil((new Date(e.completed_at).getTime() - new Date(e.entered_at).getTime()) / 86400000)
    : Math.ceil((Date.now() - new Date(e.entered_at).getTime()) / 86400000)
  const st = STATUS_LABELS[e.status] || STATUS_LABELS.received

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/fuhrpark/werkstatt" className="text-slate-500 hover:text-slate-900"><ChevronLeft className="h-5 w-5" /></Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">{entityName}</h1>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${st.color}`}>{st.label}</span>
          </div>
          <p className="text-sm text-slate-500">{REASON_LABELS[e.reason]} · {e.entity_type === 'vehicle' ? 'Fahrzeug' : 'Maschine'}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="p-4 text-center"><p className="text-xl font-bold">{days}</p><p className="text-xs text-slate-500">Tage</p></Card>
        <Card className="p-4 text-center"><p className="text-xl font-bold">{formatCurrency(Number(e.cost_parts))}</p><p className="text-xs text-slate-500">Teile</p></Card>
        <Card className="p-4 text-center"><p className="text-xl font-bold">{formatCurrency(Number(e.cost_labor))}</p><p className="text-xs text-slate-500">Arbeit</p></Card>
        <Card className="p-4 text-center"><p className="text-xl font-bold">{formatCurrency(totalCost)}</p><p className="text-xs text-slate-500">Gesamt</p></Card>
      </div>

      <WorkshopActions entry={e} />

      {e.description && <Card><h3 className="mb-2 font-semibold text-slate-900">Beschreibung</h3><p className="text-sm text-slate-600">{e.description}</p></Card>}
      {e.workshop_name && <p className="text-sm text-slate-500">Werkstatt: {e.workshop_name}</p>}
      {e.expected_completion && <p className="text-sm text-slate-500">Geplante Fertigstellung: {new Date(e.expected_completion).toLocaleDateString('de-DE')}</p>}
      <p className="text-sm text-slate-500">Eingang: {new Date(e.entered_at).toLocaleDateString('de-DE')}</p>
      {e.completed_at && <p className="text-sm text-slate-500">Fertiggestellt: {new Date(e.completed_at).toLocaleDateString('de-DE')}</p>}
    </div>
  )
}
