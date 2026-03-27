'use client'

import { useActionState } from 'react'
import { updateSite, type SiteState } from '@/actions/sites'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type { ConstructionSite } from '@/lib/types'

export function EditSiteForm({ site }: { site: ConstructionSite }) {
  const boundUpdateSite = updateSite.bind(null, site.id)
  const [state, action, pending] = useActionState<SiteState, FormData>(boundUpdateSite, null)

  return (
    <form action={action} className="flex flex-col gap-4">
      <Input
        label="Name der Baustelle"
        name="name"
        defaultValue={site.name}
        required
        error={state?.errors?.name?.[0]}
      />
      <Input
        label="Adresse (optional)"
        name="address"
        defaultValue={site.address || ''}
        error={state?.errors?.address?.[0]}
      />
      <Select
        label="Status"
        name="status"
        defaultValue={site.status}
        options={[
          { value: 'active', label: 'Aktiv' },
          { value: 'paused', label: 'Pausiert' },
          { value: 'completed', label: 'Abgeschlossen' },
        ]}
        error={state?.errors?.status?.[0]}
      />
      {state?.message && (
        <p className={`text-sm ${state.success ? 'text-emerald-600' : 'text-red-600'}`}>
          {state.message}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? 'Speichern...' : 'Baustelle speichern'}
      </Button>
    </form>
  )
}
