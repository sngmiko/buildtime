import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card } from '@/components/ui/card'
import { AdminSettingsForm } from './settings-form'
import { Shield, Database, Users } from 'lucide-react'

export default async function AdminSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'super_admin') redirect('/dashboard')

  const admin = createAdminClient()

  // Get platform stats
  const [
    { count: totalUsers },
    { count: totalCompanies },
    { count: totalTimeEntries },
    { count: totalOrders },
    { count: totalInvoices },
    { data: { users: authUsers } },
  ] = await Promise.all([
    admin.from('profiles').select('*', { count: 'exact', head: true }),
    admin.from('companies').select('*', { count: 'exact', head: true }),
    admin.from('time_entries').select('*', { count: 'exact', head: true }),
    admin.from('orders').select('*', { count: 'exact', head: true }),
    admin.from('invoices').select('*', { count: 'exact', head: true }),
    admin.auth.admin.listUsers({ perPage: 1 }),
  ])

  // Get super admins
  const { data: superAdmins } = await admin
    .from('profiles')
    .select('id, first_name, last_name')
    .eq('role', 'super_admin')

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Einstellungen</h1>
        <p className="text-sm text-slate-500">Plattform-Konfiguration für Nomad Solutions</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Platform Overview */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <Database className="h-5 w-5 text-[#1e3a5f]" />
            <h3 className="text-lg font-semibold text-slate-900">Plattform-Übersicht</h3>
          </div>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <dt className="text-slate-500">Benutzer gesamt</dt>
              <dd className="font-medium text-slate-900">{totalUsers || 0}</dd>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <dt className="text-slate-500">Firmen gesamt</dt>
              <dd className="font-medium text-slate-900">{totalCompanies || 0}</dd>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <dt className="text-slate-500">Zeiteinträge</dt>
              <dd className="font-medium text-slate-900">{totalTimeEntries || 0}</dd>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <dt className="text-slate-500">Aufträge</dt>
              <dd className="font-medium text-slate-900">{totalOrders || 0}</dd>
            </div>
            <div className="flex justify-between py-1">
              <dt className="text-slate-500">Rechnungen</dt>
              <dd className="font-medium text-slate-900">{totalInvoices || 0}</dd>
            </div>
          </dl>
        </Card>

        {/* Super Admins */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-5 w-5 text-amber-500" />
            <h3 className="text-lg font-semibold text-slate-900">Super-Admins</h3>
          </div>
          <div className="space-y-2">
            {(superAdmins || []).map((sa) => (
              <div key={sa.id} className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-xs font-medium text-amber-700">
                  {sa.first_name.charAt(0)}{sa.last_name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{sa.first_name} {sa.last_name}</p>
                  <p className="text-xs text-slate-500">Super-Admin</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Default Settings */}
        <Card className="lg:col-span-2">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Standard-Einstellungen für neue Firmen</h3>
          <AdminSettingsForm />
        </Card>
      </div>
    </div>
  )
}
