'use client'

import { useActionState } from 'react'
import { register, type AuthState } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function RegisterForm({ defaultEmail }: { defaultEmail?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(register, null)

  return (
    <form action={action} className="flex flex-col gap-4">
      <Input
        label="Firmenname"
        name="company_name"
        placeholder="Muster Bau GmbH"
        required
        error={state?.errors?.company_name?.[0]}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Vorname"
          name="first_name"
          placeholder="Max"
          required
          error={state?.errors?.first_name?.[0]}
        />
        <Input
          label="Nachname"
          name="last_name"
          placeholder="Mustermann"
          required
          error={state?.errors?.last_name?.[0]}
        />
      </div>
      <Input
        label="E-Mail"
        name="email"
        type="email"
        placeholder="max@firma.de"
        defaultValue={defaultEmail}
        required
        error={state?.errors?.email?.[0]}
      />
      <Input
        label="Passwort"
        name="password"
        type="password"
        placeholder="Mindestens 8 Zeichen"
        required
        error={state?.errors?.password?.[0]}
      />
      {state?.message && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.message}</p>
      )}
      <Button type="submit" disabled={pending} size="lg" className="w-full">
        {pending ? 'Registrieren...' : 'Kostenlos registrieren'}
      </Button>
    </form>
  )
}
