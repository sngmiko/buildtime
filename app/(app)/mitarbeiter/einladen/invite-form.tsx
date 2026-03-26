'use client'

import { useActionState, useState } from 'react'
import { createInvitation, type InviteState } from '@/actions/invitations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

export function InviteForm() {
  const [state, action, pending] = useActionState<InviteState, FormData>(createInvitation, null)
  const [copied, setCopied] = useState(false)

  async function copyLink() {
    if (state?.inviteLink) {
      await navigator.clipboard.writeText(state.inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (state?.inviteLink) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-green-600 dark:text-green-400">
          Einladung erstellt! Teilen Sie den Link mit dem Mitarbeiter:
        </p>
        <div className="flex gap-2">
          <input
            readOnly
            value={state.inviteLink}
            className="flex-1 rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
          <Button type="button" variant="secondary" onClick={copyLink}>
            {copied ? 'Kopiert!' : 'Kopieren'}
          </Button>
        </div>
        <p className="text-xs text-zinc-500">
          Der Link ist 7 Tage gültig. Sie können ihn per WhatsApp oder E-Mail teilen.
        </p>
      </div>
    )
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Vorname"
          name="first_name"
          required
          error={state?.errors?.first_name?.[0]}
        />
        <Input
          label="Nachname"
          name="last_name"
          required
          error={state?.errors?.last_name?.[0]}
        />
      </div>
      <Select
        label="Rolle"
        name="role"
        options={[
          { value: 'worker', label: 'Arbeiter' },
          { value: 'foreman', label: 'Bauleiter' },
        ]}
        error={state?.errors?.role?.[0]}
      />
      <Input
        label="E-Mail (optional)"
        name="email"
        type="email"
        placeholder="wird im Einladungslink vorausgefüllt"
        error={state?.errors?.email?.[0]}
      />
      {state?.message && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.message}</p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? 'Einladung erstellen...' : 'Einladung erstellen'}
      </Button>
    </form>
  )
}
