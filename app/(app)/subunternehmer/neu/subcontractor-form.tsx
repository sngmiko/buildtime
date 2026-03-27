'use client'

import { useActionState } from 'react'
import { createSubcontractor, type SubcontractorsState } from '@/actions/subcontractors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

const RATING_OPTIONS = [
  { value: '', label: '— Keine Bewertung —' },
  { value: '1', label: '★ (1)' },
  { value: '2', label: '★★ (2)' },
  { value: '3', label: '★★★ (3)' },
  { value: '4', label: '★★★★ (4)' },
  { value: '5', label: '★★★★★ (5)' },
]

export function SubcontractorForm() {
  const [state, action, pending] = useActionState<SubcontractorsState, FormData>(createSubcontractor, null)

  return (
    <form action={action} className="flex flex-col gap-4">
      <Input
        label="Firmenname"
        name="name"
        required
        placeholder="z. B. Dachbau Müller GmbH"
        error={state?.errors?.name?.[0]}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input label="Ansprechpartner" name="contact_person" placeholder="Max Mustermann" />
        <Input label="Gewerk / Fachbereich" name="trade" placeholder="z. B. Dachdecker" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="E-Mail"
          name="email"
          type="email"
          placeholder="info@firma.de"
          error={state?.errors?.email?.[0]}
        />
        <Input label="Telefon" name="phone" placeholder="030 123456" />
      </div>

      <Input label="Adresse" name="address" placeholder="Musterstraße 1, 10115 Berlin" />

      <Input
        label="Steuerliche Freistellung gültig bis"
        name="tax_exemption_valid_until"
        type="date"
      />

      <div className="border-t border-slate-100 pt-4">
        <p className="mb-3 text-sm font-medium text-slate-700">Bewertung</p>
        <div className="grid grid-cols-3 gap-3">
          <Select label="Qualität" name="quality_rating" options={RATING_OPTIONS} />
          <Select label="Zuverlässigkeit" name="reliability_rating" options={RATING_OPTIONS} />
          <Select label="Preis" name="price_rating" options={RATING_OPTIONS} />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Notizen</label>
        <textarea
          name="notes"
          rows={3}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-1 focus:ring-[#1e3a5f]"
          placeholder="Interne Anmerkungen..."
        />
      </div>

      {state?.message && <p className="text-sm text-red-600">{state.message}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? 'Speichern...' : 'Subunternehmer anlegen'}
      </Button>
    </form>
  )
}
