'use client'

import { useActionState } from 'react'
import { createEquipment, type FleetState } from '@/actions/fleet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

export function EquipmentForm() {
  const [state, action, pending] = useActionState<FleetState, FormData>(createEquipment, null)

  return (
    <form action={action} className="flex flex-col gap-4">
      <Input label="Name" name="name" required placeholder="z.B. Bagger CAT 320" error={state?.errors?.name?.[0]} />
      <Select label="Kategorie" name="category" options={[
        { value: 'heavy', label: 'Baumaschine' }, { value: 'power_tool', label: 'Elektrowerkzeug' },
        { value: 'tool', label: 'Werkzeug' }, { value: 'safety', label: 'Sicherheit' }, { value: 'other', label: 'Sonstiges' },
      ]} />
      <Input label="Seriennummer" name="serial_number" />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Kaufdatum" name="purchase_date" type="date" />
        <Input label="Kaufpreis (€)" name="purchase_price" type="number" step="0.01" />
      </div>
      <Input label="Tagessatz (€)" name="daily_rate" type="number" step="0.01" />
      <Input label="Nächste Wartung" name="next_maintenance" type="date" />
      <Input label="Notizen" name="notes" />
      {state?.message && <p className="text-sm text-red-600">{state.message}</p>}
      <Button type="submit" disabled={pending}>{pending ? 'Erstellen...' : 'Gerät erstellen'}</Button>
    </form>
  )
}
