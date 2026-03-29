'use client'

import { useActionState } from 'react'
import { acceptInvite, type AuthState } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function AcceptInviteForm({
  token,
  defaultEmail,
  firstName,
  lastName,
  companyName,
}: {
  token: string
  defaultEmail?: string
  firstName?: string
  lastName?: string
  companyName: string
}) {
  const boundAcceptInvite = acceptInvite.bind(null, token)
  const [state, action, pending] = useActionState<AuthState, FormData>(boundAcceptInvite, null)

  return (
    <form action={action} className="flex flex-col gap-4">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Sie wurden eingeladen, <strong>{companyName}</strong> auf NomadWorks beizutreten.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Vorname"
          name="first_name"
          defaultValue={firstName}
          required
        />
        <Input
          label="Nachname"
          name="last_name"
          defaultValue={lastName}
          required
        />
      </div>
      <Input
        label="E-Mail"
        name="email"
        type="email"
        placeholder="ihre@email.de"
        defaultValue={defaultEmail}
        required
        error={state?.errors?.email?.[0]}
      />
      <Input
        label="Passwort festlegen"
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
        {pending ? 'Konto erstellen...' : 'Konto erstellen & loslegen'}
      </Button>
    </form>
  )
}
