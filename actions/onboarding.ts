'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type OnboardingState = {
  errors?: Record<string, string[]>
  message?: string
  success?: boolean
} | null

export async function completeOnboardingStep(
  step: number,
  prevState: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { message: 'Nicht angemeldet' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single()

  if (!profile) return { message: 'Profil nicht gefunden' }

  if (step === 1) {
    // Company details
    const { error } = await supabase.from('companies').update({
      address: formData.get('address') || null,
      tax_id: formData.get('tax_id') || null,
      trade_license: formData.get('trade_license') || null,
    }).eq('id', profile.company_id)

    if (error) return { message: 'Speichern fehlgeschlagen' }

    await supabase.from('companies').update({ onboarding_step: 2 }).eq('id', profile.company_id)
    await supabase.from('onboarding_progress').update({ profile_completed: true }).eq('company_id', profile.company_id)
  }

  if (step === 2) {
    // Employee count (informational, updates max preference)
    await supabase.from('companies').update({ onboarding_step: 3 }).eq('id', profile.company_id)
  }

  if (step === 3) {
    // Module interests (informational)
    await supabase.from('companies').update({ onboarding_step: 4 }).eq('id', profile.company_id)
  }

  if (step === 4) {
    // Logo (skip for now, just advance)
    await supabase.from('companies').update({ onboarding_step: 5 }).eq('id', profile.company_id)
  }

  if (step === 5) {
    // Complete onboarding
    await supabase.from('companies').update({
      onboarding_completed: true,
      onboarding_step: 5,
    }).eq('id', profile.company_id)

    redirect('/dashboard')
  }

  return { success: true }
}

export async function skipOnboarding(): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (profile) {
    await supabase.from('companies').update({
      onboarding_completed: true,
    }).eq('id', profile.company_id)
  }

  redirect('/dashboard')
}
