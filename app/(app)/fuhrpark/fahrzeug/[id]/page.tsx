import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { ChevronLeft, Fuel, Route, Wrench } from 'lucide-react'
import { VehicleEditForm } from './vehicle-edit-form'
import { AddFuelLogForm, AddTripLogForm } from './fuel-trip-forms'
import type { Vehicle, FuelLog, TripLog } from '@/lib/types'

export default async function VehicleDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { id } = await params
  const { tab } = await searchParams
  const activeTab = tab || 'details'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['owner', 'foreman'].includes(profile.role)) redirect('/dashboard')

  const [
    { data: vehicle },
    { data: fuelLogs },
    { data: tripLogs },
  ] = await Promise.all([
    supabase.from('vehicles').select('*').eq('id', id).single(),
    supabase.from('fuel_logs').select('*').eq('vehicle_id', id).order('date', { ascending: false }).limit(20),
    supabase.from('trip_logs').select('*, profiles(first_name, last_name)').eq('vehicle_id', id).order('date', { ascending: false }).limit(20),
  ])

  if (!vehicle) notFound()
  const v = vehicle as Vehicle

  const STATUS_LABELS: Record<string, string> = { available: 'Verfügbar', in_use: 'Im Einsatz', maintenance: 'Wartung', decommissioned: 'Stillgelegt' }
  const TYPE_LABELS: Record<string, string> = { car: 'PKW', van: 'Transporter', truck: 'LKW' }

  // Calculate total fuel costs
  const totalFuelCost = (fuelLogs as FuelLog[] || []).reduce((s, f) => s + Number(f.cost), 0)
  const totalKm = (tripLogs as TripLog[] || []).reduce((s, t) => s + Number(t.km), 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/fuhrpark" className="text-slate-500 hover:text-slate-900"><ChevronLeft className="h-5 w-5" /></Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{v.license_plate}</h1>
          <p className="text-sm text-slate-500">{v.make} {v.model} · {TYPE_LABELS[v.type]} · {STATUS_LABELS[v.status]}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{v.mileage?.toLocaleString('de-DE') || 0}</p>
          <p className="text-xs text-slate-500">Kilometer</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{totalFuelCost.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</p>
          <p className="text-xs text-slate-500">Tankkosten</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{totalKm.toLocaleString('de-DE')} km</p>
          <p className="text-xs text-slate-500">Gefahrene KM</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">
            {v.next_inspection ? new Date(v.next_inspection).toLocaleDateString('de-DE') : '–'}
          </p>
          <p className="text-xs text-slate-500">Nächste HU/TÜV</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-white p-1">
        {[
          { id: 'details', label: 'Details', icon: Wrench },
          { id: 'fuel', label: 'Tankbuch', icon: Fuel },
          { id: 'trips', label: 'Fahrtenbuch', icon: Route },
        ].map((t) => {
          const Icon = t.icon
          return (
            <Link key={t.id} href={`?tab=${t.id}`}
              className={`flex items-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors ${activeTab === t.id ? 'bg-[#1e3a5f] text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Icon className="h-4 w-4" />{t.label}
            </Link>
          )
        })}
      </div>

      {activeTab === 'details' && (
        <Card className="max-w-lg">
          <VehicleEditForm vehicle={v} />
        </Card>
      )}

      {activeTab === 'fuel' && (
        <div className="flex flex-col gap-4">
          <AddFuelLogForm vehicleId={v.id} />
          {(fuelLogs as FuelLog[] || []).length === 0 ? (
            <Card className="py-8 text-center text-sm text-slate-500">Keine Tankeinträge</Card>
          ) : (
            <Card className="p-0">
              <div className="divide-y divide-slate-100">
                {(fuelLogs as FuelLog[]).map((f) => (
                  <div key={f.id} className="flex items-center justify-between px-4 py-3 text-sm">
                    <div>
                      <p className="font-medium text-slate-900">{new Date(f.date).toLocaleDateString('de-DE')}</p>
                      <p className="text-xs text-slate-500">{Number(f.liters).toFixed(1)} Liter · {f.mileage ? `${f.mileage.toLocaleString('de-DE')} km` : ''}</p>
                    </div>
                    <span className="font-medium text-slate-900">{Number(f.cost).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'trips' && (
        <div className="flex flex-col gap-4">
          <AddTripLogForm vehicleId={v.id} />
          {(tripLogs as TripLog[] || []).length === 0 ? (
            <Card className="py-8 text-center text-sm text-slate-500">Keine Fahrten</Card>
          ) : (
            <Card className="p-0">
              <div className="divide-y divide-slate-100">
                {(tripLogs as (TripLog & { profiles: { first_name: string; last_name: string } | null })[]).map((t) => (
                  <div key={t.id} className="flex items-center justify-between px-4 py-3 text-sm">
                    <div>
                      <p className="font-medium text-slate-900">{t.start_location} → {t.end_location}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(t.date).toLocaleDateString('de-DE')} · {t.purpose}
                        {t.profiles && ` · ${t.profiles.first_name} ${t.profiles.last_name}`}
                      </p>
                    </div>
                    <span className="font-medium text-slate-900">{Number(t.km)} km</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
