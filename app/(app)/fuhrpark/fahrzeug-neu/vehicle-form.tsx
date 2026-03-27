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

      <h4 className="mt-4 font-medium text-slate-700">Anschaffung</h4>
      <Select label="Art der Anschaffung" name="acquisition_type" options={[
        { value: 'purchased', label: 'Gekauft (bar/Überweisung)' },
        { value: 'financed', label: 'Finanziert (Kredit)' },
        { value: 'leased', label: 'Geleast' },
        { value: 'rented', label: 'Gemietet' },
      ]} />

      <div className="grid grid-cols-2 gap-3">
        <Input label="Kaufpreis (€)" name="purchase_price" type="number" step="0.01" placeholder="35000.00" />
        <Input label="Kaufdatum" name="purchase_date" type="date" />
      </div>

      <h4 className="mt-2 font-medium text-slate-700">Leasing / Finanzierung</h4>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Monatliche Rate (€)" name="monthly_rate" type="number" step="0.01" placeholder="450.00" />
        <Input label="Anzahlung (€)" name="down_payment" type="number" step="0.01" placeholder="5000.00" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Vertragsbeginn" name="contract_start" type="date" />
        <Input label="Vertragsende" name="contract_end" type="date" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Restwert (€)" name="residual_value" type="number" step="0.01" placeholder="Leasing-Restwert" />
        <Input label="Zinssatz (%)" name="interest_rate" type="number" step="0.01" placeholder="3.9" />
      </div>
      <Input label="Kreditbetrag (€)" name="loan_amount" type="number" step="0.01" placeholder="Bei Finanzierung" />
      <Input label="Tagesmiete (€)" name="rental_daily_rate" type="number" step="0.01" placeholder="Bei Miete" />

      <h4 className="mt-2 font-medium text-slate-700">Laufende Kosten (monatlich)</h4>
      <div className="grid grid-cols-3 gap-3">
        <Input label="Versicherung (€)" name="insurance_cost" type="number" step="0.01" />
        <Input label="KFZ-Steuer (€)" name="tax_cost" type="number" step="0.01" />
        <Input label="Nächste HU/TÜV" name="next_inspection" type="date" />
      </div>

      {state?.message && <p className="text-sm text-red-600">{state.message}</p>}
      <Button type="submit" disabled={pending}>{pending ? 'Erstellen...' : 'Fahrzeug erstellen'}</Button>
    </form>
  )
}
