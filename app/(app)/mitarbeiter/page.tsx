import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { TipBanner } from '@/components/ui/tip-banner'
import { getDismissedTips } from '@/actions/activity'
import { Plus, UserPlus, Users, AlertTriangle } from 'lucide-react'
import type { ProfileExtended, Qualification } from '@/lib/types'
import { formatCurrency } from '@/lib/format'

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

  if (!currentProfile || !['owner', 'foreman', 'super_admin'].includes(currentProfile.role)) {
    redirect('/stempeln')
  }

  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

  const [
    { data: profiles },
    { data: pendingInvites },
    { data: expiringQuals },
    dismissedTips,
  ] = await Promise.all([
    supabase.from('profiles').select('*').order('last_name'),
    supabase
      .from('invitations')
      .select('*')
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false }),
    supabase
      .from('qualifications')
      .select('*, profiles(first_name, last_name)')
      .lte('expiry_date', thirtyDaysFromNow.toISOString())
      .gte('expiry_date', new Date().toISOString())
      .order('expiry_date'),
    getDismissedTips(),
  ])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Mitarbeiter</h1>
        <div className="flex gap-2">
          <Link href="/mitarbeiter/anlegen">
            <Button><Plus className="h-4 w-4" /> Anlegen</Button>
          </Link>
          <Link href="/mitarbeiter/einladen">
            <Button variant="outline"><UserPlus className="h-4 w-4" /> Einladen</Button>
          </Link>
        </div>
      </div>

      {profiles && profiles.length > 0 && (
        <Card className="bg-gradient-to-r from-[#1e3a5f] to-[#2d5f8a] text-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-200">Personalkosten (geschätzt/Monat)</p>
              <p className="text-2xl font-bold">
                {formatCurrency((profiles as ProfileExtended[]).reduce((sum, p) => sum + (p.monthly_salary || (p.hourly_rate || 0) * 168), 0))}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-200">Mitarbeiter</p>
              <p className="text-2xl font-bold">{profiles.length}</p>
            </div>
          </div>
        </Card>
      )}

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

      {profiles && profiles.length > 0 && profiles.length <= 2 && (
        <TipBanner tipKey="employees_invite" dismissed={dismissedTips.has('employees_invite')}>
          Tipp: Arbeiter brauchen nur den Einladungslink per WhatsApp. Sie setzen ein Passwort und können sofort Zeiten stempeln.
        </TipBanner>
      )}

      {(!profiles || profiles.length === 0) ? (
        <EmptyState
          icon={Users}
          title="Laden Sie Ihr Team ein"
          description="Mitarbeiter erhalten einen Link per WhatsApp und können sofort loslegen. Kein eigenes Konto nötig."
          actionLabel="Mitarbeiter einladen"
          actionHref="/mitarbeiter/einladen"
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="pb-3 font-medium text-slate-500">Name</th>
                  <th className="pb-3 font-medium text-slate-500">Rolle</th>
                  <th className="pb-3 font-medium text-slate-500">Telefon</th>
                  <th className="pb-3 font-medium text-slate-500">Vertrag</th>
                  <th className="pb-3 font-medium text-slate-500">Account</th>
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
                    <td className="py-3">
                      {(p as ProfileExtended & { has_account?: boolean }).has_account !== false ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">Account</span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">Kein Account</span>
                      )}
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
      )}

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
