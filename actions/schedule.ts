'use server'

import { createClient } from '@/lib/supabase/server'
import { scheduleSchema } from '@/lib/validations/invoices'

export type ScheduleState = {
  errors?: Record<string, string[]>
  message?: string
  success?: boolean
} | null

export async function createScheduleEntry(prevState: ScheduleState, formData: FormData): Promise<ScheduleState> {
  const raw = {
    user_id: formData.get('user_id'),
    site_id: formData.get('site_id'),
    date: formData.get('date'),
    shift: formData.get('shift') || 'full',
    notes: formData.get('notes') || '',
  }

  const validated = scheduleSchema.safeParse(raw)
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { message: 'Nicht angemeldet' }

  const { data: profile } = await supabase.from('profiles').select('company_id, role').eq('id', user.id).single()
  if (!profile || !['owner', 'foreman', 'super_admin'].includes(profile.role)) return { message: 'Keine Berechtigung' }

  const { error } = await supabase.from('schedule_entries').insert({
    company_id: profile.company_id,
    user_id: validated.data.user_id,
    site_id: validated.data.site_id,
    date: validated.data.date,
    shift: validated.data.shift,
    notes: validated.data.notes || null,
  })

  if (error) {
    if (error.message.includes('unique') || error.message.includes('duplicate')) {
      return { message: 'Mitarbeiter ist an diesem Tag bereits eingeplant' }
    }
    return { message: 'Eintrag konnte nicht erstellt werden' }
  }

  return { success: true, message: 'Eintrag gespeichert' }
}

export async function deleteScheduleEntry(entryId: string): Promise<ScheduleState> {
  const supabase = await createClient()
  const { error } = await supabase.from('schedule_entries').delete().eq('id', entryId)
  if (error) return { message: 'Eintrag konnte nicht gelöscht werden' }
  return { success: true }
}
