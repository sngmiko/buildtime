'use server'

import { createClient } from '@/lib/supabase/server'
import { companySchema } from '@/lib/validations/company'

export type CompanyState = {
  errors?: Record<string, string[]>
  message?: string
  success?: boolean
} | null

export async function updateCompany(
  prevState: CompanyState,
  formData: FormData
): Promise<CompanyState> {
  const raw = {
    name: formData.get('name'),
    address: formData.get('address') || undefined,
    tax_id: formData.get('tax_id') || undefined,
    trade_license: formData.get('trade_license') || undefined,
  }

  const validated = companySchema.safeParse(raw)
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

  if (!profile || profile.role !== 'owner') {
    return { message: 'Nur der Firmeninhaber kann die Firma bearbeiten' }
  }

  const { error } = await supabase
    .from('companies')
    .update(validated.data)
    .eq('id', profile.company_id)

  if (error) {
    return { message: 'Firma konnte nicht aktualisiert werden' }
  }

  return { success: true, message: 'Firma erfolgreich aktualisiert' }
}
