'use client'

import { useActionState } from 'react'
import { createSite, type SiteState } from '@/actions/sites'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function SiteForm() {
  const [state, action, pending] = useActionState<SiteState, FormData>(createSite, null)

  return (
    <form action={action} className="flex flex-col gap-4">
      <Input
        label="Name der Baustelle"
        name="name"
        placeholder="z.B. Neubau Hauptstraße 5"
        required
        error={state?.errors?.name?.[0]}
      />
      <Input
        label="Adresse (optional)"
        name="address"
        placeholder="Straße, PLZ Ort"
        error={state?.errors?.address?.[0]}
      />
      {state?.message && (
        <p className="text-sm text-red-600">{state.message}</p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? 'Erstellen...' : 'Baustelle erstellen'}
      </Button>
    </form>
  )
}
