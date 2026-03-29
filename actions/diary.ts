'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { diaryEntrySchema } from '@/lib/validations/diary'

export type DiaryState = {
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
    .select('id, company_id, role')
    .eq('id', user.id)
    .single()
  return { supabase, user, profile }
}

// ─── Diary Entries ────────────────────────────────────────────────────────────

export async function createDiaryEntry(prevState: DiaryState, formData: FormData): Promise<DiaryState> {
  const raw: Record<string, unknown> = {}
  for (const key of ['site_id', 'entry_date', 'weather', 'temperature', 'wind', 'work_description', 'incidents', 'defects', 'hindrances']) {
    raw[key] = formData.get(key) || undefined
  }
  const validated = diaryEntrySchema.safeParse(raw)
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors }

  const { supabase, user, profile } = await getAuthProfile()
  if (!profile || !user || !['owner', 'foreman', 'super_admin'].includes(profile.role)) return { message: 'Keine Berechtigung' }

  const d: Record<string, unknown> = {
    company_id: profile.company_id,
    created_by: user.id,
    ...validated.data,
  }
  for (const k of Object.keys(d)) { if (d[k] === '' || d[k] === undefined) d[k] = null }

  const { error } = await supabase.from('diary_entries').insert(d)
  if (error) {
    if (error.code === '23505') return { message: 'Für diese Baustelle existiert bereits ein Eintrag an diesem Datum' }
    return { message: 'Eintrag konnte nicht erstellt werden' }
  }
  redirect('/bautagebuch')
}

export async function getWeatherForLocation(lat: number, lng: number) {
  const { fetchWeather } = await import('@/lib/weather')
  return fetchWeather(lat, lng)
}

export async function updateDiaryEntry(entryId: string, prevState: DiaryState, formData: FormData): Promise<DiaryState> {
  const raw: Record<string, unknown> = {}
  for (const key of ['site_id', 'entry_date', 'weather', 'temperature', 'wind', 'work_description', 'incidents', 'defects', 'hindrances']) {
    raw[key] = formData.get(key) || undefined
  }
  const validated = diaryEntrySchema.safeParse(raw)
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors }

  const { supabase, profile } = await getAuthProfile()
  if (!profile || !['owner', 'foreman', 'super_admin'].includes(profile.role)) return { message: 'Keine Berechtigung' }

  const d: Record<string, unknown> = { ...validated.data }
  for (const k of Object.keys(d)) { if (d[k] === '' || d[k] === undefined) d[k] = null }

  const { error } = await supabase.from('diary_entries').update(d).eq('id', entryId)
  if (error) return { message: 'Eintrag konnte nicht aktualisiert werden' }
  return { success: true, message: 'Gespeichert' }
}
