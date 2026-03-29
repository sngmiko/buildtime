import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { TipBanner } from '@/components/ui/tip-banner'
import { getDismissedTips } from '@/actions/activity'
import { Plus, BookOpen, CloudSun, AlertCircle, Wrench, Boxes } from 'lucide-react'
import type { DiaryEntry, ConstructionSite } from '@/lib/types'

type DiaryEntryWithSite = DiaryEntry & { construction_sites: Pick<ConstructionSite, 'name'> | null }

export default async function BautagebuchPage({
  searchParams,
}: {
  searchParams: Promise<{ site?: string }>
}) {
  const { site: siteFilter } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['owner', 'foreman', 'super_admin'].includes(profile.role)) redirect('/stempeln')

  const [{ data: sites }, { data: entries }, dismissedTips] = await Promise.all([
    supabase.from('construction_sites').select('id, name').order('name'),
    siteFilter
      ? supabase
          .from('diary_entries')
          .select('*, construction_sites(name)')
          .eq('site_id', siteFilter)
          .order('entry_date', { ascending: false })
      : supabase
          .from('diary_entries')
          .select('*, construction_sites(name)')
          .order('entry_date', { ascending: false })
          .limit(50),
    getDismissedTips(),
  ])

  const activeSite = siteFilter ? (sites || []).find(s => s.id === siteFilter) : null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bautagebuch</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {activeSite ? activeSite.name : 'Alle Baustellen'}
          </p>
        </div>
        <Link href="/bautagebuch/neu">
          <Button>
            <Plus className="h-4 w-4" />
            Neuer Eintrag
          </Button>
        </Link>
      </div>

      {/* Site filter */}
      {sites && sites.length > 0 && (
        <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-white p-1">
          <Link
            href="/bautagebuch"
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              !siteFilter ? 'bg-[#1e3a5f] text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Alle
          </Link>
          {sites.map(site => (
            <Link
              key={site.id}
              href={`?site=${site.id}`}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                siteFilter === site.id ? 'bg-[#1e3a5f] text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {site.name}
            </Link>
          ))}
        </div>
      )}

      {entries && entries.length > 0 && entries.length <= 2 && (
        <TipBanner tipKey="diary_weather" dismissed={dismissedTips.has('diary_weather')}>
          Tipp: Klicken Sie auf &apos;Wetter laden&apos; — BuildTime holt das aktuelle Wetter automatisch per GPS und füllt die Felder für Sie.
        </TipBanner>
      )}

      {(!entries || entries.length === 0) ? (
        <EmptyState
          icon={BookOpen}
          title="Ihr Bautagebuch"
          description="Dokumentieren Sie täglich den Fortschritt auf Ihren Baustellen. Wetter, Arbeiten, Vorkommnisse und Mängel — alles an einem Ort."
          actionLabel="Ersten Eintrag erstellen"
          actionHref="/bautagebuch/neu"
        />
      ) : (
        <div className="flex flex-col gap-3">
          {(entries as DiaryEntryWithSite[]).map((entry) => (
            <Link key={entry.id} href={`/bautagebuch/${entry.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-bold text-[#1e3a5f]">
                      {new Date(entry.entry_date).toLocaleDateString('de-DE', {
                        weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric'
                      })}
                    </span>
                    {entry.construction_sites && (
                      <span className="text-xs text-slate-500 bg-slate-100 rounded-full px-2 py-0.5">
                        {entry.construction_sites.name}
                      </span>
                    )}
                  </div>

                  {(entry.weather || entry.temperature !== null || entry.wind) && (
                    <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-500">
                      <CloudSun className="h-3.5 w-3.5 shrink-0" />
                      {entry.weather && <span>{entry.weather}</span>}
                      {entry.temperature !== null && <span>{entry.temperature}°C</span>}
                      {entry.wind && <span>Wind: {entry.wind}</span>}
                    </div>
                  )}

                  <p className="mt-2 text-sm text-slate-700 line-clamp-2">{entry.work_description}</p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {entry.incidents && (
                      <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                        <AlertCircle className="h-3 w-3" />
                        Vorkommnisse
                      </span>
                    )}
                    {entry.defects && (
                      <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
                        <Wrench className="h-3 w-3" />
                        Mängel
                      </span>
                    )}
                    {entry.hindrances && (
                      <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                        <Boxes className="h-3 w-3" />
                        Behinderungen
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
