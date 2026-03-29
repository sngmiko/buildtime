'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { subcontractorSchema, subAssignmentSchema } from '@/lib/validations/subcontractors'

export type SubcontractorsState = {
  errors?: Record<string, string[]>
  message?: string
  success?: boolean
} | null

// ─── Auth helper ──────────────────────────────────────────────────────────────

async function getAuthProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, profile: null }
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single()
  return { supabase, user, profile }
}

// ─── Subcontractors ───────────────────────────────────────────────────────────

export async function createSubcontractor(prevState: SubcontractorsState, formData: FormData): Promise<SubcontractorsState> {
  const raw: Record<string, unknown> = {}
  for (const key of ['name', 'contact_person', 'email', 'phone', 'address', 'trade', 'tax_exemption_valid_until', 'quality_rating', 'reliability_rating', 'price_rating', 'notes']) {
    raw[key] = formData.get(key) || undefined
  }
  const validated = subcontractorSchema.safeParse(raw)
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors }

  const { supabase, profile } = await getAuthProfile()
  if (!profile || !['owner', 'foreman', 'super_admin'].includes(profile.role)) return { message: 'Keine Berechtigung' }

  const d: Record<string, unknown> = { company_id: profile.company_id, ...validated.data }
  for (const k of Object.keys(d)) { if (d[k] === '' || d[k] === undefined) d[k] = null }

  const { error } = await supabase.from('subcontractors').insert(d)
  if (error) return { message: 'Subunternehmer konnte nicht erstellt werden' }
  redirect('/subunternehmer')
}

export async function updateSubcontractor(subId: string, prevState: SubcontractorsState, formData: FormData): Promise<SubcontractorsState> {
  const raw: Record<string, unknown> = {}
  for (const key of ['name', 'contact_person', 'email', 'phone', 'address', 'trade', 'tax_exemption_valid_until', 'quality_rating', 'reliability_rating', 'price_rating', 'notes']) {
    raw[key] = formData.get(key) || undefined
  }
  const validated = subcontractorSchema.safeParse(raw)
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors }

  const { supabase, profile } = await getAuthProfile()
  if (!profile || !['owner', 'foreman', 'super_admin'].includes(profile.role)) return { message: 'Keine Berechtigung' }

  const d: Record<string, unknown> = { ...validated.data }
  for (const k of Object.keys(d)) { if (d[k] === '' || d[k] === undefined) d[k] = null }

  const { error } = await supabase.from('subcontractors').update(d).eq('id', subId)
  if (error) return { message: 'Subunternehmer konnte nicht aktualisiert werden' }
  return { success: true, message: 'Gespeichert' }
}

// ─── Assignments ──────────────────────────────────────────────────────────────

export async function createAssignment(subId: string, prevState: SubcontractorsState, formData: FormData): Promise<SubcontractorsState> {
  const raw: Record<string, unknown> = {
    subcontractor_id: subId,
    order_id: formData.get('order_id') || undefined,
    description: formData.get('description') || undefined,
    agreed_amount: formData.get('agreed_amount') || undefined,
    invoiced_amount: formData.get('invoiced_amount') || undefined,
  }
  const validated = subAssignmentSchema.safeParse(raw)
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors }

  const { supabase, profile } = await getAuthProfile()
  if (!profile || !['owner', 'foreman', 'super_admin'].includes(profile.role)) return { message: 'Keine Berechtigung' }

  const d: Record<string, unknown> = { company_id: profile.company_id, ...validated.data }
  for (const k of Object.keys(d)) { if (d[k] === '' || d[k] === undefined) d[k] = null }

  const { error } = await supabase.from('subcontractor_assignments').insert(d)
  if (error) return { message: 'Auftrag konnte nicht zugewiesen werden' }
  return { success: true, message: 'Zugewiesen' }
}

export async function updateAssignment(assignmentId: string, status: 'active' | 'completed' | 'cancelled'): Promise<SubcontractorsState> {
  const { supabase, profile } = await getAuthProfile()
  if (!profile || !['owner', 'foreman', 'super_admin'].includes(profile.role)) return { message: 'Keine Berechtigung' }

  const { error } = await supabase.from('subcontractor_assignments').update({ status }).eq('id', assignmentId)
  if (error) return { message: 'Status konnte nicht aktualisiert werden' }
  return { success: true }
}
