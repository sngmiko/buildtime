'use client'

import { useActionState } from 'react'
import { addStockMovement, type InventoryState } from '@/actions/inventory'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card } from '@/components/ui/card'

export function StockMovementForm({ materialId, sites }: { materialId: string; sites: { id: string; name: string }[] }) {
  const boundAdd = addStockMovement.bind(null, materialId)
  const [state, action, pending] = useActionState<InventoryState, FormData>(boundAdd, null)

  const siteOptions = [{ value: '', label: 'Keine Zuordnung' }, ...sites.map(s => ({ value: s.id, label: s.name }))]

  return (
    <Card>
      <h3 className="mb-3 text-lg font-semibold text-slate-900">Lagerbewegung erfassen</h3>
      <form action={action} className="grid gap-3 sm:grid-cols-5">
        <Select label="Typ" name="type" options={[
          { value: 'in', label: 'Eingang (Lieferung)' },
          { value: 'out', label: 'Ausgang (Entnahme)' },
          { value: 'return', label: 'Rückgabe' },
        ]} />
        <Input label="Menge" name="quantity" type="number" step="0.01" required />
        <Select label="Baustelle" name="site_id" options={siteOptions} />
        <div className="sm:col-span-2">
          <Input label="Notiz" name="notes" placeholder="z.B. Lieferschein-Nr." />
        </div>
        {state?.message && <p className={`text-xs sm:col-span-5 ${state.success ? 'text-emerald-600' : 'text-red-600'}`}>{state.message}</p>}
        <div className="sm:col-span-5">
          <Button type="submit" disabled={pending} size="sm">{pending ? 'Speichern...' : 'Bewegung erfassen'}</Button>
        </div>
      </form>
    </Card>
  )
}
