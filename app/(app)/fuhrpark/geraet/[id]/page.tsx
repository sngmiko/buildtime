import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { ChevronLeft } from 'lucide-react'
import { EquipmentEditForm } from './equipment-edit-form'
import { AddCostForm } from './add-cost-form'
import type { Equipment, EquipmentCost } from '@/lib/types'

const CAT_LABELS: Record<string, string> = { heavy: 'Baumaschine', power_tool: 'Elektrowerkzeug', tool: 'Werkzeug', safety: 'Sicherheit', other: 'Sonstiges' }
const STATUS_LABELS: Record<string, string> = { available: 'Verfügbar', in_use: 'Im Einsatz', maintenance: 'Wartung', defect: 'Defekt', disposed: 'Entsorgt' }

export default async function EquipmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['owner', 'foreman'].includes(profile.role)) redirect('/dashboard')

  const [{ data: equipment }, { data: costs }, { data: sites }] = await Promise.all([
    supabase.from('equipment').select('*, construction_sites(name)').eq('id', id).single(),
    supabase.from('equipment_costs').select('*').eq('equipment_id', id).order('date', { ascending: false }).limit(20),
    supabase.from('construction_sites').select('id, name').eq('status', 'active').order('name'),
  ])

  if (!equipment) notFound()
  const e = equipment as Equipment & { construction_sites: { name: string } | null }
  const totalCosts = (costs as EquipmentCost[] || []).reduce((s, c) => s + Number(c.amount), 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/fuhrpark?tab=equipment" className="text-slate-500 hover:text-slate-900"><ChevronLeft className="h-5 w-5" /></Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{e.name}</h1>
          <p className="text-sm text-slate-500">{CAT_LABELS[e.category]} · {STATUS_LABELS[e.status]}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{e.purchase_price ? Number(e.purchase_price).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }) : '–'}</p>
          <p className="text-xs text-slate-500">Kaufpreis</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{totalCosts.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</p>
          <p className="text-xs text-slate-500">Gesamtkosten</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{e.next_maintenance ? new Date(e.next_maintenance).toLocaleDateString('de-DE') : '–'}</p>
          <p className="text-xs text-slate-500">Nächste Wartung</p>
        </Card>
      </div>

      {e.construction_sites && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <p className="text-sm text-blue-700">Aktuell auf Baustelle: <strong>{e.construction_sites.name}</strong></p>
        </Card>
      )}

      <Card className="max-w-lg">
        <EquipmentEditForm equipment={e} sites={(sites || []) as { id: string; name: string }[]} />
      </Card>

      <AddCostForm equipmentId={e.id} />

      {/* Cost history */}
      {(costs as EquipmentCost[] || []).length > 0 && (
        <>
          <h2 className="text-lg font-semibold text-slate-900">Kostenhistorie</h2>
          <Card className="p-0">
            <div className="divide-y divide-slate-100">
              {(costs as EquipmentCost[]).map((c) => (
                <div key={c.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium text-slate-900">{c.description || c.type}</p>
                    <p className="text-xs text-slate-500">{new Date(c.date).toLocaleDateString('de-DE')} · {{ maintenance: 'Wartung', repair: 'Reparatur', fuel: 'Betriebsstoffe', other: 'Sonstiges' }[c.type]}</p>
                  </div>
                  <span className="font-medium">{Number(c.amount).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
