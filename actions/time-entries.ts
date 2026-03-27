'use server'

import { createClient } from '@/lib/supabase/server'
import { clockInSchema, clockOutSchema, editEntrySchema } from '@/lib/validations/time-entries'

export type TimeEntryState = {
  errors?: Record<string, string[]>
  message?: string
  success?: boolean
} | null

export async function clockIn(prevState: TimeEntryState, formData: FormData): Promise<TimeEntryState> {
  const raw = {
    site_id: formData.get('site_id'),
  }

  const validated = clockInSchema.safeParse(raw)
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { message: 'Nicht angemeldet' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile) return { message: 'Profil nicht gefunden' }

  const { data: openEntry } = await supabase
    .from('time_entries')
    .select('id')
    .eq('user_id', user.id)
    .is('clock_out', null)
    .maybeSingle()

  if (openEntry) {
    return { message: 'Sie sind bereits eingestempelt' }
  }

  const lat = formData.get('lat') ? parseFloat(formData.get('lat') as string) : null
  const lng = formData.get('lng') ? parseFloat(formData.get('lng') as string) : null

  const { error } = await supabase
    .from('time_entries')
    .insert({
      company_id: profile.company_id,
      user_id: user.id,
      site_id: validated.data.site_id,
      clock_in_lat: lat,
      clock_in_lng: lng,
    })

  if (error) {
    return { message: 'Einstempeln fehlgeschlagen' }
  }

  return { success: true }
}

export async function clockOut(prevState: TimeEntryState, formData: FormData): Promise<TimeEntryState> {
  const raw = {
    entry_id: formData.get('entry_id'),
    break_minutes: formData.get('break_minutes') || '0',
    notes: formData.get('notes') || '',
  }

  const validated = clockOutSchema.safeParse(raw)
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { message: 'Nicht angemeldet' }

  const lat = formData.get('lat') ? parseFloat(formData.get('lat') as string) : null
  const lng = formData.get('lng') ? parseFloat(formData.get('lng') as string) : null

  const { error, count } = await supabase
    .from('time_entries')
    .update({
      clock_out: new Date().toISOString(),
      clock_out_lat: lat,
      clock_out_lng: lng,
      break_minutes: validated.data.break_minutes,
      notes: validated.data.notes || null,
    })
    .eq('id', validated.data.entry_id)
    .eq('user_id', user.id)
    .is('clock_out', null)

  if (error || count === 0) {
    return { message: 'Ausstempeln fehlgeschlagen' }
  }

  return { success: true }
}

export async function updateEntry(
  entryId: string,
  prevState: TimeEntryState,
  formData: FormData
): Promise<TimeEntryState> {
  const raw = {
    clock_in: formData.get('clock_in'),
    clock_out: formData.get('clock_out'),
    break_minutes: formData.get('break_minutes') || '0',
    site_id: formData.get('site_id'),
    notes: formData.get('notes') || '',
  }

  const validated = editEntrySchema.safeParse(raw)
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
    .from('time_entries')
    .update({
      clock_in: validated.data.clock_in,
      clock_out: validated.data.clock_out,
      break_minutes: validated.data.break_minutes,
      site_id: validated.data.site_id,
      notes: validated.data.notes || null,
      edited_by: user.id,
      edited_at: new Date().toISOString(),
    })
    .eq('id', entryId)

  if (error) {
    return { message: 'Eintrag konnte nicht aktualisiert werden' }
  }

  return { success: true, message: 'Eintrag aktualisiert' }
}

export async function deleteEntry(entryId: string): Promise<TimeEntryState> {
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
    .from('time_entries')
    .delete()
    .eq('id', entryId)

  if (error) {
    return { message: 'Eintrag konnte nicht gelöscht werden' }
  }

  return { success: true }
}
