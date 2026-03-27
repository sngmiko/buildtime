'use client'

import { useActionState } from 'react'
import { createInvoice, type InvoiceState } from '@/actions/invoices'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type { Customer, Order } from '@/lib/types'

type Props = {
  customers: Customer[]
  orders: Order[]
}

export function InvoiceForm({ customers, orders }: Props) {
  const [state, action, pending] = useActionState<InvoiceState, FormData>(createInvoice, null)

  const today = new Date().toISOString().split('T')[0]

  return (
    <form action={action} className="flex flex-col gap-4">
      <Select
        label="Kunde"
        name="customer_id"
        required
        options={[
          { value: '', label: '— Kunde auswählen —' },
          ...customers.map((c) => ({ value: c.id, label: c.name })),
        ]}
        error={state?.errors?.customer_id?.[0]}
      />
      {orders.length > 0 && (
        <Select
          label="Verknüpfter Auftrag (optional)"
          name="order_id"
          options={[
            { value: '', label: '— Kein Auftrag —' },
            ...orders.map((o) => ({ value: o.id, label: o.title })),
          ]}
        />
      )}
      <Input
        label="Rechnungsdatum"
        name="invoice_date"
        type="date"
        defaultValue={today}
        required
        error={state?.errors?.invoice_date?.[0]}
      />
      <Input
        label="Zahlungsziel (optional)"
        name="due_date"
        type="date"
        error={state?.errors?.due_date?.[0]}
      />
      <Select
        label="Mehrwertsteuersatz"
        name="tax_rate"
        defaultValue="19"
        options={[
          { value: '19', label: '19% (Regelsteuersatz)' },
          { value: '7', label: '7% (ermäßigt)' },
          { value: '0', label: '0% (steuerfrei)' },
        ]}
        error={state?.errors?.tax_rate?.[0]}
      />
      <Input
        label="Hinweise (optional)"
        name="notes"
        error={state?.errors?.notes?.[0]}
      />
      {state?.message && (
        <p className={`text-sm ${state.success ? 'text-emerald-600' : 'text-red-600'}`}>
          {state.message}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? 'Erstellen...' : 'Rechnung erstellen'}
      </Button>
    </form>
  )
}
