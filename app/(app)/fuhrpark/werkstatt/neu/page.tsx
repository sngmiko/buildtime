import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { ChevronLeft } from 'lucide-react'
import { WorkshopForm } from './workshop-form'

export default async function NeuWerkstattPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: vehicles }, { data: equipment }] = await Promise.all([
    supabase.from('vehicles').select('id, license_plate, make, model'),
    supabase.from('equipment').select('id, name, category'),
  ])

  const vehicleOptions = (vehicles || []).map((v: { id: string; license_plate: string; make: string; model: string }) => ({
    value: `vehicle:${v.id}`,
    label: `${v.license_plate} — ${v.make} ${v.model}`,
  }))
  const equipmentOptions = (equipment || []).map((e: { id: string; name: string }) => ({
    value: `machine:${e.id}`,
    label: e.name,
  }))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/fuhrpark/werkstatt" className="text-slate-500 hover:text-slate-900"><ChevronLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold text-slate-900">Neuer Werkstattaufenthalt</h1>
      </div>
      <Card className="max-w-2xl">
        <WorkshopForm entities={[
          { group: 'Fahrzeuge', options: vehicleOptions },
          { group: 'Maschinen', options: equipmentOptions },
        ]} />
      </Card>
    </div>
  )
}
