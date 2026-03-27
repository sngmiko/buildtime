'use client'

import { useActionState } from 'react'
import { createAssignment, type SubcontractorsState } from '@/actions/subcontractors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card } from '@/components/ui/card'

export function AddAssignmentForm({ subId, orders }: { subId: string; orders: { id: string; title: string }[] }) {
  const boundCreate = createAssignment.bind(null, subId)
  const [state, action, pending] = useActionState<SubcontractorsState, FormData>(boundCreate, null)

  return (
    <Card>
      <h3 className="mb-3 text-lg font-semibold text-slate-900">Neuen Einsatz / Rechnung erfassen</h3>
      <form action={action} className="flex flex-col gap-3">
        <Select label="Auftrag" name="order_id" options={[
          { value: '', label: 'Auftrag wählen...' },
          ...orders.map(o => ({ value: o.id, label: o.title })),
        ]} error={state?.errors?.order_id?.[0]} />
        <Input label="Beschreibung / Leistung" name="description" required placeholder="z.B. Estricharbeiten EG" error={state?.errors?.description?.[0]} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Vereinbarter Betrag (€)" name="agreed_amount" type="number" step="0.01" placeholder="5000.00" />
          <Input label="Rechnungsbetrag (€)" name="invoiced_amount" type="number" step="0.01" placeholder="0.00" />
        </div>
        {state?.message && <p className={`text-sm ${state.success ? 'text-emerald-600' : 'text-red-600'}`}>{state.message}</p>}
        <Button type="submit" disabled={pending}>{pending ? 'Speichern...' : 'Einsatz erfassen'}</Button>
      </form>
    </Card>
  )
}
