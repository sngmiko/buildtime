'use client'

import { useActionState } from 'react'
import { createEmployee, type EmployeeState } from '@/actions/employee'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { CheckCircle } from 'lucide-react'

export function CreateEmployeeForm() {
  const [state, action, pending] = useActionState<EmployeeState, FormData>(createEmployee, null)

  if (state?.success) {
    return (
      <div className="flex flex-col items-center gap-4 py-4">
        <CheckCircle className="h-12 w-12 text-emerald-500" />
        <p className="text-lg font-semibold text-slate-900">{state.message}</p>
        <p className="text-sm text-slate-500">Sie können ihm jetzt auf der Detail-Seite einen Account zuweisen oder Qualifikationen hinterlegen.</p>
        <div className="flex gap-3">
          <Button onClick={() => window.location.reload()}>Weiteren anlegen</Button>
          <a href="/mitarbeiter"><Button variant="outline">Zur Übersicht</Button></a>
        </div>
      </div>
    )
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <Input label="Vorname *" name="first_name" required placeholder="Max" />
        <Input label="Nachname *" name="last_name" required placeholder="Mustermann" />
      </div>
      <Input label="Telefon" name="phone" placeholder="+49 170 1234567" />
      <Select label="Rolle" name="role" options={[
        { value: 'worker', label: 'Arbeiter' },
        { value: 'foreman', label: 'Bauleiter' },
      ]} />
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <input type="checkbox" name="is_temporary" id="is_temporary" className="h-4 w-4 rounded border-slate-300" />
        <label htmlFor="is_temporary" className="text-sm text-slate-700">
          Temporärer Mitarbeiter <span className="text-slate-400">(z.B. Aushilfe, Leiharbeiter)</span>
        </label>
      </div>
      <p className="text-xs text-slate-400">
        Der Mitarbeiter wird ohne Login-Account angelegt. Sie können ihm später einen Account zuweisen, damit er sich selbst einloggen kann.
      </p>
      {state?.message && !state.success && <p className="text-sm text-red-600">{state.message}</p>}
      <Button type="submit" disabled={pending} size="lg" className="w-full">
        {pending ? 'Wird angelegt...' : 'Mitarbeiter anlegen'}
      </Button>
    </form>
  )
}
