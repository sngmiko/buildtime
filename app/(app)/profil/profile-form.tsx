'use client'

import { useActionState } from 'react'
import { updateProfile, type ProfileState } from '@/actions/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Profile } from '@/lib/types'

export function ProfileForm({ profile, email }: { profile: Profile; email: string }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(updateProfile, null)

  return (
    <form action={action} className="flex flex-col gap-4">
      <Input label="E-Mail" value={email} disabled />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Vorname"
          name="first_name"
          defaultValue={profile.first_name}
          required
          error={state?.errors?.first_name?.[0]}
        />
        <Input
          label="Nachname"
          name="last_name"
          defaultValue={profile.last_name}
          required
          error={state?.errors?.last_name?.[0]}
        />
      </div>
      <Input
        label="Telefon"
        name="phone"
        type="tel"
        defaultValue={profile.phone || ''}
        error={state?.errors?.phone?.[0]}
      />
      {state?.message && (
        <p className={`text-sm ${state.success ? 'text-green-600' : 'text-red-600'}`}>
          {state.message}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? 'Speichern...' : 'Profil speichern'}
      </Button>
    </form>
  )
}
