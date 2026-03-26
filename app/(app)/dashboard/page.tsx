import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Users, HardHat, Clock, Mail } from 'lucide-react'
import type { Profile } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name')
    .eq('id', user.id)
    .single<Pick<Profile, 'first_name'>>()

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Guten Morgen' : hour < 18 ? 'Guten Tag' : 'Guten Abend'

  const stats = [
    { label: 'Aktive Mitarbeiter', value: '12', icon: Users, color: 'text-[--color-primary]', bg: 'bg-blue-50' },
    { label: 'Aktive Baustellen', value: '4', icon: HardHat, color: 'text-[--color-accent-dark]', bg: 'bg-amber-50' },
    { label: 'Stunden heute', value: '47,5', icon: Clock, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Offene Einladungen', value: '2', icon: Mail, color: 'text-violet-600', bg: 'bg-violet-50' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {greeting}, {profile?.first_name || 'Willkommen'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Hier ist Ihre Tagesübersicht
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="flex items-center gap-4 p-5">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${stat.bg}`}>
                <Icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            </Card>
          )
        })}
      </div>

      <Card>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Letzte Aktivitäten</h2>
        <p className="text-sm text-slate-500">
          Aktivitäten werden ab Phase 2 hier angezeigt.
        </p>
      </Card>
    </div>
  )
}
