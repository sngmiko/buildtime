'use client'

import { useActionState } from 'react'
import { updateMaterial, type InventoryState } from '@/actions/inventory'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type { Material, Supplier } from '@/lib/types'

type Props = {
  material: Material
  suppliers: Supplier[]
}

export function MaterialEditForm({ material, suppliers }: Props) {
  const boundUpdate = updateMaterial.bind(null, material.id)
  const [state, action, pending] = useActionState<InventoryState, FormData>(boundUpdate, null)

  const supplierOptions = [
    { value: '', label: '— Kein Lieferant —' },
    ...suppliers.map(s => ({ value: s.id, label: s.name })),
  ]

  return (
    <form action={action} className="flex flex-col gap-4">
      <Input
        label="Name"
        name="name"
        defaultValue={material.name}
        required
        error={state?.errors?.name?.[0]}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Artikelnummer"
          name="article_number"
          defaultValue={material.article_number || ''}
        />
        <Select
          label="Kategorie"
          name="category"
          defaultValue={material.category}
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
          defaultValue={material.unit}
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
          defaultValue={material.price_per_unit?.toString() || ''}
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
          defaultValue={String(material.min_stock)}
          error={state?.errors?.min_stock?.[0]}
        />
        <Input
          label="Aktueller Bestand"
          name="current_stock"
          type="number"
          step="0.01"
          min="0"
          defaultValue={String(material.current_stock)}
          error={state?.errors?.current_stock?.[0]}
        />
      </div>
      <Select
        label="Lieferant"
        name="supplier_id"
        defaultValue={material.supplier_id || ''}
        options={supplierOptions}
      />
      {state?.message && (
        <p className={`text-sm ${state.success ? 'text-emerald-600' : 'text-red-600'}`}>
          {state.message}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? 'Speichern...' : 'Material speichern'}
      </Button>
    </form>
  )
}
