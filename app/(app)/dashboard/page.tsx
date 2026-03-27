import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import {
  Briefcase, TrendingUp, TrendingDown, Euro, Users, AlertTriangle,
  Clock, Star, CloudSun, Check
} from 'lucide-react'
import type { OnboardingProgress } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, company_id, role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')
  if (!['owner', 'foreman'].includes(profile.role)) redirect('/stempeln')

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()
  const todayStr = now.toISOString().split('T')[0]
  const in30Str = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const todayStart = new Date(now.toISOString().split('T')[0] + 'T00:00:00.000Z').toISOString()

  // Parallel data fetching
  const [
    { count: inProgressCount },
    { data: quoteOrders },
    { data: completedThisMonth },
    { data: allWorkers },
    { data: clockedInToday },
    { data: clockedInNow },
    { data: topOrders },
    { data: expiringQuals },
    { data: expiringTax },
    { data: vehicleInspections },
    { data: lowStockMaterials },
    { data: onboardingProgressRaw },
  ] = await Promise.all([
    // 1. In-progress orders count
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
    // 2. Quote orders (for sum of order_items)
    supabase.from('orders').select('id').eq('status', 'quote'),
    // 3. Completed orders this month
    supabase.from('orders').select('id, budget').eq('status', 'completed')
      .gte('updated_at', monthStart).lte('updated_at', monthEnd),
    // 4. All workers
    supabase.from('profiles').select('id, hourly_rate').eq('role', 'worker'),
    // 5. Workers clocked in today
    supabase.from('time_entries').select('user_id').gte('clock_in', todayStart),
    // 6. Currently clocked in (for bottom section)
    supabase.from('time_entries').select('user_id, clock_in, profiles(first_name, last_name), construction_sites(name)').is('clock_out', null),
    // 7. Top orders for margin analysis
    supabase.from('orders').select('id, title, budget, status, customers(name)').in('status', ['in_progress', 'completed', 'commissioned']).limit(20),
    // 8. Expiring qualifications
    supabase.from('qualifications').select('name, expiry_date, profiles(first_name, last_name)')
      .gte('expiry_date', todayStr).lte('expiry_date', in30Str),
    // 9. Expiring tax exemptions (subcontractors)
    supabase.from('subcontractors').select('name, tax_exemption_valid_until')
      .gte('tax_exemption_valid_until', todayStr).lte('tax_exemption_valid_until', in30Str),
    // 10. Vehicle inspections soon
    supabase.from('vehicles').select('make, model, license_plate, next_inspection')
      .gte('next_inspection', todayStr).lte('next_inspection', in30Str),
    // 11. Low stock materials
    supabase.from('materials').select('name, current_stock, min_stock'),
    // 12. Onboarding progress
    supabase.from('onboarding_progress').select('*').eq('company_id', profile.company_id).maybeSingle(),
  ])

  // Calculate open quotes value
  const quoteIds = (quoteOrders || []).map(o => o.id)
  let openQuotesValue = 0
  if (quoteIds.length > 0) {
    const { data: quoteItems } = await supabase
      .from('order_items')
      .select('quantity, unit_price')
      .in('order_id', quoteIds)
    openQuotesValue = (quoteItems || []).reduce((sum, i) => sum + i.quantity * i.unit_price, 0)
  }

  // Revenue this month from completed orders
  const monthRevenue = (completedThisMonth || []).reduce((sum, o) => sum + (o.budget || 0), 0)

  // Worker utilization
  const totalWorkers = (allWorkers || []).length
  const clockedTodayIds = new Set((clockedInToday || []).map((e: Record<string, unknown>) => e.user_id))
  const utilization = totalWorkers > 0 ? Math.round((clockedTodayIds.size / totalWorkers) * 100) : 0

  // Expiring documents count
  const expiringDocs = (expiringQuals || []).length + (expiringTax || []).length + (vehicleInspections || []).length

  // Labor cost / revenue ratio (this month)
  const avgRate = (allWorkers || []).reduce((sum, w) => sum + (w.hourly_rate || 0), 0) / Math.max(totalWorkers, 1)
  // Estimate: clocked in count * avg 8h * avg rate
  const estimatedLaborCost = clockedTodayIds.size * 8 * avgRate

  // Order margin analysis
  const topOrderIds = (topOrders || []).map(o => o.id)
  let itemsMap = new Map<string, number>()
  let costsMap = new Map<string, number>()
  if (topOrderIds.length > 0) {
    const [{ data: items }, { data: costs }] = await Promise.all([
      supabase.from('order_items').select('order_id, quantity, unit_price').in('order_id', topOrderIds),
      supabase.from('order_costs').select('order_id, amount').in('order_id', topOrderIds),
    ])
    for (const item of items || []) {
      itemsMap.set(item.order_id, (itemsMap.get(item.order_id) || 0) + item.quantity * item.unit_price)
    }
    for (const cost of costs || []) {
      costsMap.set(cost.order_id, (costsMap.get(cost.order_id) || 0) + cost.amount)
    }
  }

  type OrderRow = { id: string; title: string; budget: number | null; status: string; customers: { name: string }[] | null }
  const ordersWithMargin = (topOrders as unknown as OrderRow[] || [])
    .map(o => {
      const revenue = itemsMap.get(o.id) || 0
      const costs = costsMap.get(o.id) || 0
      const margin = revenue > 0 ? ((revenue - costs) / revenue) * 100 : null
      return { ...o, revenue, costs, margin }
    })
    .filter(o => o.margin !== null)
    .sort((a, b) => (b.margin ?? 0) - (a.margin ?? 0))

  const top5Profitable = ordersWithMargin.slice(0, 5)
  const top5Loss = [...ordersWithMargin].sort((a, b) => (a.margin ?? 0) - (b.margin ?? 0)).slice(0, 5)

  // Low stock
  const lowStock = (lowStockMaterials || []).filter(m => m.current_stock <= m.min_stock)

  // Onboarding checklist
  const onboarding = onboardingProgressRaw as OnboardingProgress | null
  const onboardingSteps = onboarding ? [
    { label: 'Firmendaten vervollständigen', done: onboarding.profile_completed, href: '/onboarding' },
    { label: 'Erste Baustelle anlegen', done: onboarding.first_site_created, href: '/baustellen' },
    { label: 'Mitarbeiter einladen', done: onboarding.first_employee_invited, href: '/mitarbeiter' },
    { label: 'Erste Zeiterfassung', done: onboarding.first_time_entry, href: '/zeiterfassung' },
    { label: 'Ersten Auftrag erstellen', done: onboarding.first_order_created, href: '/auftraege' },
  ] : []
  const doneCount = onboardingSteps.filter(s => s.done).length
  const allDone = doneCount === onboardingSteps.length

  const hour = now.getHours()
  const greeting = hour < 12 ? 'Guten Morgen' : hour < 18 ? 'Guten Tag' : 'Guten Abend'

  const stats = [
    {
      label: 'Laufende Aufträge',
      value: String(inProgressCount || 0),
      icon: Briefcase,
      color: 'text-[#1e3a5f]',
      bg: 'bg-blue-50',
    },
    {
      label: 'Offene Angebote',
      value: openQuotesValue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }),
      icon: TrendingUp,
      color: 'text-[#d97706]',
      bg: 'bg-amber-50',
    },
    {
      label: 'Umsatz diesen Monat',
      value: monthRevenue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }),
      icon: Euro,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Personalkosten (heute est.)',
      value: estimatedLaborCost > 0
        ? estimatedLaborCost.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
        : '—',
      icon: Users,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
    },
    {
      label: 'Mitarbeiter-Auslastung',
      value: `${clockedTodayIds.size}/${totalWorkers}`,
      subtitle: `${utilization}% heute`,
      icon: Clock,
      color: utilization >= 70 ? 'text-emerald-600' : utilization >= 40 ? 'text-[#d97706]' : 'text-red-500',
      bg: utilization >= 70 ? 'bg-emerald-50' : utilization >= 40 ? 'bg-amber-50' : 'bg-red-50',
    },
    {
      label: 'Ablaufende Dokumente',
      value: String(expiringDocs),
      subtitle: 'in den nächsten 30 Tagen',
      icon: AlertTriangle,
      color: expiringDocs > 0 ? 'text-red-500' : 'text-emerald-600',
      bg: expiringDocs > 0 ? 'bg-red-50' : 'bg-emerald-50',
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {greeting}, {profile.first_name || 'Willkommen'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {now.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Row 1: Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                {'subtitle' in stat && stat.subtitle && (
                  <p className="text-xs text-slate-400">{stat.subtitle}</p>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {/* Onboarding checklist */}
      {onboarding && !allDone && (
        <Card>
          <h2 className="mb-3 text-lg font-semibold">Erste Schritte</h2>
          <div className="space-y-2">
            {onboardingSteps.map(s => (
              <Link key={s.label} href={s.href} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-50">
                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${s.done ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'}`}>
                  {s.done && <Check className="h-3 w-3 text-white" />}
                </div>
                <span className={`text-sm ${s.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{s.label}</span>
              </Link>
            ))}
          </div>
          <div className="mt-3 h-2 rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${(doneCount / 5) * 100}%` }} />
          </div>
        </Card>
      )}

      {/* Row 2: Margin analysis */}
      {ordersWithMargin.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Top 5 profitable */}
          <Card>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              Top 5 – Ertragsstärkste Aufträge
            </h2>
            <div className="flex flex-col gap-2">
              {top5Profitable.map(order => (
                <div key={order.id} className="flex items-center justify-between gap-2 rounded-lg bg-emerald-50/60 px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{order.title}</p>
                    {order.customers && order.customers.length > 0 && (
                      <p className="text-xs text-slate-500">{order.customers[0].name}</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-emerald-700">{order.margin!.toFixed(1)}%</p>
                    <p className="text-xs text-slate-500">
                      {order.revenue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Top 5 loss-making */}
          <Card>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
              <TrendingDown className="h-5 w-5 text-red-500" />
              Verlustbringer – Aufträge mit geringer Marge
            </h2>
            <div className="flex flex-col gap-2">
              {top5Loss.map(order => (
                <div key={order.id} className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 ${(order.margin ?? 0) < 0 ? 'bg-red-50/60' : 'bg-amber-50/60'}`}>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{order.title}</p>
                    {order.customers && order.customers.length > 0 && (
                      <p className="text-xs text-slate-500">{order.customers[0].name}</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={`text-sm font-bold ${(order.margin ?? 0) < 0 ? 'text-red-600' : 'text-amber-700'}`}>
                      {order.margin!.toFixed(1)}%
                    </p>
                    <p className="text-xs text-slate-500">
                      {order.costs.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })} Kosten
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Row 3: Currently clocked in */}
      <Card>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-slate-900">
          <Clock className="h-5 w-5 text-[#1e3a5f]" />
          Aktuell eingestempelt
        </h2>
        {(!clockedInNow || clockedInNow.length === 0) ? (
          <p className="text-sm text-slate-500">Niemand ist gerade eingestempelt</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {clockedInNow.map((entry: Record<string, unknown>) => {
              const p = entry.profiles as { first_name: string; last_name: string } | null
              const s = entry.construction_sites as { name: string } | null
              const clockIn = new Date(entry.clock_in as string)
              const since = clockIn.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
              const durationMs = now.getTime() - clockIn.getTime()
              const durationH = Math.floor(durationMs / 3600000)
              const durationM = Math.floor((durationMs % 3600000) / 60000)
              return (
                <div key={entry.user_id as string} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <span className="font-medium text-slate-900">
                      {p ? `${p.first_name} ${p.last_name}` : 'Unbekannt'}
                    </span>
                    {s?.name && <span className="ml-2 text-slate-500">{s.name}</span>}
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-emerald-600">seit {since}</span>
                    <span className="ml-2 text-xs text-slate-400">({durationH}h {durationM}m)</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Row 4: Warnings */}
      {(expiringDocs > 0 || lowStock.length > 0) && (
        <Card>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
            <AlertTriangle className="h-5 w-5 text-[#f59e0b]" />
            Warnungen
          </h2>
          <div className="flex flex-col gap-3">
            {/* Expiring qualifications */}
            {(expiringQuals || []).map((q: Record<string, unknown>, i) => {
              const p = q.profiles as { first_name: string; last_name: string } | null
              const daysLeft = Math.ceil((new Date(q.expiry_date as string).getTime() - now.getTime()) / 86400000)
              return (
                <div key={i} className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5">
                  <Star className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <div className="text-sm">
                    <span className="font-medium text-slate-900">Qualifikation läuft ab: </span>
                    <span className="text-slate-700">{q.name as string}</span>
                    {p && <span className="text-slate-500"> ({p.first_name} {p.last_name})</span>}
                    <span className="ml-1 font-medium text-amber-700">in {daysLeft} Tagen</span>
                  </div>
                </div>
              )
            })}

            {/* Expiring tax exemptions */}
            {(expiringTax || []).map((s: Record<string, unknown>, i) => {
              const daysLeft = Math.ceil((new Date(s.tax_exemption_valid_until as string).getTime() - now.getTime()) / 86400000)
              return (
                <div key={i} className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5">
                  <CloudSun className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <div className="text-sm">
                    <span className="font-medium text-slate-900">Steuerliche Freistellung läuft ab: </span>
                    <span className="text-slate-700">{s.name as string}</span>
                    <span className="ml-1 font-medium text-amber-700">in {daysLeft} Tagen</span>
                  </div>
                </div>
              )
            })}

            {/* Vehicle inspections */}
            {(vehicleInspections || []).map((v: Record<string, unknown>, i) => {
              const daysLeft = Math.ceil((new Date(v.next_inspection as string).getTime() - now.getTime()) / 86400000)
              return (
                <div key={i} className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  <div className="text-sm">
                    <span className="font-medium text-slate-900">TÜV fällig: </span>
                    <span className="text-slate-700">{v.make as string} {v.model as string} ({v.license_plate as string})</span>
                    <span className="ml-1 font-medium text-red-600">in {daysLeft} Tagen</span>
                  </div>
                </div>
              )
            })}

            {/* Low stock materials */}
            {lowStock.map((m, i) => (
              <div key={i} className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2.5">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                <div className="text-sm">
                  <span className="font-medium text-slate-900">Niedriger Bestand: </span>
                  <span className="text-slate-700">{m.name}</span>
                  <span className="ml-1 text-slate-500">({m.current_stock} / min. {m.min_stock})</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
