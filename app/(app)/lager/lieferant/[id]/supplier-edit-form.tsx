'use client'

import { useActionState } from 'react'
import { updateSupplier, type InventoryState } from '@/actions/inventory'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type { Supplier } from '@/lib/types'

export function SupplierEditForm({ supplier }: { supplier: Supplier }) {
  const boundUpdate = updateSupplier.bind(null, supplier.id)
  const [state, action, pending] = useActionState<InventoryState, FormData>(boundUpdate, null)

  return (
    <form action={action} className="flex flex-col gap-4">
      <Input
        label="Name"
        name="name"
        defaultValue={supplier.name}
        required
        error={state?.errors?.name?.[0]}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Ansprechpartner"
          name="contact_person"
          defaultValue={supplier.contact_person || ''}
        />
        <Select
          label="Bewertung"
          name="rating"
          defaultValue={supplier.rating?.toString() || ''}
          options={[
            { value: '', label: '— Keine Bewertung —' },
            { value: '1', label: '★ (1)' },
            { value: '2', label: '★★ (2)' },
            { value: '3', label: '★★★ (3)' },
            { value: '4', label: '★★★★ (4)' },
            { value: '5', label: '★★★★★ (5)' },
          ]}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="E-Mail"
          name="email"
          type="email"
          defaultValue={supplier.email || ''}
          error={state?.errors?.email?.[0]}
        />
        <Input
          label="Telefon"
          name="phone"
          type="tel"
          defaultValue={supplier.phone || ''}
        />
      </div>
      <Input
        label="Adresse"
        name="address"
        defaultValue={supplier.address || ''}
      />
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-700">Notizen</label>
        <textarea
          name="notes"
          rows={3}
          defaultValue={supplier.notes || ''}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-1 focus:ring-[#1e3a5f]"
        />
      </div>
      {state?.message && (
        <p className={`text-sm ${state.success ? 'text-emerald-600' : 'text-red-600'}`}>
          {state.message}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? 'Speichern...' : 'Lieferant speichern'}
      </Button>
    </form>
  )
}
