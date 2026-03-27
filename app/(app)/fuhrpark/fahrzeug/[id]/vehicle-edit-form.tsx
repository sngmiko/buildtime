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

      <h4 className="mt-4 font-medium text-slate-700">Anschaffung</h4>
      <Select label="Art der Anschaffung" name="acquisition_type" defaultValue={vehicle.acquisition_type || 'purchased'} options={[
        { value: 'purchased', label: 'Gekauft (bar/Überweisung)' },
        { value: 'financed', label: 'Finanziert (Kredit)' },
        { value: 'leased', label: 'Geleast' },
        { value: 'rented', label: 'Gemietet' },
      ]} />

      <div className="grid grid-cols-2 gap-3">
        <Input label="Kaufpreis (€)" name="purchase_price" type="number" step="0.01" placeholder="35000.00" defaultValue={vehicle.purchase_price?.toString() || ''} />
        <Input label="Kaufdatum" name="purchase_date" type="date" defaultValue={vehicle.purchase_date || ''} />
      </div>

      <h4 className="mt-2 font-medium text-slate-700">Leasing / Finanzierung</h4>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Monatliche Rate (€)" name="monthly_rate" type="number" step="0.01" placeholder="450.00" defaultValue={vehicle.monthly_rate?.toString() || ''} />
        <Input label="Anzahlung (€)" name="down_payment" type="number" step="0.01" placeholder="5000.00" defaultValue={vehicle.down_payment?.toString() || ''} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Vertragsbeginn" name="contract_start" type="date" defaultValue={vehicle.contract_start || ''} />
        <Input label="Vertragsende" name="contract_end" type="date" defaultValue={vehicle.contract_end || ''} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Restwert (€)" name="residual_value" type="number" step="0.01" placeholder="Leasing-Restwert" defaultValue={vehicle.residual_value?.toString() || ''} />
        <Input label="Zinssatz (%)" name="interest_rate" type="number" step="0.01" placeholder="3.9" defaultValue={vehicle.interest_rate?.toString() || ''} />
      </div>
      <Input label="Kreditbetrag (€)" name="loan_amount" type="number" step="0.01" placeholder="Bei Finanzierung" defaultValue={vehicle.loan_amount?.toString() || ''} />
      <Input label="Tagesmiete (€)" name="rental_daily_rate" type="number" step="0.01" placeholder="Bei Miete" defaultValue={vehicle.rental_daily_rate?.toString() || ''} />

      <h4 className="mt-2 font-medium text-slate-700">Laufende Kosten (monatlich)</h4>
      <div className="grid grid-cols-3 gap-3">
        <Input label="Versicherung (€)" name="insurance_cost" type="number" step="0.01" defaultValue={vehicle.insurance_cost?.toString() || ''} />
        <Input label="KFZ-Steuer (€)" name="tax_cost" type="number" step="0.01" defaultValue={vehicle.tax_cost?.toString() || ''} />
        <Input label="Nächste HU/TÜV" name="next_inspection" type="date" defaultValue={vehicle.next_inspection || ''} />
      </div>

      {state?.message && <p className={`text-sm ${state.success ? 'text-emerald-600' : 'text-red-600'}`}>{state.message}</p>}
      <Button type="submit" disabled={pending}>{pending ? 'Speichern...' : 'Fahrzeug speichern'}</Button>
    </form>
  )
}
