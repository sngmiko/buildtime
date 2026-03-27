import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, AlertTriangle } from 'lucide-react'
import type { ProfileExtended, Qualification } from '@/lib/types'

const ROLE_LABELS: Record<string, string> = {
  owner: 'Inhaber',
  foreman: 'Bauleiter',
  worker: 'Arbeiter',
}

export default async function MitarbeiterPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!currentProfile || !['owner', 'foreman'].includes(currentProfile.role)) {
    redirect('/stempeln')
  }

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('last_name')

  const { data: pendingInvites } = await supabase
    .from('invitations')
    .select('*')
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
  const { data: expiringQuals } = await supabase
    .from('qualifications')
    .select('*, profiles(first_name, last_name)')
    .lte('expiry_date', thirtyDaysFromNow.toISOString())
    .gte('expiry_date', new Date().toISOString())
    .order('expiry_date')

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Mitarbeiter</h1>
        <Link href="/mitarbeiter/einladen">
          <Button><Plus className="h-4 w-4" /> Einladen</Button>
        </Link>
      </div>

      {expiringQuals && expiringQuals.length > 0 && (
        <Card className="border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-amber-700">
            <AlertTriangle className="h-4 w-4" />
            {expiringQuals.length} Qualifikation(en) laufen in den nächsten 30 Tagen ab
          </div>
          <div className="mt-2 space-y-1">
            {(expiringQuals as (Qualification & { profiles: { first_name: string; last_name: string } | null })[]).map((q) => (
              <p key={q.id} className="text-xs text-amber-600">
                {q.profiles?.first_name} {q.profiles?.last_name}: {q.name} — läuft ab am {new Date(q.expiry_date!).toLocaleDateString('de-DE')}
              </p>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="pb-3 font-medium text-slate-500">Name</th>
                <th className="pb-3 font-medium text-slate-500">Rolle</th>
                <th className="pb-3 font-medium text-slate-500">Telefon</th>
                <th className="pb-3 font-medium text-slate-500">Vertrag</th>
                <th className="pb-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(profiles as ProfileExtended[])?.map((p) => (
                <tr key={p.id}>
                  <td className="py-3 font-medium text-slate-900">{p.first_name} {p.last_name}</td>
                  <td className="py-3 text-slate-600">{ROLE_LABELS[p.role] || p.role}</td>
                  <td className="py-3 text-slate-600">{p.phone || '–'}</td>
                  <td className="py-3 text-slate-600">
                    {p.contract_type ? { permanent: 'Fest', temporary: 'Befristet', minijob: 'Minijob', intern: 'Praktikum' }[p.contract_type] : '–'}
                  </td>
                  <td className="py-3 text-right">
                    <Link href={`/mitarbeiter/${p.id}`}>
                      <Button variant="ghost" size="sm">Details</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {pendingInvites && pendingInvites.length > 0 && (
        <>
          <h2 className="text-lg font-semibold text-slate-900">Offene Einladungen</h2>
          <Card>
            <div className="divide-y divide-slate-100">
              {pendingInvites.map((inv: { id: string; email: string | null; role: string; expires_at: string }) => (
                <div key={inv.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <span className="font-medium text-slate-900">{inv.email || 'Kein E-Mail'}</span>
                    <span className="ml-2 text-slate-500">{ROLE_LABELS[inv.role]}</span>
                  </div>
                  <span className="text-slate-400">Läuft ab: {new Date(inv.expires_at).toLocaleDateString('de-DE')}</span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
