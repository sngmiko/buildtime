'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export type AdminState = {
  errors?: Record<string, string[]>
  message?: string
  success?: boolean
  inviteLink?: string
} | null

async function requireSuperAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Nicht angemeldet')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'super_admin') throw new Error('Keine Berechtigung')
  return user
}

export async function adminCreateCompany(prevState: AdminState, formData: FormData): Promise<AdminState> {
  await requireSuperAdmin()
  const admin = createAdminClient()

  const name = formData.get('name') as string
  const plan = (formData.get('plan') as string) || 'trial'
  const ownerEmail = formData.get('owner_email') as string
  const ownerFirstName = formData.get('owner_first_name') as string
  const ownerLastName = formData.get('owner_last_name') as string

  if (!name || !ownerEmail || !ownerFirstName || !ownerLastName) {
    return { message: 'Alle Pflichtfelder ausfüllen' }
  }

  const maxEmployees = ({ trial: 5, starter: 10, business: 30, enterprise: 100 } as Record<string, number>)[plan] || 5
  const monthlyPrice = ({ trial: 0, starter: 49, business: 99, enterprise: 199 } as Record<string, number>)[plan] || 0
  const trialEndsAt = plan === 'trial' ? new Date(Date.now() + 7 * 86400000).toISOString() : null

  // Create company
  const { data: company, error: compErr } = await admin.from('companies').insert({
    name,
    plan,
    max_employees: maxEmployees,
    monthly_price: monthlyPrice,
    trial_ends_at: trialEndsAt,
    is_active: true,
  }).select('id').single()

  if (compErr || !company) return { message: 'Firma konnte nicht erstellt werden' }

  // Create owner user
  const { data: userData, error: userErr } = await admin.auth.admin.createUser({
    email: ownerEmail,
    password: Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2),
    email_confirm: true,
    user_metadata: { flow: 'admin_setup', first_name: ownerFirstName, last_name: ownerLastName },
  })

  if (userErr || !userData.user) {
    await admin.from('companies').delete().eq('id', company.id)
    return { message: userErr?.message || 'Benutzer konnte nicht erstellt werden' }
  }

  // Create owner profile
  await admin.from('profiles').insert({
    id: userData.user.id,
    company_id: company.id,
    role: 'owner',
    first_name: ownerFirstName,
    last_name: ownerLastName,
  })

  // Create onboarding progress
  await admin.from('onboarding_progress').insert({ company_id: company.id })

  // Generate password reset link as invite
  const { data: resetData } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email: ownerEmail,
    options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/onboarding` },
  })

  const inviteLink = resetData?.properties?.action_link || ''

  return { success: true, message: 'Firma erstellt', inviteLink }
}

export async function adminUpdateCompany(companyId: string, prevState: AdminState, formData: FormData): Promise<AdminState> {
  await requireSuperAdmin()
  const admin = createAdminClient()

  const plan = formData.get('plan') as string
  const maxEmployees = ({ trial: 5, starter: 10, business: 30, enterprise: 100 } as Record<string, number>)[plan] || 5
  const monthlyPrice = ({ trial: 0, starter: 49, business: 99, enterprise: 199 } as Record<string, number>)[plan] || 0

  const logoUrl = formData.get('logo_url') as string | null
  const primaryColor = formData.get('primary_color') as string | null
  const secondaryColor = formData.get('secondary_color') as string | null

  const { error } = await admin.from('companies').update({
    name: formData.get('name'),
    plan,
    max_employees: maxEmployees,
    monthly_price: monthlyPrice,
    is_active: formData.get('is_active') === 'true',
    logo_url: logoUrl || null,
    primary_color: primaryColor || null,
    secondary_color: secondaryColor || null,
  }).eq('id', companyId)

  if (error) return { message: 'Aktualisierung fehlgeschlagen' }
  return { success: true, message: 'Firma aktualisiert' }
}

export async function adminExtendTrial(companyId: string, days: number): Promise<AdminState> {
  await requireSuperAdmin()
  const admin = createAdminClient()

  const { data: company } = await admin.from('companies').select('trial_ends_at').eq('id', companyId).single()
  if (!company) return { message: 'Firma nicht gefunden' }

  const current = company.trial_ends_at ? new Date(company.trial_ends_at) : new Date()
  const extended = new Date(current.getTime() + days * 86400000)

  await admin.from('companies').update({ trial_ends_at: extended.toISOString() }).eq('id', companyId)
  return { success: true, message: `Trial verlängert bis ${extended.toLocaleDateString('de-DE')}` }
}

export async function adminToggleCompany(companyId: string, active: boolean): Promise<AdminState> {
  await requireSuperAdmin()
  const admin = createAdminClient()
  await admin.from('companies').update({ is_active: active }).eq('id', companyId)
  return { success: true, message: active ? 'Firma aktiviert' : 'Firma deaktiviert' }
}

export async function adminResetPassword(
  userId: string,
  prevState: AdminState,
  formData: FormData
): Promise<AdminState> {
  await requireSuperAdmin()
  const admin = createAdminClient()

  const newPassword = formData.get('new_password') as string
  if (!newPassword || newPassword.length < 6) {
    return { message: 'Passwort muss mindestens 6 Zeichen lang sein' }
  }

  const { error } = await admin.auth.admin.updateUserById(userId, {
    password: newPassword,
  })

  if (error) return { message: error.message }
  return { success: true, message: 'Passwort wurde geändert' }
}

export async function adminUpdateUser(
  userId: string,
  prevState: AdminState,
  formData: FormData
): Promise<AdminState> {
  await requireSuperAdmin()
  const admin = createAdminClient()

  const email = formData.get('email') as string
  const firstName = formData.get('first_name') as string
  const lastName = formData.get('last_name') as string
  const role = formData.get('role') as string

  if (email) {
    const { error } = await admin.auth.admin.updateUserById(userId, { email })
    if (error) return { message: 'E-Mail konnte nicht geändert werden: ' + error.message }
  }

  const profileUpdate: Record<string, unknown> = {}
  if (firstName) profileUpdate.first_name = firstName
  if (lastName) profileUpdate.last_name = lastName
  if (role) profileUpdate.role = role

  if (Object.keys(profileUpdate).length > 0) {
    const { error } = await admin.from('profiles').update(profileUpdate).eq('id', userId)
    if (error) return { message: 'Profil konnte nicht aktualisiert werden' }
  }

  return { success: true, message: 'Benutzer aktualisiert' }
}

export async function adminDeleteUser(userId: string): Promise<AdminState> {
  await requireSuperAdmin()
  const admin = createAdminClient()

  await admin.from('profiles').delete().eq('id', userId)
  const { error } = await admin.auth.admin.deleteUser(userId)

  if (error) return { message: 'Benutzer konnte nicht gelöscht werden: ' + error.message }
  return { success: true, message: 'Benutzer gelöscht' }
}

export async function adminGenerateInviteLink(email: string): Promise<AdminState> {
  await requireSuperAdmin()
  const admin = createAdminClient()

  const { data } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/onboarding` },
  })

  const link = data?.properties?.action_link || ''
  if (!link) return { message: 'Link konnte nicht generiert werden' }
  return { success: true, inviteLink: link }
}
