'use client'

import { useActionState } from 'react'
import { createSupplier, type InventoryState } from '@/actions/inventory'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

export function SupplierForm() {
  const [state, action, pending] = useActionState<InventoryState, FormData>(createSupplier, null)

  return (
    <form action={action} className="flex flex-col gap-4">
      <Input
        label="Firmenname"
        name="name"
        required
        placeholder="z. B. Bauhaus GmbH"
        error={state?.errors?.name?.[0]}
      />
      <Input
        label="Ansprechpartner"
        name="contact_person"
        placeholder="Max Mustermann"
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="E-Mail"
          name="email"
          type="email"
          placeholder="info@lieferant.de"
          error={state?.errors?.email?.[0]}
        />
        <Input
          label="Telefon"
          name="phone"
          type="tel"
          placeholder="+49 30 123456"
        />
      </div>
      <Input
        label="Adresse"
        name="address"
        placeholder="Musterstraße 1, 10115 Berlin"
      />
      <Select
        label="Bewertung"
        name="rating"
        options={[
          { value: '', label: '— Keine Bewertung —' },
          { value: '1', label: '★ (1/5)' },
          { value: '2', label: '★★ (2/5)' },
          { value: '3', label: '★★★ (3/5)' },
          { value: '4', label: '★★★★ (4/5)' },
          { value: '5', label: '★★★★★ (5/5)' },
        ]}
      />
      <Input
        label="Notizen"
        name="notes"
        placeholder="Optionale Notizen..."
      />
      {state?.message && <p className="text-sm text-red-600">{state.message}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? 'Erstellen...' : 'Lieferant erstellen'}
      </Button>
    </form>
  )
}
