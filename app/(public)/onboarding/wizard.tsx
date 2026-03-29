'use client'

import { useActionState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { completeOnboardingStep, skipOnboarding, type OnboardingState } from '@/actions/onboarding'
import { Building2, Users, Settings, Upload, UserPlus, Check } from 'lucide-react'
import type { CompanyExtended } from '@/lib/types'

const STEPS = [
  { num: 1, label: 'Firmendaten', icon: Building2 },
  { num: 2, label: 'Teamgröße', icon: Users },
  { num: 3, label: 'Module', icon: Settings },
  { num: 4, label: 'Logo', icon: Upload },
  { num: 5, label: 'Einladen', icon: UserPlus },
]

export function OnboardingWizard({ company, currentStep }: { company: CompanyExtended; currentStep: number }) {
  const step = Math.max(1, Math.min(5, currentStep))

  return (
    <div className="flex flex-col gap-6">
      {/* Progress bar */}
      <div className="flex items-center justify-between">
        {STEPS.map((s, i) => {
          const Icon = s.icon
          const done = s.num < step
          const active = s.num === step
          return (
            <div key={s.num} className="flex flex-1 items-center">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                done ? 'bg-emerald-500 text-white' : active ? 'bg-[#1e3a5f] text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                {done ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`mx-2 h-0.5 flex-1 ${done ? 'bg-emerald-500' : 'bg-slate-200'}`} />
              )}
            </div>
          )
        })}
      </div>
      <p className="text-center text-sm text-slate-500">Schritt {step} von 5: {STEPS[step - 1].label}</p>

      {step === 1 && <Step1 company={company} />}
      {step === 2 && <Step2 />}
      {step === 3 && <Step3 />}
      {step === 4 && <Step4 />}
      {step === 5 && <Step5 />}

      <button onClick={() => skipOnboarding()} className="text-center text-xs text-slate-400 hover:text-slate-600">
        Einrichtung überspringen →
      </button>
    </div>
  )
}

function Step1({ company }: { company: CompanyExtended }) {
  const boundAction = completeOnboardingStep.bind(null, 1)
  const [state, action, pending] = useActionState<OnboardingState, FormData>(boundAction, null)

  return (
    <Card>
      <h2 className="mb-4 text-xl font-bold text-slate-900">Firmendaten vervollständigen</h2>
      <p className="mb-4 text-sm text-slate-500">Diese Daten erscheinen auf Ihren Angeboten und Rechnungen.</p>
      <form action={action} className="flex flex-col gap-4">
        <Input label="Firmenname" value={company.name} disabled />
        <Input label="Adresse" name="address" defaultValue={company.address || ''} placeholder="Musterstraße 1, 12345 Berlin" />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Steuernummer" name="tax_id" defaultValue={company.tax_id || ''} placeholder="DE123456789" />
          <Input label="Handwerkskammer-Nr." name="trade_license" defaultValue={company.trade_license || ''} />
        </div>
        {state?.message && <p className={`text-sm ${state?.success ? 'text-emerald-600' : 'text-red-600'}`}>{state.message}</p>}
        <Button type="submit" disabled={pending} size="lg" className="w-full">
          {pending ? 'Speichern...' : 'Weiter →'}
        </Button>
      </form>
    </Card>
  )
}

function Step2() {
  const boundAction = completeOnboardingStep.bind(null, 2)
  const [, action, pending] = useActionState<OnboardingState, FormData>(boundAction, null)

  return (
    <Card>
      <h2 className="mb-4 text-xl font-bold text-slate-900">Wie groß ist Ihr Team?</h2>
      <p className="mb-6 text-sm text-slate-500">Damit wir NomadWorks optimal für Sie einrichten können.</p>
      <form action={action} className="flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { value: '1-5', label: '1-5 MA' },
            { value: '6-15', label: '6-15 MA' },
            { value: '16-50', label: '16-50 MA' },
            { value: '50+', label: '50+ MA' },
          ].map(opt => (
            <label key={opt.value} className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-slate-200 p-4 text-center transition-colors hover:border-[#1e3a5f] has-[:checked]:border-[#1e3a5f] has-[:checked]:bg-blue-50">
              <input type="radio" name="team_size" value={opt.value} className="sr-only" />
              <Users className="h-8 w-8 text-slate-400" />
              <span className="text-sm font-medium text-slate-700">{opt.label}</span>
            </label>
          ))}
        </div>
        <Button type="submit" disabled={pending} size="lg" className="w-full">Weiter →</Button>
      </form>
    </Card>
  )
}

function Step3() {
  const boundAction = completeOnboardingStep.bind(null, 3)
  const [, action, pending] = useActionState<OnboardingState, FormData>(boundAction, null)

  const modules = [
    { id: 'time', label: 'Zeiterfassung', desc: 'GPS-verifizierte Stempeluhr' },
    { id: 'sites', label: 'Baustellendoku', desc: 'Bautagesbericht & Fortschritt' },
    { id: 'fleet', label: 'Fuhrpark', desc: 'Fahrzeuge & Maschinen' },
    { id: 'inventory', label: 'Material & Lager', desc: 'Bestand & Bestellungen' },
    { id: 'orders', label: 'Auftragsverwaltung', desc: 'Angebote & Kostentracker' },
    { id: 'subs', label: 'Subunternehmer', desc: 'Nachunternehmer verwalten' },
  ]

  return (
    <Card>
      <h2 className="mb-4 text-xl font-bold text-slate-900">Welche Module interessieren Sie?</h2>
      <p className="mb-6 text-sm text-slate-500">Alle Module sind in Ihrem Plan enthalten. Wählen Sie, was für Sie am wichtigsten ist.</p>
      <form action={action} className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {modules.map(m => (
            <label key={m.id} className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-slate-200 p-4 transition-colors hover:border-[#1e3a5f] has-[:checked]:border-[#1e3a5f] has-[:checked]:bg-blue-50">
              <input type="checkbox" name="modules" value={m.id} className="h-4 w-4 rounded border-slate-300 text-[#1e3a5f]" />
              <div>
                <p className="text-sm font-medium text-slate-900">{m.label}</p>
                <p className="text-xs text-slate-500">{m.desc}</p>
              </div>
            </label>
          ))}
        </div>
        <Button type="submit" disabled={pending} size="lg" className="w-full">Weiter →</Button>
      </form>
    </Card>
  )
}

function Step4() {
  const boundAction = completeOnboardingStep.bind(null, 4)
  const [, action, pending] = useActionState<OnboardingState, FormData>(boundAction, null)

  return (
    <Card>
      <h2 className="mb-4 text-xl font-bold text-slate-900">Firmenlogo hochladen</h2>
      <p className="mb-6 text-sm text-slate-500">Ihr Logo erscheint auf Angeboten, Rechnungen und Stundenzetteln.</p>
      <form action={action} className="flex flex-col items-center gap-6">
        <div className="flex h-40 w-40 items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 text-center">
          <div>
            <Upload className="mx-auto h-8 w-8 text-slate-400" />
            <p className="mt-2 text-xs text-slate-400">Logo hierher ziehen<br />oder klicken</p>
          </div>
        </div>
        <p className="text-xs text-slate-400">Optional — Sie können das Logo auch später unter Firmeneinstellungen hochladen.</p>
        <Button type="submit" disabled={pending} size="lg" className="w-full">
          {pending ? 'Weiter...' : 'Weiter →'}
        </Button>
      </form>
    </Card>
  )
}

function Step5() {
  const boundAction = completeOnboardingStep.bind(null, 5)
  const [, action, pending] = useActionState<OnboardingState, FormData>(boundAction, null)

  return (
    <Card>
      <h2 className="mb-4 text-xl font-bold text-slate-900">Laden Sie Ihren ersten Mitarbeiter ein</h2>
      <p className="mb-6 text-sm text-slate-500">Senden Sie einen Einladungslink per WhatsApp oder E-Mail.</p>
      <form action={action} className="flex flex-col gap-4">
        <p className="text-sm text-slate-600">
          Sie können jetzt Mitarbeiter einladen oder diesen Schritt überspringen und später im Bereich <strong>Mitarbeiter</strong> nachholen.
        </p>
        <Button type="submit" disabled={pending} size="lg" className="w-full">
          {pending ? 'Einrichtung abschließen...' : 'Einrichtung abschließen & loslegen 🎉'}
        </Button>
      </form>
    </Card>
  )
}
