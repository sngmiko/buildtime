'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useState } from 'react'

export function AdminSettingsForm() {
  const [saved, setSaved] = useState(false)

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-2">
      <Select
        label="Standard-Plan für neue Firmen"
        name="default_plan"
        defaultValue="trial"
        options={[
          { value: 'trial', label: 'Trial (7 Tage)' },
          { value: 'starter', label: 'Starter (49€)' },
          { value: 'business', label: 'Business (99€)' },
          { value: 'enterprise', label: 'Enterprise (199€)' },
        ]}
      />
      <Input label="Trial-Dauer (Tage)" name="trial_days" type="number" defaultValue="7" />
      <Input label="Standard-Steuersatz (%)" name="default_tax_rate" type="number" step="0.01" defaultValue="19" />
      <Input label="Standard-Zahlungsziel (Tage)" name="payment_terms" type="number" defaultValue="14" />
      <Input label="Rechnungs-Präfix" name="invoice_prefix" defaultValue="RE" />
      <Select
        label="Standard-Währung"
        name="currency"
        defaultValue="EUR"
        options={[
          { value: 'EUR', label: 'Euro (€)' },
          { value: 'CHF', label: 'Schweizer Franken (CHF)' },
        ]}
      />
      <div className="sm:col-span-2">
        {saved && <p className="mb-2 text-sm text-emerald-600">Einstellungen gespeichert</p>}
        <Button type="submit">Einstellungen speichern</Button>
      </div>
    </form>
  )
}
