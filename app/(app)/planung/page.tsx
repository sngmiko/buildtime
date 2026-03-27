import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { ScheduleGrid } from './schedule-grid'
import type { ScheduleEntry } from '@/lib/types'

function getMondayOfWeek(offset: number): Date {
  const now = new Date()
  const day = now.getDay() // 0=Sun, 1=Mon...
  const diffToMonday = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + diffToMonday + offset * 7)
  monday.setHours(0, 0, 0, 0)
  return monday
}

function isoDate(d: Date) {
  return d.toISOString().split('T')[0]
}

export default async function PlanungPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>
}) {
  const { week } = await searchParams
  const weekOffset = parseInt(week || '0', 10)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role, company_id').eq('id', user.id).single()
  if (!profile || !['owner', 'foreman'].includes(profile.role)) redirect('/stempeln')

  const monday = getMondayOfWeek(weekOffset)
  const weekDates: string[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return isoDate(d)
  })

  const [workersRes, sitesRes, entriesRes] = await Promise.all([
    supabase.from('profiles').select('id, first_name, last_name').in('role', ['worker', 'foreman']).order('last_name'),
    supabase.from('construction_sites').select('id, name').eq('status', 'active').order('name'),
    supabase
      .from('schedule_entries')
      .select('*, construction_sites(name)')
      .gte('date', weekDates[0])
      .lte('date', weekDates[6])
      .order('date'),
  ])

  const workers = workersRes.data || []
  const sites = sitesRes.data || []
  const entries = (entriesRes.data || []) as (ScheduleEntry & { construction_sites: { name: string } | null })[]

  // Build entryMap: workerId -> date -> entry
  const entryMap: Record<string, Record<string, typeof entries[number]>> = {}
  for (const e of entries) {
    if (!entryMap[e.user_id]) entryMap[e.user_id] = {}
    entryMap[e.user_id][e.date] = e
  }

  const prevWeek = weekOffset - 1
  const nextWeek = weekOffset + 1
  const weekLabel = `${new Date(weekDates[0]).toLocaleDateString('de-DE', { day: '2-digit', month: 'long' })} – ${new Date(weekDates[6]).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}`

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Disposition</h1>
        <div className="flex items-center gap-2">
          <Link
            href={prevWeek === 0 ? '/planung' : `?week=${prevWeek}`}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
            aria-label="Vorherige Woche"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900">
            <CalendarDays className="h-4 w-4 text-[#1e3a5f]" />
            {weekLabel}
          </div>
          <Link
            href={nextWeek === 0 ? '/planung' : `?week=${nextWeek}`}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
            aria-label="Nächste Woche"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
          {weekOffset !== 0 && (
            <Link
              href="/planung"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Heute
            </Link>
          )}
        </div>
      </div>

      {/* Legend */}
      {sites.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {sites.map((site) => (
            <span
              key={site.id}
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                (() => {
                  const SITE_COLORS = [
                    'bg-blue-100 text-blue-800',
                    'bg-emerald-100 text-emerald-800',
                    'bg-violet-100 text-violet-800',
                    'bg-amber-100 text-amber-800',
                    'bg-pink-100 text-pink-800',
                    'bg-cyan-100 text-cyan-800',
                  ]
                  let hash = 0
                  for (let i = 0; i < site.id.length; i++) hash = (hash * 31 + site.id.charCodeAt(i)) | 0
                  return SITE_COLORS[Math.abs(hash) % SITE_COLORS.length]
                })()
              }`}
            >
              {site.name}
            </span>
          ))}
        </div>
      )}

      <Card className="p-0 overflow-hidden">
        <div className="p-6">
          <ScheduleGrid
            workers={workers}
            sites={sites}
            weekDates={weekDates}
            entryMap={entryMap}
          />
        </div>
      </Card>
    </div>
  )
}
