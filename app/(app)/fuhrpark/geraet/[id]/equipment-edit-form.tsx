'use client'

import { useActionState } from 'react'
import { updateEquipment, type FleetState } from '@/actions/fleet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type { Equipment } from '@/lib/types'

export function EquipmentEditForm({ equipment, sites }: { equipment: Equipment; sites: { id: string; name: string }[] }) {
  const boundUpdate = updateEquipment.bind(null, equipment.id)
  const [state, action, pending] = useActionState<FleetState, FormData>(boundUpdate, null)

  return (
    <form action={action} className="flex flex-col gap-4">
      <Input label="Name" name="name" defaultValue={equipment.name} required error={state?.errors?.name?.[0]} />
      <Select label="Kategorie" name="category" defaultValue={equipment.category} options={[
        { value: 'heavy', label: 'Baumaschine' }, { value: 'power_tool', label: 'Elektrowerkzeug' },
        { value: 'tool', label: 'Werkzeug' }, { value: 'safety', label: 'Sicherheit' }, { value: 'other', label: 'Sonstiges' },
      ]} />
      <Select label="Status" name="status" defaultValue={equipment.status} options={[
        { value: 'available', label: 'Verfügbar' }, { value: 'in_use', label: 'Im Einsatz' },
        { value: 'maintenance', label: 'Wartung' }, { value: 'defect', label: 'Defekt' }, { value: 'disposed', label: 'Entsorgt' },
      ]} />
      <Input label="Seriennummer" name="serial_number" defaultValue={equipment.serial_number || ''} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Kaufdatum" name="purchase_date" type="date" defaultValue={equipment.purchase_date || ''} />
        <Input label="Kaufpreis (€)" name="purchase_price" type="number" step="0.01" defaultValue={equipment.purchase_price?.toString() || ''} />
      </div>
      <Input label="Tagessatz (€)" name="daily_rate" type="number" step="0.01" defaultValue={equipment.daily_rate?.toString() || ''} />
      <Input label="Nächste Wartung" name="next_maintenance" type="date" defaultValue={equipment.next_maintenance || ''} />
      <Input label="Notizen" name="notes" defaultValue={equipment.notes || ''} />
      {state?.message && <p className={`text-sm ${state.success ? 'text-emerald-600' : 'text-red-600'}`}>{state.message}</p>}
      <Button type="submit" disabled={pending}>{pending ? 'Speichern...' : 'Maschine speichern'}</Button>
    </form>
  )
}
