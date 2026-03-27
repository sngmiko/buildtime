import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { HardHat, Plus, MapPin } from 'lucide-react'
import type { ConstructionSite } from '@/lib/types'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: 'Aktiv', color: 'bg-emerald-100 text-emerald-700' },
  paused: { label: 'Pausiert', color: 'bg-amber-100 text-amber-700' },
  completed: { label: 'Abgeschlossen', color: 'bg-slate-100 text-slate-600' },
}

export default async function BaustellenPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['owner', 'foreman'].includes(profile.role)) {
    redirect('/stempeln')
  }

  const { data: sites } = await supabase
    .from('construction_sites')
    .select('*')
    .order('status')
    .order('name')

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Baustellen</h1>
        <Link href="/baustellen/neu">
          <Button>
            <Plus className="h-4 w-4" />
            Neue Baustelle
          </Button>
        </Link>
      </div>

      {(!sites || sites.length === 0) ? (
        <Card className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <HardHat className="h-8 w-8 text-slate-400" />
          </div>
          <p className="text-slate-500">Noch keine Baustellen vorhanden</p>
          <Link href="/baustellen/neu">
            <Button variant="accent">Erste Baustelle anlegen</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(sites as ConstructionSite[]).map((site) => {
            const status = STATUS_LABELS[site.status] || STATUS_LABELS.active
            return (
              <Link key={site.id} href={`/baustellen/${site.id}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{site.name}</h3>
                      {site.address && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                          <MapPin className="h-3 w-3" />
                          {site.address}
                        </p>
                      )}
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
