import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { CompanyForm } from './company-form'
import type { Profile, Company } from '@/lib/types'

export default async function FirmaPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, company_id')
    .eq('id', user.id)
    .single<Pick<Profile, 'role' | 'company_id'>>()

  if (!profile || profile.role !== 'owner') {
    redirect('/dashboard')
  }

  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('id', profile.company_id)
    .single<Company>()

  if (!company) redirect('/dashboard')

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Firmeneinstellungen</h1>
      <Card className="max-w-lg">
        <CompanyForm company={company} />
      </Card>
    </div>
  )
}
