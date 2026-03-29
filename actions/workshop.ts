'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type WorkshopState = {
  errors?: Record<string, string[]>
  message?: string
  success?: boolean
} | null

export async function createWorkshopEntry(prevState: WorkshopState, formData: FormData): Promise<WorkshopState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { message: 'Nicht angemeldet' }

  const { data: profile } = await supabase.from('profiles').select('company_id, role').eq('id', user.id).single()
  if (!profile || !['owner', 'foreman', 'super_admin'].includes(profile.role)) return { message: 'Keine Berechtigung' }

  const entityType = formData.get('entity_type') as string
  const entityId = formData.get('entity_id') as string
  const reason = formData.get('reason') as string

  if (!entityType || !entityId || !reason) return { message: 'Pflichtfelder ausfüllen' }

  const { error } = await supabase.from('workshop_entries').insert({
    company_id: profile.company_id,
    entity_type: entityType,
    entity_id: entityId,
    reason,
    description: formData.get('description') || null,
    workshop_name: formData.get('workshop_name') || null,
    expected_completion: formData.get('expected_completion') || null,
    cost_parts: parseFloat(formData.get('cost_parts') as string) || 0,
    cost_labor: parseFloat(formData.get('cost_labor') as string) || 0,
    cost_external: parseFloat(formData.get('cost_external') as string) || 0,
    notes: formData.get('notes') || null,
    created_by: user.id,
  })

  if (error) return { message: 'Werkstattaufenthalt konnte nicht erstellt werden' }

  // Set entity availability to workshop
  const table = entityType === 'vehicle' ? 'vehicles' : 'equipment'
  await supabase.from(table).update({ availability_status: 'workshop' }).eq('id', entityId)

  redirect('/fuhrpark/werkstatt')
}

export async function updateWorkshopStatus(entryId: string, newStatus: string): Promise<WorkshopState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { message: 'Nicht angemeldet' }

  const update: Record<string, unknown> = { status: newStatus }
  if (newStatus === 'done' || newStatus === 'picked_up') {
    update.completed_at = new Date().toISOString()
  }

  const { error } = await supabase.from('workshop_entries').update(update).eq('id', entryId)
  if (error) return { message: 'Status konnte nicht aktualisiert werden' }

  // If picked up, set entity back to available
  if (newStatus === 'picked_up') {
    const { data: entry } = await supabase.from('workshop_entries').select('entity_type, entity_id').eq('id', entryId).single()
    if (entry) {
      const table = entry.entity_type === 'vehicle' ? 'vehicles' : 'equipment'
      await supabase.from(table).update({ availability_status: 'available' }).eq('id', entry.entity_id)
    }
  }

  return { success: true, message: 'Status aktualisiert' }
}

export async function updateWorkshopCosts(entryId: string, prevState: WorkshopState, formData: FormData): Promise<WorkshopState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { message: 'Nicht angemeldet' }

  const { error } = await supabase.from('workshop_entries').update({
    cost_parts: parseFloat(formData.get('cost_parts') as string) || 0,
    cost_labor: parseFloat(formData.get('cost_labor') as string) || 0,
    cost_external: parseFloat(formData.get('cost_external') as string) || 0,
    notes: formData.get('notes') || null,
  }).eq('id', entryId)

  if (error) return { message: 'Kosten konnten nicht aktualisiert werden' }
  return { success: true, message: 'Kosten aktualisiert' }
}
