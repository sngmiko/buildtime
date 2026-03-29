import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { TipBanner } from '@/components/ui/tip-banner'
import { getDismissedTips } from '@/actions/activity'
import { HardHat, Plus, MapPin, Calendar, Euro, Users } from 'lucide-react'
import type { ConstructionSite } from '@/lib/types'
import { formatNumber } from '@/lib/format'

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
    .select('role, company_id')
    .eq('id', user.id)
    .single()

  if (!profile || !['owner', 'foreman', 'super_admin'].includes(profile.role)) {
    redirect('/stempeln')
  }

  const [
    { data: sites },
    { data: timeEntries },
    { data: managers },
    dismissedTips,
  ] = await Promise.all([
    supabase
      .from('construction_sites')
      .select('*')
      .order('status')
      .order('name'),
    supabase
      .from('time_entries')
      .select('site_id, user_id')
      .eq('company_id', profile.company_id),
    supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .in('role', ['owner', 'foreman']),
    getDismissedTips(),
  ])

  // Build worker count per site
  const workersBySite: Record<string, Set<string>> = {}
  for (const entry of timeEntries || []) {
    if (!entry.site_id) continue
    if (!workersBySite[entry.site_id]) workersBySite[entry.site_id] = new Set()
    workersBySite[entry.site_id].add(entry.user_id)
  }

  // Build manager lookup
  const managerMap: Record<string, string> = {}
  for (const m of managers || []) {
    managerMap[m.id] = `${m.first_name} ${m.last_name}`
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Baustellen</h1>
        <div className="flex gap-2">
          <Link href="/baustellen/karte">
            <Button variant="outline"><MapPin className="h-4 w-4" /> Karte</Button>
          </Link>
          <Link href="/baustellen/neu">
            <Button>
              <Plus className="h-4 w-4" />
              Neue Baustelle
            </Button>
          </Link>
        </div>
      </div>

      {sites && sites.length > 0 && sites.length <= 2 && (
        <TipBanner tipKey="sites_qr" dismissed={dismissedTips.has('sites_qr')}>
          Tipp: Drucken Sie den QR-Code Ihrer Baustelle aus und hängen Sie ihn am Eingang auf. So können Mitarbeiter beim Betreten direkt einstempeln.
        </TipBanner>
      )}

      {(!sites || sites.length === 0) ? (
        <EmptyState
          icon={HardHat}
          title="Ihre Baustellen erscheinen hier"
          description="Legen Sie jetzt Ihre erste Baustelle an und Ihre Mitarbeiter können sofort Zeiten erfassen."
          actionLabel="Erste Baustelle anlegen"
          actionHref="/baustellen/neu"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(sites as ConstructionSite[]).map((site) => {
            const status = STATUS_LABELS[site.status] || STATUS_LABELS.active
            const workerCount = workersBySite[site.id]?.size || 0
            const managerName = site.site_manager ? managerMap[site.site_manager] : null
            return (
              <Link key={site.id} href={`/baustellen/${site.id}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate">{site.name}</h3>
                      {site.address && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{site.address}</span>
                        </p>
                      )}
                    </div>
                    <span className={`ml-2 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${status.color}`}>
                      {status.label}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500">
                    {(site.start_date || site.end_date) && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {site.start_date ? new Date(site.start_date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '?'}
                        {' – '}
                        {site.end_date ? new Date(site.end_date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' }) : 'offen'}
                      </span>
                    )}
                    {site.budget && (
                      <span className="flex items-center gap-1">
                        <Euro className="h-3 w-3" />
                        {formatNumber(Number(site.budget), 0)} €
                      </span>
                    )}
                    {workerCount > 0 && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {workerCount} Mitarbeiter
                      </span>
                    )}
                    {site.client_name && (
                      <span className="truncate text-slate-400">{site.client_name}</span>
                    )}
                    {managerName && (
                      <span className="flex items-center gap-1">
                        <HardHat className="h-3 w-3" />
                        {managerName}
                      </span>
                    )}
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
