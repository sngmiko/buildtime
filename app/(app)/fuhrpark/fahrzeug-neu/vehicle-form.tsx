'use client'

import { useActionState, useState } from 'react'
import { createVehicle, type FleetState } from '@/actions/fleet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

export function VehicleForm() {
  const [state, action, pending] = useActionState<FleetState, FormData>(createVehicle, null)
  const [acquisitionType, setAcquisitionType] = useState('purchased')

  return (
    <form action={action} className="flex flex-col gap-5">
      {/* Fahrzeugdaten */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h4 className="mb-3 text-sm font-semibold text-slate-700 uppercase tracking-wide">Fahrzeugdaten</h4>
        <div className="flex flex-col gap-3">
          <Input label="Kennzeichen *" name="license_plate" required placeholder="B-AB 1234" error={state?.errors?.license_plate?.[0]} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Marke *" name="make" required placeholder="VW" error={state?.errors?.make?.[0]} />
            <Input label="Modell *" name="model" required placeholder="Crafter" error={state?.errors?.model?.[0]} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Baujahr" name="year" type="number" placeholder="2024" />
            <Select label="Typ" name="type" options={[{ value: 'car', label: 'PKW' }, { value: 'van', label: 'Transporter' }, { value: 'truck', label: 'LKW' }]} />
            <Input label="KM-Stand" name="mileage" type="number" defaultValue="0" />
          </div>
        </div>
      </div>

      {/* Anschaffung */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h4 className="mb-3 text-sm font-semibold text-slate-700 uppercase tracking-wide">Anschaffung</h4>
        <Select
          label="Wie wurde das Fahrzeug angeschafft?"
          name="acquisition_type"
          defaultValue="purchased"
          options={[
            { value: 'purchased', label: 'Barkauf / Überweisung' },
            { value: 'financed', label: 'Finanzierung (Kredit)' },
            { value: 'leased', label: 'Leasing' },
            { value: 'rented', label: 'Miete / Langzeitmiete' },
          ]}
          onChange={(e) => setAcquisitionType((e.target as HTMLSelectElement).value)}
        />

        {/* Barkauf */}
        {acquisitionType === 'purchased' && (
          <div className="mt-3 flex flex-col gap-3 border-t border-slate-200 pt-3">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Kaufpreis (€)" name="purchase_price" type="number" step="0.01" placeholder="35.000,00" />
              <Input label="Kaufdatum" name="purchase_date" type="date" />
            </div>
          </div>
        )}

        {/* Finanzierung */}
        {acquisitionType === 'financed' && (
          <div className="mt-3 flex flex-col gap-3 border-t border-slate-200 pt-3">
            <p className="text-xs text-slate-500">Kreditdetails für die Finanzierung</p>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Fahrzeugpreis (€)" name="purchase_price" type="number" step="0.01" placeholder="35.000,00" />
              <Input label="Kreditbetrag (€)" name="loan_amount" type="number" step="0.01" placeholder="30.000,00" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Anzahlung (€)" name="down_payment" type="number" step="0.01" placeholder="5.000,00" />
              <Input label="Zinssatz (% p.a.)" name="interest_rate" type="number" step="0.01" placeholder="3,9" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Monatliche Rate (€)" name="monthly_rate" type="number" step="0.01" placeholder="450,00" />
              <Input label="Kaufdatum" name="purchase_date" type="date" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Finanzierung ab" name="contract_start" type="date" />
              <Input label="Finanzierung bis" name="contract_end" type="date" />
            </div>
          </div>
        )}

        {/* Leasing */}
        {acquisitionType === 'leased' && (
          <div className="mt-3 flex flex-col gap-3 border-t border-slate-200 pt-3">
            <p className="text-xs text-slate-500">Leasingvertrag-Details</p>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Monatliche Leasingrate (€)" name="monthly_rate" type="number" step="0.01" placeholder="450,00" />
              <Input label="Sonderzahlung / Anzahlung (€)" name="down_payment" type="number" step="0.01" placeholder="3.000,00" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Leasingbeginn" name="contract_start" type="date" />
              <Input label="Leasingende" name="contract_end" type="date" />
            </div>
            <Input label="Restwert bei Rückgabe (€)" name="residual_value" type="number" step="0.01" placeholder="12.000,00" />
          </div>
        )}

        {/* Miete */}
        {acquisitionType === 'rented' && (
          <div className="mt-3 flex flex-col gap-3 border-t border-slate-200 pt-3">
            <p className="text-xs text-slate-500">Mietvertrag-Details</p>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Tagesmiete (€)" name="rental_daily_rate" type="number" step="0.01" placeholder="85,00" />
              <Input label="Monatsmiete (€)" name="monthly_rate" type="number" step="0.01" placeholder="1.800,00" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Mietbeginn" name="contract_start" type="date" />
              <Input label="Mietende (geplant)" name="contract_end" type="date" />
            </div>
          </div>
        )}
      </div>

      {/* Laufende Kosten */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h4 className="mb-3 text-sm font-semibold text-slate-700 uppercase tracking-wide">Laufende Kosten (monatlich)</h4>
        <div className="grid grid-cols-2 gap-3">
          <Input label="KFZ-Versicherung (€/Monat)" name="insurance_cost" type="number" step="0.01" placeholder="120,00" />
          <Input label="KFZ-Steuer (€/Monat)" name="tax_cost" type="number" step="0.01" placeholder="25,00" />
        </div>
        <div className="mt-3">
          <Input label="Nächste HU/TÜV" name="next_inspection" type="date" />
        </div>
      </div>

      {state?.message && <p className="text-sm text-red-600">{state.message}</p>}
      <Button type="submit" disabled={pending} size="lg" className="w-full">
        {pending ? 'Fahrzeug wird erstellt...' : 'Fahrzeug erstellen'}
      </Button>
    </form>
  )
}
