'use client'

import { useActionState } from 'react'
import { createOrder, type InventoryState } from '@/actions/inventory'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type { Supplier } from '@/lib/types'

export function OrderForm({
  suppliers,
  activeOrders,
}: {
  suppliers: Supplier[]
  activeOrders: { id: string; title: string }[]
}) {
  const [state, action, pending] = useActionState<InventoryState, FormData>(createOrder, null)

  const today = new Date().toISOString().split('T')[0]

  const supplierOptions = [
    { value: '', label: '— Kein Lieferant —' },
    ...suppliers.map(s => ({ value: s.id, label: s.name })),
  ]

  const orderOptions = [
    { value: '', label: '— Kein Auftrag —' },
    ...activeOrders.map(o => ({ value: o.id, label: o.title })),
  ]

  return (
    <form action={action} className="flex flex-col gap-4">
      <Select
        label="Lieferant"
        name="supplier_id"
        options={supplierOptions}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Bestelldatum"
          name="order_date"
          type="date"
          required
          defaultValue={today}
          error={state?.errors?.order_date?.[0]}
        />
        <Input
          label="Gesamtbetrag (€)"
          name="total_amount"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          error={state?.errors?.total_amount?.[0]}
        />
      </div>
      <Select
        label="Für Auftrag (optional)"
        name="order_id"
        options={orderOptions}
      />
      <Input
        label="Notizen"
        name="notes"
        placeholder="Optionale Notizen zur Bestellung..."
      />
      {state?.message && <p className="text-sm text-red-600">{state.message}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? 'Erstellen...' : 'Bestellung erstellen'}
      </Button>
    </form>
  )
}
