import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card } from '@/components/ui/card'
import type { CompanyExtended } from '@/lib/types'

export default async function AdminStatsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  const [
    { data: companies },
    { data: profiles },
    { data: timeEntries },
    { data: orders },
    { data: sites },
  ] = await Promise.all([
    admin.from('companies').select('*'),
    admin.from('profiles').select('company_id, role'),
    admin.from('time_entries').select('id', { count: 'exact', head: true }),
    admin.from('orders').select('id, status, budget'),
    admin.from('construction_sites').select('id', { count: 'exact', head: true }),
  ])

  const typedCompanies = (companies as CompanyExtended[]) || []
  const totalUsers = (profiles || []).length
  const totalWorkers = (profiles || []).filter((p: { role: string }) => p.role === 'worker').length
  const mrr = typedCompanies.filter(c => c.is_active).reduce((s, c) => s + Number(c.monthly_price || 0), 0)
  const arr = mrr * 12

  const trialCompanies = typedCompanies.filter(c => c.plan === 'trial')
  const paidCompanies = typedCompanies.filter(c => c.plan !== 'trial')
  const trialExpired = trialCompanies.filter(c => c.trial_ends_at && new Date(c.trial_ends_at) < new Date())
  const conversionRate = trialCompanies.length > 0 ? Math.round((paidCompanies.length / (paidCompanies.length + trialCompanies.length)) * 100) : 0

  const planDist = { trial: 0, starter: 0, business: 0, enterprise: 0 } as Record<string, number>
  for (const c of typedCompanies) planDist[c.plan] = (planDist[c.plan] || 0) + 1

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-slate-900">Statistiken</h1>

      {/* Revenue */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-emerald-600">{mrr.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</p>
          <p className="text-xs text-slate-500">MRR (Monthly Recurring Revenue)</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-slate-900">{arr.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</p>
          <p className="text-xs text-slate-500">ARR (Annual Recurring Revenue)</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-[#1e3a5f]">{typedCompanies.length}</p>
          <p className="text-xs text-slate-500">Firmen gesamt</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-[#1e3a5f]">{totalUsers}</p>
          <p className="text-xs text-slate-500">Benutzer gesamt</p>
        </Card>
      </div>

      {/* Conversion & Plans */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Trial-Conversion</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Aktive Trials</span>
              <span className="font-medium">{trialCompanies.length - trialExpired.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Abgelaufene Trials</span>
              <span className="font-medium text-amber-600">{trialExpired.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Zahlende Kunden</span>
              <span className="font-medium text-emerald-600">{paidCompanies.length}</span>
            </div>
            <div className="border-t border-slate-200 pt-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-900">Conversion Rate</span>
                <span className="text-lg font-bold text-[#1e3a5f]">{conversionRate}%</span>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Plan-Verteilung</h3>
          <div className="space-y-3">
            {[
              { key: 'trial', label: 'Trial', color: 'bg-amber-500' },
              { key: 'starter', label: 'Starter (49€)', color: 'bg-blue-500' },
              { key: 'business', label: 'Business (99€)', color: 'bg-emerald-500' },
              { key: 'enterprise', label: 'Enterprise (199€)', color: 'bg-purple-500' },
            ].map(plan => (
              <div key={plan.key}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-slate-600">{plan.label}</span>
                  <span className="font-medium">{planDist[plan.key] || 0}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${plan.color} transition-all`}
                    style={{ width: `${typedCompanies.length > 0 ? ((planDist[plan.key] || 0) / typedCompanies.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Platform Usage */}
      <Card>
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Plattform-Nutzung</h3>
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-900">{totalWorkers}</p>
            <p className="text-xs text-slate-500">Arbeiter</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-900">{timeEntries?.length || 0}</p>
            <p className="text-xs text-slate-500">Zeiteinträge</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-900">{(orders || []).length}</p>
            <p className="text-xs text-slate-500">Aufträge</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-900">{sites?.length || 0}</p>
            <p className="text-xs text-slate-500">Baustellen</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
