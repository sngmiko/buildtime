import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { formatNumber } from '@/lib/format'
import {
  Briefcase, Users, Clock, HardHat, AlertTriangle,
  CheckCircle, ArrowRight, UserPlus, FileText, Activity,
} from 'lucide-react'
import type { OnboardingProgress } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, company_id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  // 8 essential queries
  const [
    { count: totalWorkers },
    { data: todayEntries },
    { count: activeSites },
    { data: activeOrders },
    { data: clockedIn },
    { data: onboarding },
    { data: activities },
    { count: overdueInvoiceCount },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).in('role', ['worker', 'foreman']),
    supabase.from('time_entries').select('clock_in, clock_out, break_minutes').gte('clock_in', todayStart.toISOString()),
    supabase.from('construction_sites').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('orders').select('id, title, budget, status').in('status', ['in_progress', 'commissioned']),
    supabase.from('time_entries').select('user_id, clock_in, site_id, profiles(first_name, last_name), construction_sites(name)').is('clock_out', null),
    supabase.from('onboarding_progress').select('*').eq('company_id', profile.company_id).maybeSingle(),
    supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(10),
    supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('status', 'sent').lte('due_date', new Date().toISOString()),
  ])

  // Calculate stats
  const todayHours = (todayEntries || []).reduce((s: number, e: { clock_in: string; clock_out: string | null; break_minutes: number }) => {
    if (!e.clock_out) return s
    return s + Math.max(0, (new Date(e.clock_out).getTime() - new Date(e.clock_in).getTime()) / 3600000 - e.break_minutes / 60)
  }, 0)

  const clockedInCount = (clockedIn || []).length
  const totalWorkersNum = totalWorkers || 0

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Guten Morgen' : hour < 18 ? 'Guten Tag' : 'Guten Abend'

  // Check if company is new (no data at all)
  const isNewCompany = !activeSites && !(activeOrders || []).length && !totalWorkersNum

  // Warnings
  const warnings: { type: 'critical' | 'warning' | 'info'; text: string; href: string }[] = []
  if ((overdueInvoiceCount || 0) > 0) warnings.push({ type: 'critical', text: `${overdueInvoiceCount} überfällige Rechnung(en)`, href: '/rechnungen' })

  // Onboarding
  const ob = onboarding as OnboardingProgress | null
  const obDone = ob ? [ob.profile_completed, ob.first_site_created, ob.first_employee_invited, ob.first_time_entry, ob.first_order_created].filter(Boolean).length : 0
  const obTotal = 5
  const showOnboarding = ob && obDone < obTotal

  return (
    <div className="flex flex-col gap-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{greeting}, {profile.first_name || 'Willkommen'}</h1>
        <p className="text-sm text-slate-500">
          {new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* NEW COMPANY — Empty state with setup cards */}
      {isNewCompany && (
        <div className="rounded-2xl bg-gradient-to-r from-[#1e3a5f] to-[#2d5f8a] p-8 text-white">
          <h2 className="text-xl font-bold">Willkommen bei NomadWorks!</h2>
          <p className="mt-2 text-blue-200">In 5 Minuten sind Sie startklar. Folgen Sie diesen Schritten:</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: HardHat, label: 'Erste Baustelle anlegen', desc: 'Damit Ihre Mitarbeiter Zeiten erfassen können', href: '/baustellen/neu' },
              { icon: UserPlus, label: 'Mitarbeiter einladen', desc: 'Per WhatsApp-Link — kein Konto nötig', href: '/mitarbeiter/einladen' },
              { icon: Clock, label: 'Zeiterfassung testen', desc: 'Stempeln Sie sich selbst ein', href: '/stempeln' },
              { icon: Briefcase, label: 'Ersten Auftrag erstellen', desc: 'Kosten und Margen im Blick behalten', href: '/auftraege/neu' },
            ].map((step) => {
              const Icon = step.icon
              return (
                <Link key={step.href} href={step.href}>
                  <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm hover:bg-white/20 transition-colors">
                    <Icon className="h-8 w-8 text-[#f59e0b]" />
                    <h3 className="mt-2 font-semibold">{step.label}</h3>
                    <p className="mt-1 text-xs text-blue-200">{step.desc}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="flex flex-col gap-2">
          {warnings.map((w, i) => (
            <Link key={i} href={w.href}>
              <div className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors hover:opacity-90 ${
                w.type === 'critical' ? 'bg-red-50 border border-red-200 text-red-700' :
                w.type === 'warning' ? 'bg-amber-50 border border-amber-200 text-amber-700' :
                'bg-blue-50 border border-blue-200 text-blue-700'
              }`}>
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {w.text}
                <ArrowRight className="ml-auto h-4 w-4" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {!isNewCompany && warnings.length === 0 && (
        <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-medium text-emerald-700">
          <CheckCircle className="h-4 w-4" />
          Alles in Ordnung. Keine offenen Warnungen.
        </div>
      )}

      {/* Main content: KPIs + Activity feed */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: KPIs (2/3 width) */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Mitarbeiter */}
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <Users className="h-5 w-5 text-[#1e3a5f]" />
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">{formatNumber(totalWorkersNum)} Mitarbeiter</p>
              <p className="mt-1 text-xs text-slate-500">
                {clockedInCount} heute aktiv
              </p>
            </Card>

            {/* Stunden */}
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <Clock className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">{formatNumber(todayHours, 1)}h heute</p>
              {clockedInCount > 0 && (
                <p className="mt-1 text-xs text-emerald-600 font-medium">{clockedInCount} gerade eingestempelt</p>
              )}
            </Card>

            {/* Aufträge */}
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <Briefcase className="h-5 w-5 text-amber-600" />
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">{(activeOrders || []).length} laufende Aufträge</p>
              <p className="mt-1 text-xs text-slate-500">{activeSites || 0} aktive Baustellen</p>
            </Card>

            {/* Eingestempelt */}
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <Clock className="h-5 w-5 text-emerald-500" />
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">{clockedInCount} eingestempelt</p>
              <p className="mt-1 text-xs text-slate-500">gerade aktiv</p>
            </Card>

            {/* Baustellen */}
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <HardHat className="h-5 w-5 text-blue-600" />
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">{activeSites || 0} Baustellen</p>
              <p className="mt-1 text-xs text-slate-500">aktiv</p>
            </Card>

            {/* Rechnungen */}
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <FileText className="h-5 w-5 text-violet-600" />
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">
                {(overdueInvoiceCount || 0) === 0 ? 'Keine fällig' : `${overdueInvoiceCount} überfällig`}
              </p>
              <p className={`mt-1 text-xs ${(overdueInvoiceCount || 0) > 0 ? 'text-red-600 font-medium' : 'text-slate-500'}`}>
                {(overdueInvoiceCount || 0) > 0 ? 'Zahlungen ausstehend' : 'Alle Rechnungen bezahlt oder offen'}
              </p>
            </Card>
          </div>

          {/* Currently clocked in */}
          {clockedIn && clockedIn.length > 0 && (
            <Card>
              <h2 className="mb-3 text-lg font-semibold text-slate-900">Aktuell eingestempelt</h2>
              <div className="divide-y divide-slate-100">
                {clockedIn.map((entry: Record<string, unknown>) => {
                  const p = entry.profiles as { first_name: string; last_name: string } | null
                  const s = entry.construction_sites as { name: string } | null
                  const since = new Date(entry.clock_in as string).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
                  const duration = Math.round((Date.now() - new Date(entry.clock_in as string).getTime()) / 3600000 * 10) / 10
                  return (
                    <div key={entry.user_id as string} className="flex items-center justify-between py-2.5 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="font-medium text-slate-900">{p?.first_name} {p?.last_name}</span>
                        <span className="text-slate-500">{s?.name}</span>
                      </div>
                      <span className="text-xs text-slate-400">seit {since} ({formatNumber(duration, 1)}h)</span>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {/* Onboarding checklist */}
          {showOnboarding && ob && (
            <Card>
              <h2 className="mb-3 text-lg font-semibold text-slate-900">Erste Schritte</h2>
              <div className="space-y-2">
                {[
                  { done: ob.profile_completed, label: 'Firmendaten vervollständigt', href: '/firma' },
                  { done: ob.first_site_created, label: 'Erste Baustelle angelegt', href: '/baustellen/neu' },
                  { done: ob.first_employee_invited, label: 'Mitarbeiter eingeladen', href: '/mitarbeiter/einladen' },
                  { done: ob.first_time_entry, label: 'Erste Zeiterfassung', href: '/stempeln' },
                  { done: ob.first_order_created, label: 'Ersten Auftrag erstellt', href: '/auftraege/neu' },
                ].map((step) => (
                  <Link key={step.label} href={step.href} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-50 transition-colors">
                    <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${step.done ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'}`}>
                      {step.done && <CheckCircle className="h-3 w-3 text-white" />}
                    </div>
                    <span className={`text-sm ${step.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{step.label}</span>
                  </Link>
                ))}
              </div>
              <div className="mt-3 h-2 rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${(obDone / obTotal) * 100}%` }} />
              </div>
              <p className="mt-1.5 text-xs text-slate-400">{obDone} von {obTotal} erledigt</p>
            </Card>
          )}
        </div>

        {/* Right: Activity Feed (1/3 width) */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-[#1e3a5f]" />
            <h2 className="text-lg font-semibold text-slate-900">Aktivitäten</h2>
          </div>

          {(!activities || activities.length === 0) ? (
            <Card className="py-8 text-center text-sm text-slate-400">
              Noch keine Aktivitäten. Sobald Sie oder Ihr Team loslegen, erscheinen hier alle Aktionen.
            </Card>
          ) : (
            <div className="space-y-1">
              {(activities as { id: string; action: string; title: string; entity_type: string; created_at: string }[]).map((a) => {
                const colors: Record<string, string> = {
                  clock_in: 'bg-emerald-500', clock_out: 'bg-blue-500',
                  create: 'bg-[#1e3a5f]', update: 'bg-slate-400',
                  delete: 'bg-red-500', status_change: 'bg-amber-500',
                }
                const timeAgo = getTimeAgo(a.created_at)

                return (
                  <div key={a.id} className="flex gap-3 rounded-lg px-3 py-2 hover:bg-slate-50 transition-colors">
                    <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${colors[a.action] || 'bg-slate-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 truncate">{a.title}</p>
                      <p className="text-[10px] text-slate-400">{timeAgo}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function getTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Gerade eben'
  if (mins < 60) return `vor ${mins} Min.`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `vor ${hours} Std.`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Gestern'
  return `vor ${days} Tagen`
}
