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
    description: formData.get('description') || undefined,
    client_name: formData.get('client_name') || undefined,
    client_phone: formData.get('client_phone') || undefined,
    client_email: formData.get('client_email') || undefined,
    start_date: formData.get('start_date') || undefined,
    end_date: formData.get('end_date') || undefined,
    budget: formData.get('budget') || undefined,
    site_manager: formData.get('site_manager') || undefined,
    notes: formData.get('notes') || undefined,
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

  if (!profile || !['owner', 'foreman', 'super_admin'].includes(profile.role)) {
    return { message: 'Keine Berechtigung' }
  }

  const d = validated.data

  const { error } = await supabase
    .from('construction_sites')
    .insert({
      company_id: profile.company_id,
      name: d.name,
      address: d.address || null,
      status: d.status,
      created_by: user.id,
      description: d.description || null,
      client_name: d.client_name || null,
      client_phone: d.client_phone || null,
      client_email: d.client_email || null,
      start_date: d.start_date || null,
      end_date: d.end_date || null,
      budget: typeof d.budget === 'number' ? d.budget : null,
      site_manager: d.site_manager || null,
      notes: d.notes || null,
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
    description: formData.get('description') || undefined,
    client_name: formData.get('client_name') || undefined,
    client_phone: formData.get('client_phone') || undefined,
    client_email: formData.get('client_email') || undefined,
    start_date: formData.get('start_date') || undefined,
    end_date: formData.get('end_date') || undefined,
    budget: formData.get('budget') || undefined,
    site_manager: formData.get('site_manager') || undefined,
    notes: formData.get('notes') || undefined,
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

  if (!profile || !['owner', 'foreman', 'super_admin'].includes(profile.role)) {
    return { message: 'Keine Berechtigung' }
  }

  const d = validated.data

  const { error } = await supabase
    .from('construction_sites')
    .update({
      name: d.name,
      address: d.address || null,
      status: d.status,
      description: d.description || null,
      client_name: d.client_name || null,
      client_phone: d.client_phone || null,
      client_email: d.client_email || null,
      start_date: d.start_date || null,
      end_date: d.end_date || null,
      budget: typeof d.budget === 'number' ? d.budget : null,
      site_manager: d.site_manager || null,
      notes: d.notes || null,
    })
    .eq('id', siteId)

  if (error) {
    return { message: 'Baustelle konnte nicht aktualisiert werden' }
  }

  return { success: true, message: 'Baustelle aktualisiert' }
}
