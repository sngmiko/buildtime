'use client'

import { useActionState, useState } from 'react'
import { createOrder, createCustomer, type OrdersState } from '@/actions/orders'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type { Customer, ConstructionSite } from '@/lib/types'

type Props = {
  customers: Customer[]
  sites: ConstructionSite[]
}

const STATUS_OPTIONS = [
  { value: 'quote', label: 'Angebot' },
  { value: 'commissioned', label: 'Beauftragt' },
  { value: 'in_progress', label: 'In Arbeit' },
  { value: 'acceptance', label: 'Abnahme' },
  { value: 'completed', label: 'Abgeschlossen' },
  { value: 'complaint', label: 'Reklamation' },
]

export function OrderForm({ customers, sites }: Props) {
  const [state, action, pending] = useActionState<OrdersState, FormData>(createOrder, null)
  const [showNewCustomer, setShowNewCustomer] = useState(false)
  const [customerState, customerAction, customerPending] = useActionState<OrdersState, FormData>(createCustomer, null)

  const customerOptions = [
    { value: '', label: '— Kunde wählen —' },
    ...customers.map(c => ({ value: c.id, label: c.name })),
  ]

  const siteOptions = [
    { value: '', label: '— Keine Baustelle —' },
    ...sites.map(s => ({ value: s.id, label: s.name })),
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* New Customer inline form */}
      {showNewCustomer && (
        <div className="rounded-lg border border-[#f59e0b] bg-amber-50 p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Neuen Kunden anlegen</h3>
          <form action={customerAction} className="flex flex-col gap-3">
            <Input
              label="Firmenname"
              name="name"
              required
              placeholder="z. B. Musterbau GmbH"
              error={customerState?.errors?.name?.[0]}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Ansprechpartner" name="contact_person" placeholder="Max Mustermann" />
              <Input label="E-Mail" name="email" type="email" placeholder="info@musterbau.de" error={customerState?.errors?.email?.[0]} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Telefon" name="phone" placeholder="0800 123456" />
              <Input label="Adresse" name="address" placeholder="Musterstr. 1, Berlin" />
            </div>
            {customerState?.message && <p className="text-xs text-red-600">{customerState.message}</p>}
            {customerState?.success && <p className="text-xs text-emerald-600">Kunde erstellt — bitte Seite neu laden und Kunden wählen.</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={customerPending} className="text-sm">
                {customerPending ? 'Speichern...' : 'Kunden speichern'}
              </Button>
              <Button type="button" variant="secondary" className="text-sm" onClick={() => setShowNewCustomer(false)}>
                Abbrechen
              </Button>
            </div>
          </form>
        </div>
      )}

      <form action={action} className="flex flex-col gap-4">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Select
              label="Kunde"
              name="customer_id"
              options={customerOptions}
              error={state?.errors?.customer_id?.[0]}
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            className="shrink-0 text-sm"
            onClick={() => setShowNewCustomer(v => !v)}
          >
            + Neu
          </Button>
        </div>

        <Input
          label="Titel"
          name="title"
          required
          placeholder="z. B. Dachsanierung Hauptstraße 5"
          error={state?.errors?.title?.[0]}
        />

        <Select
          label="Status"
          name="status"
          options={STATUS_OPTIONS}
        />

        <Select
          label="Baustelle (optional)"
          name="site_id"
          options={siteOptions}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input label="Startdatum" name="start_date" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
          <Input label="Enddatum" name="end_date" type="date" />
        </div>

        <Input
          label="Budget (€)"
          name="budget"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          error={state?.errors?.budget?.[0]}
        />

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Beschreibung</label>
          <textarea
            name="description"
            rows={3}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-1 focus:ring-[#1e3a5f]"
            placeholder="Projektbeschreibung..."
          />
        </div>

        {state?.message && <p className="text-sm text-red-600">{state.message}</p>}

        <Button type="submit" disabled={pending}>
          {pending ? 'Erstellen...' : 'Auftrag erstellen'}
        </Button>
      </form>
    </div>
  )
}
