import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Building2, TrendingUp } from 'lucide-react'
import type { CompanyExtended } from '@/lib/types'

const PLAN_BADGES: Record<string, string> = {
  trial: 'bg-amber-100 text-amber-800',
  starter: 'bg-blue-100 text-blue-800',
  business: 'bg-emerald-100 text-emerald-800',
  enterprise: 'bg-purple-100 text-purple-800',
}

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Use admin client for cross-company data
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const admin = createAdminClient()

  const { data: companies } = await admin.from('companies').select('*').order('created_at', { ascending: false })
  const typedCompanies = (companies as CompanyExtended[]) || []

  // Get employee counts per company
  const { data: profileCounts } = await admin.from('profiles').select('company_id')
  const countMap = new Map<string, number>()
  for (const p of profileCounts || []) {
    countMap.set(p.company_id, (countMap.get(p.company_id) || 0) + 1)
  }

  // Stats
  const totalCompanies = typedCompanies.length
  const activeTrials = typedCompanies.filter(c => c.plan === 'trial' && c.is_active).length
  const paying = typedCompanies.filter(c => c.plan !== 'trial' && c.is_active).length
  const mrr = typedCompanies.filter(c => c.is_active).reduce((s, c) => s + Number(c.monthly_price || 0), 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Kundenverwaltung</h1>
        <Link href="/admin/neu">
          <Button><Plus className="h-4 w-4" /> Neue Firma</Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="p-4 text-center">
          <Building2 className="mx-auto mb-2 h-6 w-6 text-[#1e3a5f]" />
          <p className="text-2xl font-bold text-slate-900">{totalCompanies}</p>
          <p className="text-xs text-slate-500">Firmen gesamt</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{activeTrials}</p>
          <p className="text-xs text-slate-500">Aktive Trials</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{paying}</p>
          <p className="text-xs text-slate-500">Zahlende Kunden</p>
        </Card>
        <Card className="p-4 text-center">
          <TrendingUp className="mx-auto mb-2 h-6 w-6 text-emerald-600" />
          <p className="text-2xl font-bold text-slate-900">{mrr.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</p>
          <p className="text-xs text-slate-500">MRR</p>
        </Card>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="pb-3 font-medium text-slate-500">Firma</th>
                <th className="pb-3 font-medium text-slate-500">Plan</th>
                <th className="pb-3 font-medium text-slate-500">MA</th>
                <th className="pb-3 font-medium text-slate-500">Status</th>
                <th className="pb-3 font-medium text-slate-500">Erstellt</th>
                <th className="pb-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {typedCompanies.map((c) => {
                const empCount = countMap.get(c.id) || 0
                const trialExpired = c.plan === 'trial' && c.trial_ends_at && new Date(c.trial_ends_at) < new Date()
                return (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="py-3 font-medium text-slate-900">{c.name}</td>
                    <td className="py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${PLAN_BADGES[c.plan]}`}>
                        {c.plan.charAt(0).toUpperCase() + c.plan.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 text-slate-600">{empCount} / {c.max_employees}</td>
                    <td className="py-3">
                      {!c.is_active ? (
                        <span className="text-xs text-red-600">Deaktiviert</span>
                      ) : trialExpired ? (
                        <span className="text-xs text-amber-600">Trial abgelaufen</span>
                      ) : (
                        <span className="text-xs text-emerald-600">Aktiv</span>
                      )}
                    </td>
                    <td className="py-3 text-slate-500">{new Date(c.created_at).toLocaleDateString('de-DE')}</td>
                    <td className="py-3 text-right">
                      <Link href={`/admin/${c.id}`}>
                        <Button variant="ghost" size="sm">Verwalten</Button>
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
