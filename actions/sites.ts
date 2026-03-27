'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { siteSchema } from '@/lib/validations/sites'

export type SiteState = {
  errors?: Record<string, string[]>
  message?: string
  success?: boolean
} | null

export async function createSite(prevState: SiteState, formData: FormData): Promise<SiteState> {
  const raw = {
    name: formData.get('name'),
    address: formData.get('address') || undefined,
    status: formData.get('status') || 'active',
  }

  const validated = siteSchema.safeParse(raw)
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { message: 'Nicht angemeldet' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single()

  if (!profile || !['owner', 'foreman'].includes(profile.role)) {
    return { message: 'Keine Berechtigung' }
  }

  const { error } = await supabase
    .from('construction_sites')
    .insert({
      company_id: profile.company_id,
      name: validated.data.name,
      address: validated.data.address || null,
      status: validated.data.status,
      created_by: user.id,
    })

  if (error) {
    return { message: 'Baustelle konnte nicht erstellt werden' }
  }

  redirect('/baustellen')
}

export async function updateSite(
  siteId: string,
  prevState: SiteState,
  formData: FormData
): Promise<SiteState> {
  const raw = {
    name: formData.get('name'),
    address: formData.get('address') || undefined,
    status: formData.get('status') || 'active',
  }

  const validated = siteSchema.safeParse(raw)
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { message: 'Nicht angemeldet' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['owner', 'foreman'].includes(profile.role)) {
    return { message: 'Keine Berechtigung' }
  }

  const { error } = await supabase
    .from('construction_sites')
    .update({
      name: validated.data.name,
      address: validated.data.address || null,
      status: validated.data.status,
    })
    .eq('id', siteId)

  if (error) {
    return { message: 'Baustelle konnte nicht aktualisiert werden' }
  }

  return { success: true, message: 'Baustelle aktualisiert' }
}
