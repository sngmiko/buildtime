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
    first_name: formData.get('first_name'),
    last_name: formData.get('last_name'),
    email: formData.get('email'),
    password: formData.get('password'),
  }

  const validated = acceptInviteSchema.safeParse(raw)
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { first_name, last_name, email, password } = validated.data

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

  // Create user via admin client (bypasses email confirmation)
  const { data: signUpData, error: signUpError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      flow: 'invite',
      first_name,
      last_name,
    },
  })

  if (signUpError) {
    return { message: signUpError.message }
  }

  // Create profile via admin client (trigger only handles 'register' flow)
  const { error: profileError } = await admin
    .from('profiles')
    .insert({
      id: signUpData.user.id,
      company_id: invitation.company_id,
      role: invitation.role,
      first_name,
      last_name,
      invited_by: invitation.created_by,
    })

  if (profileError) {
    // Clean up: delete the auth user if profile creation fails
    await admin.auth.admin.deleteUser(signUpData.user.id)
    return { message: 'Profil konnte nicht erstellt werden' }
  }

  // Mark invitation as accepted
  const { count } = await admin
    .from('invitations')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', invitation.id)
    .is('accepted_at', null)

  if (count === 0) {
    return { message: 'Einladung wurde bereits angenommen' }
  }

  // Sign in the new user
  const supabase = await createClient()
  await supabase.auth.signInWithPassword({ email, password })

  const destination = invitation.role === 'worker' ? '/stempeln' : '/dashboard'
  redirect(destination)
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
