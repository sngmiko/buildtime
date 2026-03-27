'use client'

import { useActionState } from 'react'
import { updateVehicle, type FleetState } from '@/actions/fleet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type { Vehicle } from '@/lib/types'

export function VehicleEditForm({ vehicle }: { vehicle: Vehicle }) {
  const boundUpdate = updateVehicle.bind(null, vehicle.id)
  const [state, action, pending] = useActionState<FleetState, FormData>(boundUpdate, null)

  return (
    <form action={action} className="flex flex-col gap-4">
      <Input label="Kennzeichen" name="license_plate" defaultValue={vehicle.license_plate} required error={state?.errors?.license_plate?.[0]} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Marke" name="make" defaultValue={vehicle.make} required error={state?.errors?.make?.[0]} />
        <Input label="Modell" name="model" defaultValue={vehicle.model} required error={state?.errors?.model?.[0]} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Baujahr" name="year" type="number" defaultValue={vehicle.year?.toString() || ''} />
        <Select label="Typ" name="type" defaultValue={vehicle.type} options={[{ value: 'car', label: 'PKW' }, { value: 'van', label: 'Transporter' }, { value: 'truck', label: 'LKW' }]} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Kilometerstand" name="mileage" type="number" defaultValue={String(vehicle.mileage || 0)} />
        <Select label="Status" name="status" defaultValue={vehicle.status} options={[
          { value: 'available', label: 'Verfügbar' }, { value: 'in_use', label: 'Im Einsatz' },
          { value: 'maintenance', label: 'Wartung' }, { value: 'decommissioned', label: 'Stillgelegt' },
        ]} />
      </div>
      <h4 className="mt-2 font-medium text-slate-700">Monatliche Kosten</h4>
      <div className="grid grid-cols-3 gap-3">
        <Input label="Leasing (€)" name="leasing_cost" type="number" step="0.01" defaultValue={vehicle.leasing_cost?.toString() || ''} />
        <Input label="Versicherung (€)" name="insurance_cost" type="number" step="0.01" defaultValue={vehicle.insurance_cost?.toString() || ''} />
        <Input label="Steuer (€)" name="tax_cost" type="number" step="0.01" defaultValue={vehicle.tax_cost?.toString() || ''} />
      </div>
      <Input label="Nächste HU/TÜV" name="next_inspection" type="date" defaultValue={vehicle.next_inspection || ''} />
      {state?.message && <p className={`text-sm ${state.success ? 'text-emerald-600' : 'text-red-600'}`}>{state.message}</p>}
      <Button type="submit" disabled={pending}>{pending ? 'Speichern...' : 'Fahrzeug speichern'}</Button>
    </form>
  )
}
