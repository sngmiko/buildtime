'use client'

import { useActionState } from 'react'
import { createVehicle, type FleetState } from '@/actions/fleet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

export function VehicleForm() {
  const [state, action, pending] = useActionState<FleetState, FormData>(createVehicle, null)

  return (
    <form action={action} className="flex flex-col gap-4">
      <Input label="Kennzeichen" name="license_plate" required placeholder="B-AB 1234" error={state?.errors?.license_plate?.[0]} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Marke" name="make" required placeholder="VW" error={state?.errors?.make?.[0]} />
        <Input label="Modell" name="model" required placeholder="Crafter" error={state?.errors?.model?.[0]} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Baujahr" name="year" type="number" />
        <Select label="Typ" name="type" options={[{ value: 'car', label: 'PKW' }, { value: 'van', label: 'Transporter' }, { value: 'truck', label: 'LKW' }]} />
      </div>
      <Input label="Kilometerstand" name="mileage" type="number" defaultValue="0" />
      <h4 className="mt-2 font-medium text-slate-700">Monatliche Kosten</h4>
      <div className="grid grid-cols-3 gap-3">
        <Input label="Leasing (€)" name="leasing_cost" type="number" step="0.01" />
        <Input label="Versicherung (€)" name="insurance_cost" type="number" step="0.01" />
        <Input label="Steuer (€)" name="tax_cost" type="number" step="0.01" />
      </div>
      <Input label="Nächste HU/TÜV" name="next_inspection" type="date" />
      {state?.message && <p className="text-sm text-red-600">{state.message}</p>}
      <Button type="submit" disabled={pending}>{pending ? 'Erstellen...' : 'Fahrzeug erstellen'}</Button>
    </form>
  )
}
