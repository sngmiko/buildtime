import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card } from '@/components/ui/card'
import { ChevronLeft } from 'lucide-react'
import { AdminEditForm } from './edit-form'
import type { CompanyExtended, Profile } from '@/lib/types'

export default async function AdminCompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: myProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!myProfile || myProfile.role !== 'super_admin') redirect('/dashboard')

  const admin = createAdminClient()
  const [{ data: company }, { data: profiles }] = await Promise.all([
    admin.from('companies').select('*').eq('id', id).single(),
    admin.from('profiles').select('*').eq('company_id', id).order('role').order('last_name'),
  ])

  if (!company) notFound()
  const c = company as CompanyExtended

  const trialDaysLeft = c.trial_ends_at ? Math.max(0, Math.ceil((new Date(c.trial_ends_at).getTime() - Date.now()) / 86400000)) : 0

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="text-slate-500 hover:text-slate-900"><ChevronLeft className="h-5 w-5" /></Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{c.name}</h1>
          <p className="text-sm text-slate-500">
            Plan: {c.plan} · {(profiles as Profile[])?.length || 0} Mitarbeiter ·{' '}
            {c.plan === 'trial' ? `${trialDaysLeft} Tage Trial verbleibend` : `${Number(c.monthly_price).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}/Monat`}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Firma bearbeiten</h3>
          <AdminEditForm company={c} />
        </Card>

        <Card>
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Mitarbeiter ({(profiles as Profile[])?.length || 0})</h3>
          <div className="divide-y divide-slate-100">
            {(profiles as Profile[] || []).map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2 text-sm">
                <span className="font-medium text-slate-900">{p.first_name} {p.last_name}</span>
                <span className="text-xs text-slate-500">
                  {{ owner: 'Inhaber', foreman: 'Bauleiter', worker: 'Arbeiter', super_admin: 'Admin' }[p.role]}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
