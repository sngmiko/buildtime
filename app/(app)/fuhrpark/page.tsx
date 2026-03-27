import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Truck, Wrench, AlertTriangle } from 'lucide-react'
import type { Vehicle, Equipment } from '@/lib/types'

const VEHICLE_TYPES: Record<string, string> = { car: 'PKW', van: 'Transporter', truck: 'LKW' }
const STATUS_COLORS: Record<string, string> = {
  available: 'bg-emerald-100 text-emerald-700',
  in_use: 'bg-blue-100 text-blue-700',
  maintenance: 'bg-amber-100 text-amber-700',
  decommissioned: 'bg-slate-100 text-slate-600',
  defect: 'bg-red-100 text-red-700',
  disposed: 'bg-slate-100 text-slate-600',
}
const STATUS_LABELS: Record<string, string> = {
  available: 'Verfügbar', in_use: 'Im Einsatz', maintenance: 'Wartung',
  decommissioned: 'Stillgelegt', defect: 'Defekt', disposed: 'Entsorgt',
}

export default async function FuhrparkPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  const activeTab = tab || 'vehicles'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['owner', 'foreman'].includes(profile.role)) redirect('/stempeln')

  const { data: vehicles } = await supabase.from('vehicles').select('*').order('license_plate')
  const { data: equipment } = await supabase.from('equipment').select('*, construction_sites(name)').order('name')

  // Warnings
  const thirtyDays = new Date()
  thirtyDays.setDate(thirtyDays.getDate() + 30)
  const inspectionWarnings = (vehicles as Vehicle[] || []).filter(v => v.next_inspection && new Date(v.next_inspection) < thirtyDays)
  const maintenanceWarnings = (equipment as Equipment[] || []).filter(e => e.next_maintenance && new Date(e.next_maintenance) < thirtyDays)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Fuhrpark & Geräte</h1>
        <div className="flex gap-2">
          <Link href="/fuhrpark/fahrzeug-neu">
            <Button><Plus className="h-4 w-4" /> Fahrzeug</Button>
          </Link>
          <Link href="/fuhrpark/geraet-neu">
            <Button variant="secondary"><Plus className="h-4 w-4" /> Gerät</Button>
          </Link>
        </div>
      </div>

      {(inspectionWarnings.length > 0 || maintenanceWarnings.length > 0) && (
        <Card className="border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-amber-700">
            <AlertTriangle className="h-4 w-4" />
            Bevorstehende Termine
          </div>
          <div className="mt-2 space-y-1 text-xs text-amber-600">
            {inspectionWarnings.map(v => (
              <p key={v.id}>TÜV/HU: {v.license_plate} ({v.make} {v.model}) — {new Date(v.next_inspection!).toLocaleDateString('de-DE')}</p>
            ))}
            {maintenanceWarnings.map(e => (
              <p key={e.id}>Wartung: {e.name} — {new Date(e.next_maintenance!).toLocaleDateString('de-DE')}</p>
            ))}
          </div>
        </Card>
      )}

      {/* Tab toggle */}
      <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
        <Link href="?tab=vehicles" className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'vehicles' ? 'bg-[#1e3a5f] text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
          <Truck className="h-4 w-4" /> Fahrzeuge
        </Link>
        <Link href="?tab=equipment" className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'equipment' ? 'bg-[#1e3a5f] text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
          <Wrench className="h-4 w-4" /> Geräte
        </Link>
      </div>

      {activeTab === 'vehicles' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(vehicles as Vehicle[] || []).map((v) => (
            <Link key={v.id} href={`/fuhrpark/fahrzeug/${v.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">{v.license_plate}</h3>
                    <p className="text-sm text-slate-500">{v.make} {v.model} · {VEHICLE_TYPES[v.type]}</p>
                    {v.mileage > 0 && <p className="text-xs text-slate-400">{v.mileage.toLocaleString('de-DE')} km</p>}
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[v.status]}`}>
                    {STATUS_LABELS[v.status]}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
          {(!vehicles || vehicles.length === 0) && (
            <Card className="col-span-full py-8 text-center text-sm text-slate-500">Keine Fahrzeuge vorhanden</Card>
          )}
        </div>
      )}

      {activeTab === 'equipment' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(equipment as (Equipment & { construction_sites: { name: string } | null })[] || []).map((e) => (
            <Link key={e.id} href={`/fuhrpark/geraet/${e.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">{e.name}</h3>
                    <p className="text-sm text-slate-500">{{ heavy: 'Baumaschine', power_tool: 'Elektrowerkzeug', tool: 'Werkzeug', safety: 'Sicherheit', other: 'Sonstiges' }[e.category]}</p>
                    {e.construction_sites && <p className="text-xs text-slate-400">Baustelle: {e.construction_sites.name}</p>}
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[e.status]}`}>
                    {STATUS_LABELS[e.status]}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
          {(!equipment || equipment.length === 0) && (
            <Card className="col-span-full py-8 text-center text-sm text-slate-500">Keine Geräte vorhanden</Card>
          )}
        </div>
      )}
    </div>
  )
}
