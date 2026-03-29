'use client'

import { useActionState } from 'react'
import { updateSite, type SiteState } from '@/actions/sites'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type { ConstructionSite } from '@/lib/types'

export function EditSiteForm({ site, foremen }: { site: ConstructionSite; foremen: { id: string; name: string }[] }) {
  const boundUpdateSite = updateSite.bind(null, site.id)
  const [state, action, pending] = useActionState<SiteState, FormData>(boundUpdateSite, null)

  return (
    <form action={action} className="flex flex-col gap-4">
      <h3 className="font-semibold text-slate-900">Baustellendaten</h3>
      <Input label="Name *" name="name" defaultValue={site.name} required error={state?.errors?.name?.[0]} />
      <Input label="Beschreibung" name="description" defaultValue={site.description || ''} />
      <Input label="Adresse" name="address" defaultValue={site.address || ''} />
      <Select label="Status" name="status" defaultValue={site.status} options={[
        { value: 'active', label: 'Aktiv' }, { value: 'paused', label: 'Pausiert' }, { value: 'completed', label: 'Abgeschlossen' },
      ]} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Start" name="start_date" type="date" defaultValue={site.start_date || ''} />
        <Input label="Ende" name="end_date" type="date" defaultValue={site.end_date || ''} />
      </div>
      <Input label="Budget (€)" name="budget" type="number" step="0.01" defaultValue={site.budget?.toString() || ''} />
      <Select label="Bauleiter" name="site_manager" defaultValue={site.site_manager || ''} options={[
        { value: '', label: 'Keiner zugewiesen' },
        ...foremen.map(f => ({ value: f.id, label: f.name })),
      ]} />
      <h3 className="mt-2 font-semibold text-slate-900">Auftraggeber</h3>
      <Input label="Name / Firma" name="client_name" defaultValue={site.client_name || ''} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Telefon" name="client_phone" defaultValue={site.client_phone || ''} />
        <Input label="E-Mail" name="client_email" type="email" defaultValue={site.client_email || ''} />
      </div>
      <Input label="Notizen" name="notes" defaultValue={site.notes || ''} />

      <h3 className="mt-2 font-semibold text-slate-900">Ansprechpartner vor Ort</h3>
      <div className="grid grid-cols-3 gap-3">
        <Input label="Name" name="contact_name" placeholder="Max Müller" defaultValue={site.contact_name || ''} />
        <Input label="Telefon" name="contact_phone" placeholder="+49 170 1234567" defaultValue={site.contact_phone || ''} />
        <Input label="Rolle" name="contact_role" placeholder="Polier" defaultValue={site.contact_role || ''} />
      </div>

      {state?.message && <p className={`text-sm ${state.success ? 'text-emerald-600' : 'text-red-600'}`}>{state.message}</p>}
      <Button type="submit" disabled={pending}>{pending ? 'Speichern...' : 'Baustelle speichern'}</Button>
    </form>
  )
}
