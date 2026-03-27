'use client'

import { useActionState, useState } from 'react'
import { adminCreateCompany, type AdminState } from '@/actions/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Plus, Trash2, Copy, Check, UserPlus } from 'lucide-react'

export function AdminCreateForm() {
  const [state, action, pending] = useActionState<AdminState, FormData>(adminCreateCompany, null)
  const [copied, setCopied] = useState(false)
  const [employees, setEmployees] = useState<{ firstName: string; lastName: string; email: string; role: string }[]>([])

  async function copyLink() {
    if (state?.inviteLink) {
      await navigator.clipboard.writeText(state.inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  function addEmployee() {
    setEmployees([...employees, { firstName: '', lastName: '', email: '', role: 'worker' }])
  }

  function removeEmployee(index: number) {
    setEmployees(employees.filter((_, i) => i !== index))
  }

  function updateEmployee(index: number, field: string, value: string) {
    const updated = [...employees]
    updated[index] = { ...updated[index], [field]: value }
    setEmployees(updated)
  }

  if (state?.success && state.inviteLink) {
    return (
      <div className="flex flex-col gap-6">
        <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-6 text-center">
          <Check className="mx-auto mb-3 h-12 w-12 text-emerald-500" />
          <h3 className="text-lg font-bold text-emerald-800">Firma erfolgreich erstellt!</h3>
          <p className="mt-1 text-sm text-emerald-600">Der Firmeninhaber kann sich jetzt einrichten.</p>
        </div>

        <Card>
          <h4 className="mb-3 font-semibold text-slate-900">Einladungslink für den Inhaber</h4>
          <div className="flex gap-2">
            <input readOnly value={state.inviteLink} className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-mono" />
            <Button type="button" variant="outline" onClick={copyLink}>
              <Copy className="h-4 w-4" /> {copied ? 'Kopiert!' : 'Kopieren'}
            </Button>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Senden Sie diesen Link per E-Mail oder WhatsApp an den Firmeninhaber.
            Über den Link kann er sein Passwort setzen und mit dem Onboarding starten.
          </p>
        </Card>

        <Button onClick={() => window.location.reload()} variant="outline">Weitere Firma anlegen</Button>
      </div>
    )
  }

  return (
    <form action={action} className="flex flex-col gap-6">
      {/* Section 1: Firmendaten */}
      <Card>
        <h3 className="mb-4 text-lg font-semibold text-slate-900">1. Firmendaten</h3>
        <div className="flex flex-col gap-4">
          <Input label="Firmenname *" name="name" required placeholder="Muster Bau GmbH" />
          <Select label="Rechtsform" name="legal_form" options={[
            { value: '', label: 'Bitte wählen...' },
            { value: 'einzelunternehmen', label: 'Einzelunternehmen' },
            { value: 'gbr', label: 'GbR (Gesellschaft bürgerlichen Rechts)' },
            { value: 'gmbh', label: 'GmbH' },
            { value: 'ug', label: 'UG (haftungsbeschränkt)' },
            { value: 'gmbh_co_kg', label: 'GmbH & Co. KG' },
            { value: 'kg', label: 'KG (Kommanditgesellschaft)' },
            { value: 'ag', label: 'AG (Aktiengesellschaft)' },
            { value: 'other', label: 'Sonstige' },
          ]} />
          <Input label="Adresse" name="address" placeholder="Musterstraße 1, 12345 Berlin" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Steuernummer" name="tax_id" placeholder="DE123456789" />
            <Input label="Handelsregister-Nr." name="trade_register" placeholder="HRB 12345" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Handwerkskammer-Nr." name="trade_license" placeholder="HWK-12345" />
            <Input label="Telefon" name="company_phone" placeholder="+49 30 1234567" />
          </div>
        </div>
      </Card>

      {/* Section 2: Plan */}
      <Card>
        <h3 className="mb-4 text-lg font-semibold text-slate-900">2. Plan & Abrechnung</h3>
        <Select label="Plan *" name="plan" options={[
          { value: 'trial', label: 'Trial — 7 Tage kostenlos, max 5 Mitarbeiter' },
          { value: 'starter', label: 'Starter — 49€/Monat, max 10 Mitarbeiter' },
          { value: 'business', label: 'Business — 99€/Monat, max 30 Mitarbeiter' },
          { value: 'enterprise', label: 'Enterprise — 199€/Monat, max 100 Mitarbeiter' },
        ]} />
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Select label="Teamgröße (geschätzt)" name="team_size" options={[
            { value: '', label: 'Bitte wählen...' },
            { value: '1-5', label: '1–5 Mitarbeiter' },
            { value: '6-15', label: '6–15 Mitarbeiter' },
            { value: '16-30', label: '16–30 Mitarbeiter' },
            { value: '31-50', label: '31–50 Mitarbeiter' },
            { value: '51-100', label: '51–100 Mitarbeiter' },
          ]} />
          <Select label="Branche" name="industry" options={[
            { value: '', label: 'Bitte wählen...' },
            { value: 'hochbau', label: 'Hochbau' },
            { value: 'tiefbau', label: 'Tiefbau' },
            { value: 'ausbau', label: 'Ausbau / Innenausbau' },
            { value: 'dach', label: 'Dachdeckerei / Zimmerei' },
            { value: 'elektro', label: 'Elektroinstallation' },
            { value: 'sanitaer', label: 'Sanitär / Heizung / Klima' },
            { value: 'maler', label: 'Maler / Lackierer' },
            { value: 'gala', label: 'Garten- und Landschaftsbau' },
            { value: 'strassenbau', label: 'Straßenbau' },
            { value: 'abbruch', label: 'Abbruch / Rückbau' },
            { value: 'geruestbau', label: 'Gerüstbau' },
            { value: 'other', label: 'Sonstiges Baugewerk' },
          ]} />
        </div>
      </Card>

      {/* Section 3: Firmeninhaber */}
      <Card>
        <h3 className="mb-4 text-lg font-semibold text-slate-900">3. Firmeninhaber / Geschäftsführer</h3>
        <p className="mb-3 text-sm text-slate-500">Diese Person erhält den Einladungslink und wird als Inhaber angelegt.</p>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Vorname *" name="owner_first_name" required placeholder="Max" />
            <Input label="Nachname *" name="owner_last_name" required placeholder="Mustermann" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="E-Mail *" name="owner_email" type="email" required placeholder="max@musterbau.de" />
            <Input label="Telefon" name="owner_phone" placeholder="+49 170 1234567" />
          </div>
        </div>
      </Card>

      {/* Section 4: Weitere Mitarbeiter */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">4. Mitarbeiter vorab anlegen</h3>
            <p className="text-sm text-slate-500">Optional — Mitarbeiter können auch später eingeladen werden.</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addEmployee}>
            <Plus className="h-4 w-4" /> Mitarbeiter
          </Button>
        </div>

        {employees.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-slate-200 py-8 text-center">
            <UserPlus className="mx-auto mb-2 h-8 w-8 text-slate-300" />
            <p className="text-sm text-slate-400">Klicken Sie auf &quot;+ Mitarbeiter&quot; um Mitarbeiter vorab anzulegen</p>
          </div>
        ) : (
          <div className="space-y-3">
            {employees.map((emp, i) => (
              <div key={i} className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex-1 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <input
                    name={`emp_first_name_${i}`}
                    value={emp.firstName}
                    onChange={(e) => updateEmployee(i, 'firstName', e.target.value)}
                    placeholder="Vorname"
                    className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm"
                  />
                  <input
                    name={`emp_last_name_${i}`}
                    value={emp.lastName}
                    onChange={(e) => updateEmployee(i, 'lastName', e.target.value)}
                    placeholder="Nachname"
                    className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm"
                  />
                  <input
                    name={`emp_email_${i}`}
                    value={emp.email}
                    onChange={(e) => updateEmployee(i, 'email', e.target.value)}
                    placeholder="E-Mail (optional)"
                    className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm"
                  />
                  <select
                    name={`emp_role_${i}`}
                    value={emp.role}
                    onChange={(e) => updateEmployee(i, 'role', e.target.value)}
                    className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm"
                  >
                    <option value="worker">Arbeiter</option>
                    <option value="foreman">Bauleiter</option>
                  </select>
                </div>
                <button type="button" onClick={() => removeEmployee(i)} className="mt-1 rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
        <input type="hidden" name="employee_count" value={employees.length} />
      </Card>

      {/* Section 5: Notizen */}
      <Card>
        <h3 className="mb-4 text-lg font-semibold text-slate-900">5. Interne Notizen</h3>
        <textarea
          name="admin_notes"
          rows={3}
          placeholder="Interne Notizen zum Kunden (nur für Nomad Solutions sichtbar)..."
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm placeholder:text-slate-400 focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
        />
      </Card>

      {state?.message && !state.success && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{state.message}</div>
      )}

      <Button type="submit" disabled={pending} size="lg" className="w-full">
        {pending ? 'Firma wird erstellt...' : 'Firma erstellen & Einladungslink generieren'}
      </Button>
    </form>
  )
}
