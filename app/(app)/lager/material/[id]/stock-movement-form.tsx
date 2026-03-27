'use client'

import { useActionState } from 'react'
import { addStockMovement, type InventoryState } from '@/actions/inventory'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card } from '@/components/ui/card'

export function StockMovementForm({
  materialId,
  sites,
  orders,
  defaultUnitPrice,
}: {
  materialId: string
  sites: { id: string; name: string }[]
  orders: { id: string; title: string }[]
  defaultUnitPrice?: number | null
}) {
  const boundAdd = addStockMovement.bind(null, materialId)
  const [state, action, pending] = useActionState<InventoryState, FormData>(boundAdd, null)

  const siteOptions = [{ value: '', label: 'Keine Zuordnung' }, ...sites.map(s => ({ value: s.id, label: s.name }))]
  const orderOptions = [{ value: '', label: '— Kein Auftrag —' }, ...orders.map(o => ({ value: o.id, label: o.title }))]

  return (
    <Card>
      <h3 className="mb-3 text-lg font-semibold text-slate-900">Lagerbewegung erfassen</h3>
      <form action={action} className="grid gap-3 sm:grid-cols-2">
        <Select label="Typ" name="type" options={[
          { value: 'in', label: 'Eingang (Lieferung)' },
          { value: 'out', label: 'Ausgang (Entnahme)' },
          { value: 'return', label: 'Rückgabe' },
        ]} />
        <Input label="Menge" name="quantity" type="number" step="0.01" required />
        <Select label="Baustelle" name="site_id" options={siteOptions} />
        <Select label="Für Auftrag (optional)" name="order_id" options={orderOptions} />
        <Input
          label="Einzelpreis (€)"
          name="unit_price"
          type="number"
          step="0.01"
          placeholder="0.00"
          defaultValue={defaultUnitPrice != null ? String(defaultUnitPrice) : ''}
        />
        <Input label="Notiz" name="notes" placeholder="z.B. Lieferschein-Nr." />
        {state?.message && <p className={`text-xs sm:col-span-2 ${state.success ? 'text-emerald-600' : 'text-red-600'}`}>{state.message}</p>}
        <div className="sm:col-span-2">
          <Button type="submit" disabled={pending} size="sm">{pending ? 'Speichern...' : 'Bewegung erfassen'}</Button>
        </div>
      </form>
    </Card>
  )
}
