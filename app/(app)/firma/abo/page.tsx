import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'
import type { CompanyExtended } from '@/lib/types'
import { PLAN_CONFIG } from '@/lib/types'

export default async function AboPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('company_id, role').eq('id', user.id).single()
  if (!profile || profile.role !== 'owner') redirect('/dashboard')

  const { data: company } = await supabase.from('companies').select('*').eq('id', profile.company_id).single()
  if (!company) redirect('/dashboard')
  const c = company as CompanyExtended

  const plans = (['starter', 'business', 'enterprise'] as const).map(key => ({
    key,
    ...PLAN_CONFIG[key],
    current: c.plan === key,
  }))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Abo & Preise</h1>
        <p className="mt-1 text-sm text-slate-500">
          Aktueller Plan: <strong>{PLAN_CONFIG[c.plan].name}</strong>
          {c.plan === 'trial' && c.trial_ends_at && ` · Endet am ${new Date(c.trial_ends_at).toLocaleDateString('de-DE')}`}
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.key} className={`flex flex-col justify-between ${plan.current ? 'border-2 border-[#1e3a5f] ring-2 ring-[#1e3a5f]/10' : ''}`}>
            {plan.current && <div className="mb-4 w-fit rounded-full bg-[#1e3a5f] px-3 py-0.5 text-xs font-medium text-white">Aktueller Plan</div>}
            <div>
              <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold text-slate-900">{plan.price}€</span>
                <span className="text-sm text-slate-500">/Monat</span>
              </div>
              <p className="mt-2 text-sm text-slate-500">{plan.description}</p>
              <ul className="mt-4 space-y-2">
                {[
                  `Bis ${plan.maxEmployees} Mitarbeiter`,
                  'GPS-Zeiterfassung',
                  'Baustellenverwaltung',
                  'Auftragsverwaltung',
                  plan.key !== 'starter' ? 'Fuhrpark & Lager' : null,
                  plan.key === 'enterprise' ? 'Priority Support' : null,
                ].filter(Boolean).map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                    <Check className="h-4 w-4 text-emerald-500" />{f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-6">
              {plan.current ? (
                <Button variant="outline" className="w-full" disabled>Aktueller Plan</Button>
              ) : (
                <Button className="w-full">Jetzt wählen</Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      <p className="text-center text-xs text-slate-400">
        Für ein Upgrade kontaktieren Sie uns: info@nomad-solutions.de
      </p>
    </div>
  )
}
