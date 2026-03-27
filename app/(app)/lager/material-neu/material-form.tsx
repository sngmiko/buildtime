'use client'

import { useActionState } from 'react'
import { createMaterial, type InventoryState } from '@/actions/inventory'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type { Supplier } from '@/lib/types'

export function MaterialForm({ suppliers }: { suppliers: Supplier[] }) {
  const [state, action, pending] = useActionState<InventoryState, FormData>(createMaterial, null)

  const supplierOptions = [
    { value: '', label: '— Kein Lieferant —' },
    ...suppliers.map(s => ({ value: s.id, label: s.name })),
  ]

  return (
    <form action={action} className="flex flex-col gap-4">
      <Input
        label="Name"
        name="name"
        required
        placeholder="z. B. Zement CEM I 42,5"
        error={state?.errors?.name?.[0]}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Artikelnummer"
          name="article_number"
          placeholder="z. B. ZEM-001"
        />
        <Select
          label="Kategorie"
          name="category"
          options={[
            { value: 'building_material', label: 'Baumaterial' },
            { value: 'consumable', label: 'Verbrauchsmaterial' },
            { value: 'tool', label: 'Werkzeug' },
            { value: 'small_parts', label: 'Kleinteile' },
            { value: 'other', label: 'Sonstiges' },
          ]}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Einheit"
          name="unit"
          options={[
            { value: 'piece', label: 'Stück' },
            { value: 'm', label: 'Meter (m)' },
            { value: 'm2', label: 'Quadratmeter (m²)' },
            { value: 'm3', label: 'Kubikmeter (m³)' },
            { value: 'kg', label: 'Kilogramm (kg)' },
            { value: 'l', label: 'Liter (l)' },
            { value: 'pack', label: 'Packung' },
          ]}
        />
        <Input
          label="Preis pro Einheit (€)"
          name="price_per_unit"
          type="number"
          step="0.01"
          min="0"
          error={state?.errors?.price_per_unit?.[0]}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Mindestbestand"
          name="min_stock"
          type="number"
          step="0.01"
          min="0"
          defaultValue="0"
          error={state?.errors?.min_stock?.[0]}
        />
        <Input
          label="Aktueller Bestand"
          name="current_stock"
          type="number"
          step="0.01"
          min="0"
          defaultValue="0"
          error={state?.errors?.current_stock?.[0]}
        />
      </div>
      <Select
        label="Lieferant"
        name="supplier_id"
        options={supplierOptions}
      />
      {state?.message && <p className="text-sm text-red-600">{state.message}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? 'Erstellen...' : 'Material erstellen'}
      </Button>
    </form>
  )
}
