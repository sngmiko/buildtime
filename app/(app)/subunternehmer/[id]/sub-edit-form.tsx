'use client'

import { useActionState } from 'react'
import { updateSubcontractor, type SubcontractorsState } from '@/actions/subcontractors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Subcontractor } from '@/lib/types'

export function SubEditForm({ sub }: { sub: Subcontractor }) {
  const boundUpdate = updateSubcontractor.bind(null, sub.id)
  const [state, action, pending] = useActionState<SubcontractorsState, FormData>(boundUpdate, null)

  return (
    <form action={action} className="flex flex-col gap-4">
      <Input label="Name" name="name" defaultValue={sub.name} required error={state?.errors?.name?.[0]} />
      <Input label="Gewerk" name="trade" defaultValue={sub.trade || ''} />
      <Input label="Ansprechpartner" name="contact_person" defaultValue={sub.contact_person || ''} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="E-Mail" name="email" type="email" defaultValue={sub.email || ''} />
        <Input label="Telefon" name="phone" defaultValue={sub.phone || ''} />
      </div>
      <Input label="Adresse" name="address" defaultValue={sub.address || ''} />
      <Input label="§48b gültig bis" name="tax_exemption_valid_until" type="date" defaultValue={sub.tax_exemption_valid_until || ''} />
      <h4 className="mt-2 font-medium text-slate-700">Bewertung (1-5)</h4>
      <div className="grid grid-cols-3 gap-3">
        <Input label="Qualität" name="quality_rating" type="number" min="1" max="5" defaultValue={sub.quality_rating?.toString() || ''} />
        <Input label="Zuverlässigkeit" name="reliability_rating" type="number" min="1" max="5" defaultValue={sub.reliability_rating?.toString() || ''} />
        <Input label="Preis" name="price_rating" type="number" min="1" max="5" defaultValue={sub.price_rating?.toString() || ''} />
      </div>
      <Input label="Notizen" name="notes" defaultValue={sub.notes || ''} />
      {state?.message && <p className={`text-sm ${state.success ? 'text-emerald-600' : 'text-red-600'}`}>{state.message}</p>}
      <Button type="submit" disabled={pending}>{pending ? 'Speichern...' : 'Speichern'}</Button>
    </form>
  )
}
