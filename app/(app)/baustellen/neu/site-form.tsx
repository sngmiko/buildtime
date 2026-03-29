'use client'

import { useActionState } from 'react'
import { createSite, type SiteState } from '@/actions/sites'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

export function SiteForm({ foremen }: { foremen: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState<SiteState, FormData>(createSite, null)

  return (
    <form action={action} className="flex flex-col gap-4">
      <h3 className="font-semibold text-slate-900">Baustellendaten</h3>
      <Input label="Name der Baustelle *" name="name" required placeholder="z.B. Neubau Hauptstraße 5" error={state?.errors?.name?.[0]} />
      <Input label="Beschreibung" name="description" placeholder="Kurze Beschreibung des Projekts" />
      <Input label="Adresse" name="address" placeholder="Straße, PLZ Ort" error={state?.errors?.address?.[0]} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Geplanter Start" name="start_date" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
        <Input label="Geplantes Ende" name="end_date" type="date" />
      </div>
      <Input label="Budget (€)" name="budget" type="number" step="0.01" placeholder="150000.00" />
      <Select label="Bauleiter" name="site_manager" options={[
        { value: '', label: 'Keiner zugewiesen' },
        ...foremen.map(f => ({ value: f.id, label: f.name })),
      ]} />

      <h3 className="mt-2 font-semibold text-slate-900">Auftraggeber</h3>
      <Input label="Name / Firma" name="client_name" placeholder="Bauherr GmbH" />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Telefon" name="client_phone" placeholder="+49 30 1234567" />
        <Input label="E-Mail" name="client_email" type="email" placeholder="bauherr@email.de" />
      </div>

      <Input label="Interne Notizen" name="notes" placeholder="Besonderheiten, Zufahrt, Schlüssel..." />

      <h3 className="mt-2 font-semibold text-slate-900">Ansprechpartner vor Ort</h3>
      <div className="grid grid-cols-3 gap-3">
        <Input label="Name" name="contact_name" placeholder="Max Müller" />
        <Input label="Telefon" name="contact_phone" placeholder="+49 170 1234567" />
        <Input label="Rolle" name="contact_role" placeholder="Polier" />
      </div>

      {state?.message && <p className={`text-sm ${state.success ? 'text-emerald-600' : 'text-red-600'}`}>{state.message}</p>}
      <Button type="submit" disabled={pending} size="lg" className="w-full">
        {pending ? 'Erstellen...' : 'Baustelle erstellen'}
      </Button>
    </form>
  )
}
