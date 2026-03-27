import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { Profile } from '@/lib/types'

const ROLE_LABELS: Record<string, string> = { owner: 'Inhaber', foreman: 'Bauleiter', worker: 'Arbeiter', super_admin: 'Admin' }

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  const { data: profiles } = await admin.from('profiles').select('*, companies(name)').order('created_at', { ascending: false })
  const { data: { users: authUsers } } = await admin.auth.admin.listUsers({ perPage: 1000 })

  const authMap = new Map((authUsers || []).map(u => [u.id, { email: u.email || '', last_sign_in_at: u.last_sign_in_at }]))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Alle Benutzer</h1>
          <p className="text-sm text-slate-500">{(profiles || []).length} Benutzer in {new Set((profiles || []).map((p: { company_id: string }) => p.company_id)).size} Firmen</p>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="pb-3 font-medium text-slate-500">Name</th>
                <th className="pb-3 font-medium text-slate-500">E-Mail</th>
                <th className="pb-3 font-medium text-slate-500">Rolle</th>
                <th className="pb-3 font-medium text-slate-500">Firma</th>
                <th className="pb-3 font-medium text-slate-500">Letzter Login</th>
                <th className="pb-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(profiles as (Profile & { companies: { name: string } | null })[] || []).map((p) => {
                const auth = authMap.get(p.id)
                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-3 font-medium text-slate-900">{p.first_name} {p.last_name}</td>
                    <td className="py-3 text-slate-600">{auth?.email || '–'}</td>
                    <td className="py-3">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {ROLE_LABELS[p.role] || p.role}
                      </span>
                    </td>
                    <td className="py-3 text-slate-600">{p.companies?.name || '–'}</td>
                    <td className="py-3 text-slate-500 text-xs">
                      {auth?.last_sign_in_at ? new Date(auth.last_sign_in_at).toLocaleString('de-DE') : 'Noch nie'}
                    </td>
                    <td className="py-3 text-right">
                      <Link href={`/admin/${p.company_id}`}>
                        <Button variant="ghost" size="sm">Firma</Button>
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
