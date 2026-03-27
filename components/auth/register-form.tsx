'use client'

import { useActionState, useState } from 'react'
import { register, type AuthState } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Building2, User, Users, ChevronRight, ChevronLeft, Check } from 'lucide-react'

const STEPS = [
  { num: 1, label: 'Firma', icon: Building2 },
  { num: 2, label: 'Ihr Konto', icon: User },
  { num: 3, label: 'Team', icon: Users },
]

export function RegisterForm({ defaultEmail }: { defaultEmail?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(register, null)
  const [step, setStep] = useState(1)
  const [employees, setEmployees] = useState<{ name: string; role: string }[]>([])

  function addEmployee() {
    setEmployees([...employees, { name: '', role: 'worker' }])
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Progress */}
      <div className="flex items-center justify-between">
        {STEPS.map((s, i) => {
          const Icon = s.icon
          const done = s.num < step
          const active = s.num === step
          return (
            <div key={s.num} className="flex flex-1 items-center">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-medium ${
                done ? 'bg-emerald-500 text-white' : active ? 'bg-[#1e3a5f] text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              {i < STEPS.length - 1 && <div className={`mx-2 h-0.5 flex-1 ${done ? 'bg-emerald-500' : 'bg-slate-200'}`} />}
            </div>
          )
        })}
      </div>
      <p className="text-center text-xs text-slate-500">Schritt {step} von 3: {STEPS[step - 1].label}</p>

      <form action={action} className="flex flex-col gap-4">
        {/* Step 1: Company */}
        <div className={step === 1 ? '' : 'hidden'}>
          <div className="flex flex-col gap-4">
            <Input label="Firmenname *" name="company_name" placeholder="Muster Bau GmbH" required error={state?.errors?.company_name?.[0]} />
            <Select label="Rechtsform" name="legal_form" options={[
              { value: '', label: 'Bitte wählen...' },
              { value: 'einzelunternehmen', label: 'Einzelunternehmen' },
              { value: 'gbr', label: 'GbR' },
              { value: 'gmbh', label: 'GmbH' },
              { value: 'ug', label: 'UG (haftungsbeschränkt)' },
              { value: 'gmbh_co_kg', label: 'GmbH & Co. KG' },
              { value: 'other', label: 'Sonstige' },
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
              { value: 'other', label: 'Sonstiges Baugewerk' },
            ]} />
            <Select label="Teamgröße" name="team_size" options={[
              { value: '', label: 'Wie viele Mitarbeiter?' },
              { value: '1-5', label: '1–5 Mitarbeiter' },
              { value: '6-15', label: '6–15 Mitarbeiter' },
              { value: '16-30', label: '16–30 Mitarbeiter' },
              { value: '31-50', label: '31–50 Mitarbeiter' },
              { value: '51+', label: 'Mehr als 50' },
            ]} />
            <Input label="Adresse" name="address" placeholder="Straße, PLZ Ort" />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Steuernummer" name="tax_id" placeholder="DE123456789" />
              <Input label="Handelsregister" name="trade_register" placeholder="HRB 12345" />
            </div>
            <Button type="button" size="lg" className="w-full" onClick={() => setStep(2)}>
              Weiter <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Step 2: Account */}
        <div className={step === 2 ? '' : 'hidden'}>
          <div className="flex flex-col gap-4">
            <p className="text-sm text-slate-500">Erstellen Sie Ihr persönliches Konto als Firmeninhaber.</p>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Vorname *" name="first_name" placeholder="Max" required error={state?.errors?.first_name?.[0]} />
              <Input label="Nachname *" name="last_name" placeholder="Mustermann" required error={state?.errors?.last_name?.[0]} />
            </div>
            <Input label="E-Mail *" name="email" type="email" placeholder="max@firma.de" defaultValue={defaultEmail} required error={state?.errors?.email?.[0]} />
            <Input label="Telefon" name="phone" type="tel" placeholder="+49 170 1234567" />
            <Input label="Passwort *" name="password" type="password" placeholder="Mindestens 8 Zeichen" required error={state?.errors?.password?.[0]} />
            <div className="flex gap-3">
              <Button type="button" variant="outline" size="lg" className="flex-1" onClick={() => setStep(1)}>
                <ChevronLeft className="h-4 w-4" /> Zurück
              </Button>
              <Button type="button" size="lg" className="flex-1" onClick={() => setStep(3)}>
                Weiter <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Step 3: Team */}
        <div className={step === 3 ? '' : 'hidden'}>
          <div className="flex flex-col gap-4">
            <p className="text-sm text-slate-500">
              Optional: Legen Sie Ihre Mitarbeiter direkt an. Sie können diesen Schritt auch überspringen und später nachholen.
            </p>

            {employees.length > 0 && (
              <div className="space-y-2">
                {employees.map((emp, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      name={`team_name_${i}`}
                      value={emp.name}
                      onChange={(e) => {
                        const u = [...employees]
                        u[i] = { ...u[i], name: e.target.value }
                        setEmployees(u)
                      }}
                      placeholder="Vor- und Nachname"
                      className="h-10 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm"
                    />
                    <select
                      name={`team_role_${i}`}
                      value={emp.role}
                      onChange={(e) => {
                        const u = [...employees]
                        u[i] = { ...u[i], role: e.target.value }
                        setEmployees(u)
                      }}
                      className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm"
                    >
                      <option value="worker">Arbeiter</option>
                      <option value="foreman">Bauleiter</option>
                    </select>
                    <button type="button" onClick={() => setEmployees(employees.filter((_, j) => j !== i))} className="rounded p-1 text-slate-400 hover:text-red-600">✕</button>
                  </div>
                ))}
              </div>
            )}

            <Button type="button" variant="outline" size="sm" onClick={addEmployee}>
              + Mitarbeiter hinzufügen
            </Button>

            <input type="hidden" name="team_count" value={employees.length} />

            {state?.message && <p className="text-sm text-red-600">{state.message}</p>}

            <div className="flex gap-3">
              <Button type="button" variant="outline" size="lg" className="flex-1" onClick={() => setStep(2)}>
                <ChevronLeft className="h-4 w-4" /> Zurück
              </Button>
              <Button type="submit" disabled={pending} size="lg" className="flex-1">
                {pending ? 'Konto wird erstellt...' : 'Kostenlos starten 🚀'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
