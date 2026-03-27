import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Building2, Users, ChevronRight, Mail, Clock, Shield } from 'lucide-react'
import type { Profile } from '@/lib/types'

const ROLE_LABELS: Record<string, string> = { owner: 'Inhaber', foreman: 'Bauleiter', worker: 'Arbeiter', super_admin: 'Admin' }
const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-purple-100 text-purple-700',
  foreman: 'bg-blue-100 text-blue-700',
  worker: 'bg-slate-100 text-slate-600',
  super_admin: 'bg-amber-100 text-amber-700',
}

type ProfileWithCompany = Profile & { companies: { name: string; plan: string; is_active: boolean } | null }
type AuthInfo = { email: string; last_sign_in_at: string | null; created_at: string }

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  const { data: profiles } = await admin
    .from('profiles')
    .select('*, companies(name, plan, is_active)')
    .order('company_id')
    .order('role')
    .order('last_name')

  const { data: { users: authUsers } } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const authMap = new Map<string, AuthInfo>(
    (authUsers || []).map(u => [u.id, { email: u.email || '', last_sign_in_at: u.last_sign_in_at || null, created_at: u.created_at }])
  )

  const typedProfiles = (profiles as ProfileWithCompany[]) || []

  // Group by company
  const byCompany = new Map<string, { name: string; plan: string; isActive: boolean; companyId: string; users: ProfileWithCompany[] }>()
  for (const p of typedProfiles) {
    const key = p.company_id
    if (!byCompany.has(key)) {
      byCompany.set(key, {
        name: p.companies?.name || 'Unbekannte Firma',
        plan: p.companies?.plan || 'trial',
        isActive: p.companies?.is_active ?? true,
        companyId: key,
        users: [],
      })
    }
    byCompany.get(key)!.users.push(p)
  }

  const companies = [...byCompany.values()].sort((a, b) => a.name.localeCompare(b.name))
  const totalUsers = typedProfiles.length
  const activeToday = typedProfiles.filter(p => {
    const auth = authMap.get(p.id)
    if (!auth?.last_sign_in_at) return false
    const last = new Date(auth.last_sign_in_at)
    const today = new Date()
    return last.toDateString() === today.toDateString()
  }).length
  const neverLoggedIn = typedProfiles.filter(p => !authMap.get(p.id)?.last_sign_in_at).length

  const PLAN_BADGES: Record<string, string> = {
    trial: 'bg-amber-100 text-amber-800',
    starter: 'bg-blue-100 text-blue-800',
    business: 'bg-emerald-100 text-emerald-800',
    enterprise: 'bg-purple-100 text-purple-800',
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Alle Benutzer</h1>
        <p className="text-sm text-slate-500">{totalUsers} Benutzer in {companies.length} Firmen</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="p-4 text-center">
          <Users className="mx-auto mb-1 h-5 w-5 text-[#1e3a5f]" />
          <p className="text-2xl font-bold text-slate-900">{totalUsers}</p>
          <p className="text-xs text-slate-500">Benutzer gesamt</p>
        </Card>
        <Card className="p-4 text-center">
          <Building2 className="mx-auto mb-1 h-5 w-5 text-emerald-600" />
          <p className="text-2xl font-bold text-slate-900">{companies.length}</p>
          <p className="text-xs text-slate-500">Firmen</p>
        </Card>
        <Card className="p-4 text-center">
          <Clock className="mx-auto mb-1 h-5 w-5 text-blue-600" />
          <p className="text-2xl font-bold text-emerald-600">{activeToday}</p>
          <p className="text-xs text-slate-500">Heute aktiv</p>
        </Card>
        <Card className="p-4 text-center">
          <Mail className="mx-auto mb-1 h-5 w-5 text-amber-600" />
          <p className="text-2xl font-bold text-amber-600">{neverLoggedIn}</p>
          <p className="text-xs text-slate-500">Noch nie eingeloggt</p>
        </Card>
      </div>

      {/* Grouped by company */}
      {companies.map((company) => (
        <Card key={company.companyId} className="p-0 overflow-hidden">
          {/* Company header */}
          <div className="flex items-center justify-between bg-slate-50 px-6 py-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1e3a5f] text-sm font-bold text-white">
                {company.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900">{company.name}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${PLAN_BADGES[company.plan] || PLAN_BADGES.trial}`}>
                    {company.plan.charAt(0).toUpperCase() + company.plan.slice(1)}
                  </span>
                  {!company.isActive && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">Deaktiviert</span>
                  )}
                </div>
                <p className="text-xs text-slate-500">{company.users.length} Benutzer</p>
              </div>
            </div>
            <Link href={`/admin/${company.companyId}`}>
              <Button variant="ghost" size="sm">
                Verwalten <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* User list */}
          <div className="divide-y divide-slate-100">
            {company.users.map((p) => {
              const auth = authMap.get(p.id)
              const lastLogin = auth?.last_sign_in_at ? new Date(auth.last_sign_in_at) : null
              const isRecent = lastLogin && (Date.now() - lastLogin.getTime()) < 24 * 3600000

              return (
                <div key={p.id} className="flex items-center justify-between px-6 py-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-medium text-slate-600">
                      {p.first_name.charAt(0)}{p.last_name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-900">{p.first_name} {p.last_name}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${ROLE_COLORS[p.role] || ROLE_COLORS.worker}`}>
                          {ROLE_LABELS[p.role] || p.role}
                        </span>
                        {p.role === 'super_admin' && <Shield className="h-3.5 w-3.5 text-amber-500" />}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {auth?.email || '–'}
                        </span>
                        {p.phone && <span>{p.phone}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {lastLogin ? (
                      <div className="text-right">
                        <div className="flex items-center gap-1.5">
                          <div className={`h-2 w-2 rounded-full ${isRecent ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                          <span className="text-xs text-slate-500">
                            {isRecent ? 'Heute aktiv' : lastLogin.toLocaleDateString('de-DE')}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          {lastLogin.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    ) : (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-600">
                        Noch nie eingeloggt
                      </span>
                    )}

                    <Link href={`/admin/${p.company_id}`}>
                      <Button variant="ghost" size="sm">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      ))}
    </div>
  )
}
