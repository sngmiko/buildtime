import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getOrderFullDetails } from '@/lib/queries/order-details'
import { calculateFullOrderCosts } from '@/lib/queries/cost-integration'
import { Card } from '@/components/ui/card'
import { ChevronLeft, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import { OrderDetailTabs } from './order-tabs'
import { CreateInvoiceButton } from './create-invoice-button'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  quote: { label: 'Angebot', color: 'bg-slate-100 text-slate-700' },
  commissioned: { label: 'Beauftragt', color: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'In Arbeit', color: 'bg-emerald-100 text-emerald-700' },
  acceptance: { label: 'Abnahme', color: 'bg-amber-100 text-amber-700' },
  completed: { label: 'Abgeschlossen', color: 'bg-slate-100 text-slate-600' },
  complaint: { label: 'Reklamation', color: 'bg-red-100 text-red-700' },
}

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { id } = await params
  const { tab } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['owner', 'foreman'].includes(profile.role)) redirect('/dashboard')

  const [details, costBreakdown] = await Promise.all([
    getOrderFullDetails(supabase, id),
    calculateFullOrderCosts(supabase, id),
  ])
  if (!details.order) notFound()

  const status = STATUS_LABELS[details.order.status as string] || STATUS_LABELS.quote
  const f = costBreakdown
  const marginColor = f.margin >= 15 ? 'text-emerald-600' : f.margin >= 5 ? 'text-amber-600' : 'text-red-600'
  const MarginIcon = f.margin >= 0 ? TrendingUp : TrendingDown

  // Get sites for forms
  const { data: sites } = await supabase.from('construction_sites').select('id, name').eq('status', 'active').order('name')
  const { data: workers } = await supabase.from('profiles').select('id, first_name, last_name, role, hourly_rate').in('role', ['worker', 'foreman']).order('last_name')

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/auftraege" className="text-slate-500 hover:text-slate-900">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900">{details.order.title as string}</h1>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${status.color}`}>{status.label}</span>
            <div className="ml-auto">
              <CreateInvoiceButton orderId={id} />
            </div>
          </div>
          {details.order.customers && (
            <p className="text-sm text-slate-500">
              {(details.order.customers as { name: string }).name}
              {details.order.construction_sites && ` · ${(details.order.construction_sites as { name: string }).name}`}
            </p>
          )}
        </div>
      </div>

      {/* Financial summary bar */}
      <div className="grid gap-4 sm:grid-cols-5">
        <Card className="p-4 text-center">
          <p className="text-xs text-slate-500">Auftragswert</p>
          <p className="text-xl font-bold text-slate-900">{f.revenue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-slate-500">Personalkosten</p>
          <p className="text-xl font-bold text-blue-600">{f.labor.total.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-slate-500">Gesamtkosten</p>
          <p className="text-xl font-bold text-slate-700">{f.grandTotal.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-slate-500">Gewinn</p>
          <p className={`text-xl font-bold ${f.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{f.profit.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-slate-500">Marge</p>
          <div className="flex items-center justify-center gap-1">
            <MarginIcon className={`h-5 w-5 ${marginColor}`} />
            <p className={`text-xl font-bold ${marginColor}`}>{f.margin}%</p>
          </div>
        </Card>
      </div>

      {/* Budget warning */}
      {details.order.budget && f.grandTotal / Number(details.order.budget) >= 0.8 && (
        <Card className="border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-amber-700">
            <AlertTriangle className="h-4 w-4" />
            Budget-Warnung: {Math.round((f.grandTotal / Number(details.order.budget)) * 100)}% des Budgets erreicht
          </div>
        </Card>
      )}

      <OrderDetailTabs
        details={details}
        costBreakdown={costBreakdown}
        activeTab={tab || 'overview'}
        sites={(sites || []) as { id: string; name: string }[]}
        workers={(workers || []) as { id: string; first_name: string; last_name: string; role: string; hourly_rate: number | null }[]}
      />
    </div>
  )
}
