import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Profile } from '@/lib/types'

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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mitarbeiter</h1>
        <Link href="/mitarbeiter/einladen">
          <Button>Einladen</Button>
        </Link>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-700">
                <th className="pb-3 font-medium text-zinc-500">Name</th>
                <th className="pb-3 font-medium text-zinc-500">Rolle</th>
                <th className="pb-3 font-medium text-zinc-500">Telefon</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {(profiles as Profile[])?.map((p) => (
                <tr key={p.id}>
                  <td className="py-3 font-medium">
                    {p.first_name} {p.last_name}
                  </td>
                  <td className="py-3 text-zinc-600 dark:text-zinc-400">
                    {ROLE_LABELS[p.role] || p.role}
                  </td>
                  <td className="py-3 text-zinc-600 dark:text-zinc-400">
                    {p.phone || '–'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {pendingInvites && pendingInvites.length > 0 && (
        <>
          <h2 className="text-lg font-semibold">Offene Einladungen</h2>
          <Card>
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {pendingInvites.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <span className="font-medium">{inv.email || 'Kein E-Mail'}</span>
                    <span className="ml-2 text-zinc-500">{ROLE_LABELS[inv.role]}</span>
                  </div>
                  <span className="text-zinc-400">
                    Läuft ab: {new Date(inv.expires_at).toLocaleDateString('de-DE')}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
