import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { ChevronLeft, CloudSun, AlertCircle, Wrench, Boxes } from 'lucide-react'
import { DiaryEditForm } from './diary-edit-form'
import type { DiaryEntry, ConstructionSite } from '@/lib/types'

type EntryWithSite = DiaryEntry & { construction_sites: Pick<ConstructionSite, 'name'> | null }

export default async function DiaryEntryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['owner', 'foreman', 'super_admin'].includes(profile.role)) redirect('/stempeln')

  const [{ data: entry }, { data: sites }] = await Promise.all([
    supabase
      .from('diary_entries')
      .select('*, construction_sites(name)')
      .eq('id', id)
      .single(),
    supabase.from('construction_sites').select('id, name').order('name'),
  ])

  if (!entry) notFound()

  const e = entry as EntryWithSite

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/bautagebuch" className="text-slate-500 hover:text-slate-900">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {new Date(e.entry_date).toLocaleDateString('de-DE', {
              weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
            })}
          </h1>
          <p className="text-sm text-slate-500">
            {e.construction_sites?.name ?? 'Unbekannte Baustelle'}
          </p>
        </div>
      </div>

      {/* Weather summary */}
      {(e.weather || e.temperature !== null || e.wind) && (
        <Card className="p-4">
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <CloudSun className="h-4 w-4 text-[#f59e0b] shrink-0" />
            {e.weather && <span>{e.weather}</span>}
            {e.temperature !== null && <span>{e.temperature}°C</span>}
            {e.wind && <span>Wind: {e.wind}</span>}
          </div>
        </Card>
      )}

      {/* Tags */}
      {(e.incidents || e.defects || e.hindrances) && (
        <div className="flex flex-wrap gap-2">
          {e.incidents && (
            <span className="flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
              <AlertCircle className="h-3 w-3" />
              Vorkommnisse
            </span>
          )}
          {e.defects && (
            <span className="flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
              <Wrench className="h-3 w-3" />
              Mängel
            </span>
          )}
          {e.hindrances && (
            <span className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              <Boxes className="h-3 w-3" />
              Behinderungen
            </span>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Edit form */}
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Eintrag bearbeiten</h2>
          <DiaryEditForm
            entry={e}
            sites={(sites as ConstructionSite[]) || []}
          />
        </Card>

        {/* Read-only summary */}
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-slate-900">Zusammenfassung</h2>

          <Card>
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Arbeitsbeschreibung</h3>
            <p className="text-sm text-slate-600 whitespace-pre-wrap">{e.work_description}</p>
          </Card>

          {e.incidents && (
            <Card className="border-amber-200 bg-amber-50">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-700">
                <AlertCircle className="h-4 w-4" />
                Besondere Vorkommnisse
              </h3>
              <p className="text-sm text-amber-800 whitespace-pre-wrap">{e.incidents}</p>
            </Card>
          )}

          {e.defects && (
            <Card className="border-red-200 bg-red-50">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-700">
                <Wrench className="h-4 w-4" />
                Mängel
              </h3>
              <p className="text-sm text-red-800 whitespace-pre-wrap">{e.defects}</p>
            </Card>
          )}

          {e.hindrances && (
            <Card className="border-slate-200">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Boxes className="h-4 w-4" />
                Behinderungen
              </h3>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{e.hindrances}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
