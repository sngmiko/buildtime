import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingWizard } from './wizard'
import type { CompanyExtended } from '@/lib/types'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, first_name, role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('id', profile.company_id)
    .single()

  if (!company) redirect('/login')
  const c = company as CompanyExtended

  if (c.onboarding_completed) redirect('/dashboard')

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-[#f8fafc] to-white p-6">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-[#1e3a5f]">Build<span className="text-[#f59e0b]">Time</span></h1>
          <p className="mt-2 text-slate-500">Willkommen, {profile.first_name}! Lassen Sie uns Ihr Konto einrichten.</p>
        </div>
        <OnboardingWizard company={c} currentStep={c.onboarding_step || 1} />
      </div>
    </div>
  )
}
