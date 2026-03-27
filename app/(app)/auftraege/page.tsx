import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Briefcase, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { Order, Customer } from '@/lib/types'
import { formatCurrency, formatNumber } from '@/lib/format'

const STATUS_LABELS: Record<string, string> = {
  quote: 'Angebot',
  commissioned: 'Beauftragt',
  in_progress: 'In Arbeit',
  acceptance: 'Abnahme',
  completed: 'Abgeschlossen',
  complaint: 'Reklamation',
}

const STATUS_COLORS: Record<string, string> = {
  quote: 'bg-slate-100 text-slate-600',
  commissioned: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  acceptance: 'bg-purple-100 text-purple-700',
  completed: 'bg-emerald-100 text-emerald-700',
  complaint: 'bg-red-100 text-red-700',
}

type OrderWithCustomer = Order & { customers: Pick<Customer, 'name'> | null }

export default async function AuftraegePage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const { filter } = await searchParams
  const activeFilter = filter || 'alle'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['owner', 'foreman'].includes(profile.role)) redirect('/stempeln')

  let query = supabase
    .from('orders')
    .select('*, customers(name)')
    .order('created_at', { ascending: false })

  if (activeFilter === 'angebote') query = query.eq('status', 'quote')
  else if (activeFilter === 'arbeit') query = query.in('status', ['commissioned', 'in_progress', 'acceptance'])
  else if (activeFilter === 'abgeschlossen') query = query.in('status', ['completed', 'complaint'])

  const { data: orders } = await query

  // For each order, get cost/revenue summary for margin indicator
  // We fetch order_items and order_costs in bulk
  const orderIds = (orders || []).map(o => o.id)
  const [{ data: allItems }, { data: allCosts }] = await Promise.all([
    orderIds.length > 0
      ? supabase.from('order_items').select('order_id, quantity, unit_price').in('order_id', orderIds)
      : Promise.resolve({ data: [] }),
    orderIds.length > 0
      ? supabase.from('order_costs').select('order_id, amount').in('order_id', orderIds)
      : Promise.resolve({ data: [] }),
  ])

  const revenueMap = new Map<string, number>()
  const costMap = new Map<string, number>()

  for (const item of allItems || []) {
    revenueMap.set(item.order_id, (revenueMap.get(item.order_id) || 0) + item.quantity * item.unit_price)
  }
  for (const cost of allCosts || []) {
    costMap.set(cost.order_id, (costMap.get(cost.order_id) || 0) + cost.amount)
  }

  const filters = [
    { key: 'alle', label: 'Alle' },
    { key: 'angebote', label: 'Angebote' },
    { key: 'arbeit', label: 'In Arbeit' },
    { key: 'abgeschlossen', label: 'Abgeschlossen' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Aufträge</h1>
        <Link href="/auftraege/neu">
          <Button>
            <Plus className="h-4 w-4" />
            Neuer Auftrag
          </Button>
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
        {filters.map(({ key, label }) => (
          <Link
            key={key}
            href={key === 'alle' ? '/auftraege' : `?filter=${key}`}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeFilter === key ? 'bg-[#1e3a5f] text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Order cards */}
      <div className="flex flex-col gap-3">
        {(orders as OrderWithCustomer[] || []).map((order) => {
          const revenue = revenueMap.get(order.id) || 0
          const costs = costMap.get(order.id) || 0
          const margin = revenue > 0 ? ((revenue - costs) / revenue) * 100 : null

          let MarginIcon = Minus
          let marginColor = 'text-slate-400'
          if (margin !== null) {
            if (margin >= 20) { MarginIcon = TrendingUp; marginColor = 'text-emerald-600' }
            else if (margin >= 0) { MarginIcon = TrendingUp; marginColor = 'text-amber-500' }
            else { MarginIcon = TrendingDown; marginColor = 'text-red-500' }
          }

          return (
            <Link key={order.id} href={`/auftraege/${order.id}`}>
              <Card className="transition-shadow hover:shadow-md cursor-pointer">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900 truncate">{order.title}</h3>
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                        {STATUS_LABELS[order.status]}
                      </span>
                    </div>
                    {order.customers && (
                      <p className="text-sm text-slate-500 mt-0.5">{order.customers.name}</p>
                    )}
                    <div className="mt-1 flex gap-4 text-xs text-slate-400">
                      {order.start_date && (
                        <span>ab {new Date(order.start_date).toLocaleDateString('de-DE')}</span>
                      )}
                      {order.end_date && (
                        <span>bis {new Date(order.end_date).toLocaleDateString('de-DE')}</span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    {order.budget != null && (
                      <p className="text-sm font-semibold text-slate-900">
                        {formatCurrency(order.budget)}
                      </p>
                    )}
                    {revenue > 0 && (
                      <p className="text-xs text-slate-500">
                        {formatCurrency(revenue)} Angebot
                      </p>
                    )}
                    {margin !== null && (
                      <div className={`flex items-center justify-end gap-1 text-xs font-medium ${marginColor}`}>
                        <MarginIcon className="h-3.5 w-3.5" />
                        {formatNumber(margin, 1)}% Marge*
                      </div>
                    )}
                    {margin !== null && (
                      <p className="text-right text-xs text-slate-300 leading-tight">*Detailkosten im Auftrag</p>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          )
        })}
        {(!orders || orders.length === 0) && (
          <Card className="py-12 text-center">
            <Briefcase className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="text-sm text-slate-500">Keine Aufträge vorhanden</p>
            <Link href="/auftraege/neu" className="mt-3 inline-block">
              <Button variant="secondary" className="text-xs">Ersten Auftrag erstellen</Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  )
}
