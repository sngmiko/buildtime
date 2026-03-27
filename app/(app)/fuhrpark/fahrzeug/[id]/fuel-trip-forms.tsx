'use client'

import { useActionState } from 'react'
import { addFuelLog, addTripLog, type FleetState } from '@/actions/fleet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

export function AddFuelLogForm({ vehicleId }: { vehicleId: string }) {
  const boundAdd = addFuelLog.bind(null, vehicleId)
  const [state, action, pending] = useActionState<FleetState, FormData>(boundAdd, null)

  return (
    <Card className="mb-4">
      <h4 className="mb-3 text-sm font-semibold text-slate-900">Tankeintrag hinzufügen</h4>
      <form action={action} className="grid gap-3 sm:grid-cols-5">
        <Input label="Datum" name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
        <Input label="Liter" name="liters" type="number" step="0.01" required placeholder="45.5" />
        <Input label="Kosten (€)" name="cost" type="number" step="0.01" required placeholder="82.30" />
        <Input label="KM-Stand" name="mileage" type="number" placeholder="125000" />
        <div className="flex items-end">
          <Button type="submit" disabled={pending} size="sm" className="w-full">
            {pending ? 'Speichern...' : 'Eintragen'}
          </Button>
        </div>
        {state?.message && <p className={`text-xs sm:col-span-5 ${state.success ? 'text-emerald-600' : 'text-red-600'}`}>{state.message}</p>}
      </form>
    </Card>
  )
}

export function AddTripLogForm({ vehicleId }: { vehicleId: string }) {
  const boundAdd = addTripLog.bind(null, vehicleId)
  const [state, action, pending] = useActionState<FleetState, FormData>(boundAdd, null)

  return (
    <Card className="mb-4">
      <h4 className="mb-3 text-sm font-semibold text-slate-900">Fahrt eintragen</h4>
      <form action={action} className="grid gap-3 sm:grid-cols-6">
        <Input label="Datum" name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
        <Input label="Start" name="start_location" required placeholder="Berlin" />
        <Input label="Ziel" name="end_location" required placeholder="Potsdam" />
        <Input label="KM" name="km" type="number" step="0.1" required placeholder="35" />
        <Input label="Zweck" name="purpose" required placeholder="Baustelle" />
        <div className="flex items-end">
          <Button type="submit" disabled={pending} size="sm" className="w-full">
            {pending ? 'Speichern...' : 'Eintragen'}
          </Button>
        </div>
        {state?.message && <p className={`text-xs sm:col-span-6 ${state.success ? 'text-emerald-600' : 'text-red-600'}`}>{state.message}</p>}
      </form>
    </Card>
  )
}
