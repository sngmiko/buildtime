'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { registerSchema, loginSchema, acceptInviteSchema } from '@/lib/validations/auth'

export type AuthState = {
  errors?: Record<string, string[]>
  message?: string
} | null

export async function register(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const raw = {
    company_name: formData.get('company_name'),
    first_name: formData.get('first_name'),
    last_name: formData.get('last_name'),
    email: formData.get('email'),
    password: formData.get('password'),
  }

  const validated = registerSchema.safeParse(raw)
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { company_name, first_name, last_name, email, password } = validated.data

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        flow: 'register',
        company_name,
        first_name,
        last_name,
      },
    },
  })

  if (error) {
    return { message: error.message }
  }

  redirect('/dashboard')
}

export async function login(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const raw = {
    email: formData.get('email'),
    password: formData.get('password'),
  }

  const validated = loginSchema.safeParse(raw)
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { email, password } = validated.data

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { message: 'E-Mail oder Passwort ist falsch' }
  }

  // Get role for redirect
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { message: 'Anmeldung fehlgeschlagen' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const destination = profile?.role === 'worker' ? '/stempeln' : '/dashboard'
  redirect(destination)
}

export async function acceptInvite(
  token: string,
  prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const raw = {
    email: formData.get('email'),
    password: formData.get('password'),
  }

  const validated = acceptInviteSchema.safeParse(raw)
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { email, password } = validated.data

  // Use admin client to read invitation (unauthenticated user)
  const admin = createAdminClient()
  const { data: invitation, error: invError } = await admin
    .from('invitations')
    .select('*')
    .eq('token', token)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (invError || !invitation) {
    return { message: 'Einladung ist ungültig oder abgelaufen' }
  }

  const supabase = await createClient()
  const { error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        flow: 'invite',
        company_id: invitation.company_id,
        role: invitation.role,
        first_name: formData.get('first_name') || '',
        last_name: formData.get('last_name') || '',
        invited_by: invitation.created_by,
      },
    },
  })

  if (signUpError) {
    return { message: signUpError.message }
  }

  // Mark invitation as accepted
  await admin
    .from('invitations')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', invitation.id)

  const destination = invitation.role === 'worker' ? '/stempeln' : '/dashboard'
  redirect(destination)
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
