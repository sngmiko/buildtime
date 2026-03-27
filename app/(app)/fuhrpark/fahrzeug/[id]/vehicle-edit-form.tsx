'use client'

import { useActionState, useState } from 'react'
import { updateVehicle, type FleetState } from '@/actions/fleet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type { Vehicle } from '@/lib/types'

export function VehicleEditForm({ vehicle }: { vehicle: Vehicle }) {
  const boundUpdate = updateVehicle.bind(null, vehicle.id)
  const [state, action, pending] = useActionState<FleetState, FormData>(boundUpdate, null)
  const [acquisitionType, setAcquisitionType] = useState(vehicle.acquisition_type || 'purchased')

  return (
    <form action={action} className="flex flex-col gap-5">
      {/* Fahrzeugdaten */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h4 className="mb-3 text-sm font-semibold text-slate-700 uppercase tracking-wide">Fahrzeugdaten</h4>
        <div className="flex flex-col gap-3">
          <Input label="Kennzeichen *" name="license_plate" defaultValue={vehicle.license_plate} required error={state?.errors?.license_plate?.[0]} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Marke *" name="make" defaultValue={vehicle.make} required error={state?.errors?.make?.[0]} />
            <Input label="Modell *" name="model" defaultValue={vehicle.model} required error={state?.errors?.model?.[0]} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Baujahr" name="year" type="number" defaultValue={vehicle.year?.toString() || ''} />
            <Select label="Typ" name="type" defaultValue={vehicle.type} options={[{ value: 'car', label: 'PKW' }, { value: 'van', label: 'Transporter' }, { value: 'truck', label: 'LKW' }]} />
            <Input label="KM-Stand" name="mileage" type="number" defaultValue={String(vehicle.mileage || 0)} />
          </div>
          <Select label="Status" name="status" defaultValue={vehicle.status} options={[
            { value: 'available', label: 'Verfügbar' }, { value: 'in_use', label: 'Im Einsatz' },
            { value: 'maintenance', label: 'In Wartung' }, { value: 'decommissioned', label: 'Stillgelegt' },
          ]} />
        </div>
      </div>

      {/* Anschaffung */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h4 className="mb-3 text-sm font-semibold text-slate-700 uppercase tracking-wide">Anschaffung</h4>
        <Select
          label="Anschaffungsart"
          name="acquisition_type"
          defaultValue={acquisitionType}
          options={[
            { value: 'purchased', label: 'Barkauf / Überweisung' },
            { value: 'financed', label: 'Finanzierung (Kredit)' },
            { value: 'leased', label: 'Leasing' },
            { value: 'rented', label: 'Miete / Langzeitmiete' },
          ]}
          onChange={(e) => setAcquisitionType((e.target as HTMLSelectElement).value as 'purchased' | 'leased' | 'financed' | 'rented')}
        />

        {acquisitionType === 'purchased' && (
          <div className="mt-3 flex flex-col gap-3 border-t border-slate-200 pt-3">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Kaufpreis (€)" name="purchase_price" type="number" step="0.01" defaultValue={vehicle.purchase_price?.toString() || ''} />
              <Input label="Kaufdatum" name="purchase_date" type="date" defaultValue={vehicle.purchase_date || ''} />
            </div>
          </div>
        )}

        {acquisitionType === 'financed' && (
          <div className="mt-3 flex flex-col gap-3 border-t border-slate-200 pt-3">
            <p className="text-xs text-slate-500">Kreditdetails</p>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Fahrzeugpreis (€)" name="purchase_price" type="number" step="0.01" defaultValue={vehicle.purchase_price?.toString() || ''} />
              <Input label="Kreditbetrag (€)" name="loan_amount" type="number" step="0.01" defaultValue={vehicle.loan_amount?.toString() || ''} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Anzahlung (€)" name="down_payment" type="number" step="0.01" defaultValue={vehicle.down_payment?.toString() || ''} />
              <Input label="Zinssatz (% p.a.)" name="interest_rate" type="number" step="0.01" defaultValue={vehicle.interest_rate?.toString() || ''} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Monatliche Rate (€)" name="monthly_rate" type="number" step="0.01" defaultValue={vehicle.monthly_rate?.toString() || ''} />
              <Input label="Kaufdatum" name="purchase_date" type="date" defaultValue={vehicle.purchase_date || ''} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Finanzierung ab" name="contract_start" type="date" defaultValue={vehicle.contract_start || ''} />
              <Input label="Finanzierung bis" name="contract_end" type="date" defaultValue={vehicle.contract_end || ''} />
            </div>
          </div>
        )}

        {acquisitionType === 'leased' && (
          <div className="mt-3 flex flex-col gap-3 border-t border-slate-200 pt-3">
            <p className="text-xs text-slate-500">Leasingvertrag</p>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Leasingrate (€/Monat)" name="monthly_rate" type="number" step="0.01" defaultValue={vehicle.monthly_rate?.toString() || ''} />
              <Input label="Sonderzahlung (€)" name="down_payment" type="number" step="0.01" defaultValue={vehicle.down_payment?.toString() || ''} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Leasingbeginn" name="contract_start" type="date" defaultValue={vehicle.contract_start || ''} />
              <Input label="Leasingende" name="contract_end" type="date" defaultValue={vehicle.contract_end || ''} />
            </div>
            <Input label="Restwert (€)" name="residual_value" type="number" step="0.01" defaultValue={vehicle.residual_value?.toString() || ''} />
          </div>
        )}

        {acquisitionType === 'rented' && (
          <div className="mt-3 flex flex-col gap-3 border-t border-slate-200 pt-3">
            <p className="text-xs text-slate-500">Mietvertrag</p>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Tagesmiete (€)" name="rental_daily_rate" type="number" step="0.01" defaultValue={vehicle.rental_daily_rate?.toString() || ''} />
              <Input label="Monatsmiete (€)" name="monthly_rate" type="number" step="0.01" defaultValue={vehicle.monthly_rate?.toString() || ''} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Mietbeginn" name="contract_start" type="date" defaultValue={vehicle.contract_start || ''} />
              <Input label="Mietende" name="contract_end" type="date" defaultValue={vehicle.contract_end || ''} />
            </div>
          </div>
        )}
      </div>

      {/* Laufende Kosten */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h4 className="mb-3 text-sm font-semibold text-slate-700 uppercase tracking-wide">Laufende Kosten (monatlich)</h4>
        <div className="grid grid-cols-2 gap-3">
          <Input label="KFZ-Versicherung (€/Monat)" name="insurance_cost" type="number" step="0.01" defaultValue={vehicle.insurance_cost?.toString() || ''} />
          <Input label="KFZ-Steuer (€/Monat)" name="tax_cost" type="number" step="0.01" defaultValue={vehicle.tax_cost?.toString() || ''} />
        </div>
        <div className="mt-3">
          <Input label="Nächste HU/TÜV" name="next_inspection" type="date" defaultValue={vehicle.next_inspection || ''} />
        </div>
      </div>

      {state?.message && <p className={`text-sm ${state.success ? 'text-emerald-600' : 'text-red-600'}`}>{state.message}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? 'Speichern...' : 'Fahrzeug speichern'}
      </Button>
    </form>
  )
}
