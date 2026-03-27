'use client'

import { useActionState } from 'react'
import { addEquipmentCost, type FleetState } from '@/actions/fleet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card } from '@/components/ui/card'

export function AddCostForm({ equipmentId }: { equipmentId: string }) {
  const boundAdd = addEquipmentCost.bind(null, equipmentId)
  const [state, action, pending] = useActionState<FleetState, FormData>(boundAdd, null)

  return (
    <Card>
      <h3 className="mb-3 text-lg font-semibold text-slate-900">Kosten erfassen</h3>
      <form action={action} className="grid gap-3 sm:grid-cols-4">
        <Select label="Typ" name="type" options={[
          { value: 'maintenance', label: 'Wartung' },
          { value: 'repair', label: 'Reparatur' },
          { value: 'fuel', label: 'Betriebsstoffe' },
          { value: 'other', label: 'Sonstiges' },
        ]} />
        <Input label="Betrag (€)" name="amount" type="number" step="0.01" required />
        <Input label="Datum" name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
        <Input label="Beschreibung" name="description" placeholder="z.B. Ölwechsel" />
        {state?.message && <p className={`text-xs sm:col-span-4 ${state.success ? 'text-emerald-600' : 'text-red-600'}`}>{state.message}</p>}
        <div className="sm:col-span-4">
          <Button type="submit" disabled={pending} size="sm">{pending ? 'Speichern...' : 'Kosten eintragen'}</Button>
        </div>
      </form>
    </Card>
  )
}
