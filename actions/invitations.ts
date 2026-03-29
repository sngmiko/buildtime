'use server'

import { createClient } from '@/lib/supabase/server'
import { createInviteSchema } from '@/lib/validations/auth'

export type InviteState = {
  errors?: Record<string, string[]>
  message?: string
  inviteLink?: string
} | null

export async function createInvitation(
  prevState: InviteState,
  formData: FormData
): Promise<InviteState> {
  const raw = {
    first_name: formData.get('first_name'),
    last_name: formData.get('last_name'),
    role: formData.get('role'),
    email: formData.get('email') || undefined,
  }

  const validated = createInviteSchema.safeParse(raw)
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { message: 'Nicht angemeldet' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single()

  if (!profile || !['owner', 'foreman', 'super_admin'].includes(profile.role)) {
    return { message: 'Keine Berechtigung' }
  }

  const { data: invitation, error } = await supabase
    .from('invitations')
    .insert({
      company_id: profile.company_id,
      role: validated.data.role,
      email: validated.data.email || null,
      created_by: user.id,
    })
    .select('token')
    .single()

  if (error) {
    return { message: 'Einladung konnte nicht erstellt werden' }
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const inviteLink = `${baseUrl}/einladung/${invitation.token}?fn=${encodeURIComponent(validated.data.first_name)}&ln=${encodeURIComponent(validated.data.last_name)}`

  return { inviteLink }
}
