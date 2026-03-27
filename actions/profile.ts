'use server'

import { createClient } from '@/lib/supabase/server'
import { profileSchema } from '@/lib/validations/company'

export type ProfileState = {
  errors?: Record<string, string[]>
  message?: string
  success?: boolean
} | null

export async function updateProfile(
  prevState: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const raw = {
    first_name: formData.get('first_name'),
    last_name: formData.get('last_name'),
    phone: formData.get('phone') || undefined,
    language: formData.get('language') || undefined,
  }

  const validated = profileSchema.safeParse(raw)
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { message: 'Nicht angemeldet' }
  }

  const { error } = await supabase
    .from('profiles')
    .update(validated.data)
    .eq('id', user.id)

  if (error) {
    return { message: 'Profil konnte nicht aktualisiert werden' }
  }

  return { success: true, message: 'Profil erfolgreich aktualisiert' }
}
