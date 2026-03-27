'use client'

import { useActionState, useState } from 'react'
import { adminCreateCompany, type AdminState } from '@/actions/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

export function AdminCreateForm() {
  const [state, action, pending] = useActionState<AdminState, FormData>(adminCreateCompany, null)
  const [copied, setCopied] = useState(false)

  async function copyLink() {
    if (state?.inviteLink) {
      await navigator.clipboard.writeText(state.inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (state?.success && state.inviteLink) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-emerald-600 font-medium">Firma erfolgreich erstellt!</p>
        <p className="text-sm text-slate-600">Einladungslink für den Firmeninhaber:</p>
        <div className="flex gap-2">
          <input readOnly value={state.inviteLink} className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm" />
          <Button type="button" variant="outline" onClick={copyLink}>{copied ? 'Kopiert!' : 'Kopieren'}</Button>
        </div>
        <p className="text-xs text-slate-400">Der Inhaber kann über diesen Link sein Passwort setzen und mit dem Onboarding starten.</p>
      </div>
    )
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <h3 className="font-semibold text-slate-900">Firmendaten</h3>
      <Input label="Firmenname" name="name" required />
      <Select label="Plan" name="plan" options={[
        { value: 'trial', label: 'Trial (7 Tage, max 5 MA)' },
        { value: 'starter', label: 'Starter (49€/Monat, max 10 MA)' },
        { value: 'business', label: 'Business (99€/Monat, max 30 MA)' },
        { value: 'enterprise', label: 'Enterprise (199€/Monat, max 100 MA)' },
      ]} />
      <h3 className="mt-2 font-semibold text-slate-900">Firmeninhaber</h3>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Vorname" name="owner_first_name" required />
        <Input label="Nachname" name="owner_last_name" required />
      </div>
      <Input label="E-Mail" name="owner_email" type="email" required />
      {state?.message && !state.success && <p className="text-sm text-red-600">{state.message}</p>}
      <Button type="submit" disabled={pending}>{pending ? 'Erstellen...' : 'Firma erstellen & Einladung generieren'}</Button>
    </form>
  )
}
