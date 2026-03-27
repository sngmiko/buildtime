import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card } from '@/components/ui/card'
import { ChevronLeft, Mail, Calendar, Shield } from 'lucide-react'
import { AdminEditForm } from './edit-form'
import { UserManagement } from './user-management'
import type { CompanyExtended, Profile } from '@/lib/types'
import { formatCurrency } from '@/lib/format'

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

  // Get auth user details (emails, last sign in)
  const { data: { users: authUsers } } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const profileIds = new Set((profiles as Profile[] || []).map(p => p.id))
  const authMap = new Map<string, { email: string; last_sign_in_at: string | null; created_at: string }>(
    (authUsers || [])
      .filter(u => profileIds.has(u.id))
      .map(u => [u.id, { email: u.email || '', last_sign_in_at: u.last_sign_in_at || null, created_at: u.created_at }])
  )

  const trialDaysLeft = c.trial_ends_at ? Math.max(0, Math.ceil((new Date(c.trial_ends_at).getTime() - Date.now()) / 86400000)) : 0

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="text-slate-500 hover:text-slate-900"><ChevronLeft className="h-5 w-5" /></Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{c.name}</h1>
          <p className="text-sm text-slate-500">
            Plan: {c.plan} · {(profiles as Profile[])?.length || 0} / {c.max_employees} Mitarbeiter ·{' '}
            {c.plan === 'trial' ? `${trialDaysLeft} Tage Trial verbleibend` : `${formatCurrency(Number(c.monthly_price))}/Monat`}
          </p>
        </div>
      </div>

      {/* Company info cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{(profiles as Profile[])?.length || 0}</p>
          <p className="text-xs text-slate-500">Mitarbeiter</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{c.plan.charAt(0).toUpperCase() + c.plan.slice(1)}</p>
          <p className="text-xs text-slate-500">Plan</p>
        </Card>
        <Card className="p-4 text-center">
          <p className={`text-2xl font-bold ${c.is_active ? 'text-emerald-600' : 'text-red-600'}`}>
            {c.is_active ? 'Aktiv' : 'Deaktiviert'}
          </p>
          <p className="text-xs text-slate-500">Status</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{new Date(c.created_at).toLocaleDateString('de-DE')}</p>
          <p className="text-xs text-slate-500">Erstellt am</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Company edit */}
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Firma bearbeiten</h3>
          <AdminEditForm company={c} />
        </Card>

        {/* Right: Company details */}
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Firmendaten</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Firmen-ID</dt>
              <dd className="font-mono text-xs text-slate-600">{c.id}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Adresse</dt>
              <dd className="text-slate-900">{c.address || '–'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Steuernummer</dt>
              <dd className="text-slate-900">{c.tax_id || '–'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Handwerkskammer</dt>
              <dd className="text-slate-900">{c.trade_license || '–'}</dd>
            </div>
            {c.trial_ends_at && (
              <div className="flex justify-between">
                <dt className="text-slate-500">Trial endet</dt>
                <dd className="text-slate-900">{new Date(c.trial_ends_at).toLocaleDateString('de-DE')}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-slate-500">Onboarding</dt>
              <dd className="text-slate-900">{c.onboarding_completed ? 'Abgeschlossen' : `Schritt ${c.onboarding_step || 0}/5`}</dd>
            </div>
          </dl>
        </Card>
      </div>

      {/* User Management */}
      <Card>
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Benutzer verwalten ({(profiles as Profile[])?.length || 0})
        </h3>
        <UserManagement
          profiles={(profiles as Profile[]) || []}
          authMap={Object.fromEntries(authMap)}
        />
      </Card>
    </div>
  )
}
