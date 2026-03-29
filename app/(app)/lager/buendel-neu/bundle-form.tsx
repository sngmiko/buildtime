'use client'

import { useActionState, useState } from 'react'
import { createBundle, type BundleState } from '@/actions/bundles'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type { Material } from '@/lib/types'

const UNIT_LABELS: Record<string, string> = {
  piece: 'Stk', m: 'm', m2: 'm²', m3: 'm³', kg: 'kg', l: 'l', pack: 'Pack.',
}

type BundleItem = { materialId: string; quantity: number }

export function BundleForm({ materials }: { materials: Material[] }) {
  const [state, action, pending] = useActionState<BundleState, FormData>(createBundle, null)
  const [items, setItems] = useState<BundleItem[]>([{ materialId: '', quantity: 1 }])

  const addItem = () => setItems(prev => [...prev, { materialId: '', quantity: 1 }])
  const removeItem = (index: number) => setItems(prev => prev.filter((_, i) => i !== index))
  const updateItem = (index: number, field: keyof BundleItem, value: string | number) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <Input label="Bündel-Name *" name="name" required placeholder="z.B. Trockenbau Basis-Set" />
      <Input label="Beschreibung" name="description" placeholder="Kurze Beschreibung" />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Materialien</h3>
          <button
            type="button"
            onClick={addItem}
            className="text-sm text-[#1e3a5f] hover:underline font-medium"
          >
            + Position hinzufügen
          </button>
        </div>

        {items.map((item, i) => (
          <div key={i} className="flex items-end gap-2">
            {/* Hidden inputs for form submission */}
            <input type="hidden" name={`item_material_${i}`} value={item.materialId} />
            <input type="hidden" name={`item_quantity_${i}`} value={item.quantity} />

            <div className="flex-1">
              <Select
                label={i === 0 ? 'Material' : '\u00a0'}
                name={`_item_material_display_${i}`}
                value={item.materialId}
                onChange={(e) => updateItem(i, 'materialId', e.target.value)}
                options={[
                  { value: '', label: 'Material auswählen...' },
                  ...materials.map(m => ({
                    value: m.id,
                    label: `${m.name} (${m.current_stock} ${UNIT_LABELS[m.unit] || m.unit})`,
                  })),
                ]}
              />
            </div>

            <div className="w-24">
              <Input
                label={i === 0 ? 'Menge' : '\u00a0'}
                type="number"
                min="0.01"
                step="0.01"
                value={item.quantity}
                onChange={(e) => updateItem(i, 'quantity', parseFloat(e.target.value) || 1)}
                name={`_item_quantity_display_${i}`}
              />
            </div>

            {items.length > 1 && (
              <button
                type="button"
                onClick={() => removeItem(i)}
                className="mb-1 flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      {state?.message && (
        <p className={`text-sm ${state.success ? 'text-emerald-600' : 'text-red-600'}`}>
          {state.message}
        </p>
      )}
      <Button type="submit" disabled={pending} size="lg" className="w-full">
        {pending ? 'Erstellen...' : 'Bündel erstellen'}
      </Button>
    </form>
  )
}
