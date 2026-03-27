import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import { updateOrderStatus } from '@/actions/inventory'
import type { PurchaseOrder, PurchaseOrderItem, Material } from '@/lib/types'

const ORDER_STATUS_LABELS: Record<string, string> = {
  draft: 'Entwurf',
  ordered: 'Bestellt',
  partially_delivered: 'Teilgeliefert',
  delivered: 'Geliefert',
  cancelled: 'Storniert',
}
const ORDER_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600',
  ordered: 'bg-blue-100 text-blue-700',
  partially_delivered: 'bg-amber-100 text-amber-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
}
const UNIT_LABELS: Record<string, string> = {
  piece: 'Stk', m: 'm', m2: 'm²', m3: 'm³', kg: 'kg', l: 'l', pack: 'Pack.',
}

const STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ['ordered', 'cancelled'],
  ordered: ['partially_delivered', 'delivered', 'cancelled'],
  partially_delivered: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
}

type OrderWithSupplier = PurchaseOrder & { suppliers: { id: string; name: string } | null }
type OrderItemWithMaterial = PurchaseOrderItem & { materials: (Material & { unit: string }) | null }

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['owner', 'foreman'].includes(profile.role)) redirect('/stempeln')

  const [{ data: order }, { data: items }] = await Promise.all([
    supabase
      .from('purchase_orders')
      .select('*, suppliers(id, name)')
      .eq('id', id)
      .single(),
    supabase
      .from('purchase_order_items')
      .select('*, materials(name, unit, article_number)')
      .eq('order_id', id),
  ])

  if (!order) notFound()

  const o = order as OrderWithSupplier
  const orderItems = (items as OrderItemWithMaterial[]) || []
  const nextStatuses = STATUS_TRANSITIONS[o.status] || []

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/lager?tab=bestellungen" className="text-slate-500 hover:text-slate-900">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900">
              {o.suppliers?.name ?? 'Kein Lieferant'}
            </h1>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ORDER_STATUS_COLORS[o.status]}`}>
              {ORDER_STATUS_LABELS[o.status]}
            </span>
          </div>
          <p className="text-sm text-slate-500">
            {new Date(o.order_date).toLocaleDateString('de-DE', {
              day: '2-digit', month: '2-digit', year: 'numeric',
            })}
            {o.total_amount != null && ` · ${o.total_amount.toFixed(2)} €`}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{orderItems.length}</p>
          <p className="text-xs text-slate-500">Positionen</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">
            {o.total_amount != null
              ? o.total_amount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
              : '–'}
          </p>
          <p className="text-xs text-slate-500">Gesamtbetrag</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">
            {new Date(o.order_date).toLocaleDateString('de-DE')}
          </p>
          <p className="text-xs text-slate-500">Bestelldatum</p>
        </Card>
      </div>

      {/* Status update */}
      {nextStatuses.length > 0 && (
        <Card>
          <h2 className="mb-3 text-base font-semibold text-slate-900">Status aktualisieren</h2>
          <div className="flex flex-wrap gap-2">
            {nextStatuses.map((status) => (
              <form
                key={status}
                action={async () => {
                  'use server'
                  await updateOrderStatus(id, status)
                }}
              >
                <Button type="submit" variant="outline" size="sm">
                  → {ORDER_STATUS_LABELS[status]}
                </Button>
              </form>
            ))}
          </div>
        </Card>
      )}

      {/* Notes */}
      {o.notes && (
        <Card>
          <h2 className="mb-2 text-base font-semibold text-slate-900">Notizen</h2>
          <p className="text-sm text-slate-600">{o.notes}</p>
        </Card>
      )}

      {/* Order items */}
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-slate-900">Bestellpositionen</h2>
        {orderItems.length === 0 ? (
          <Card className="py-8 text-center text-sm text-slate-500">
            Keine Positionen vorhanden
          </Card>
        ) : (
          <Card className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                    <th className="px-4 py-3 font-medium">Material</th>
                    <th className="px-4 py-3 font-medium text-right">Bestellt</th>
                    <th className="px-4 py-3 font-medium text-right">Geliefert</th>
                    <th className="px-4 py-3 font-medium text-right">Einzelpreis</th>
                    <th className="px-4 py-3 font-medium text-right">Gesamt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orderItems.map((item) => {
                    const unit = item.materials?.unit ? UNIT_LABELS[item.materials.unit] || item.materials.unit : ''
                    const total = item.quantity * item.unit_price
                    return (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">
                            {item.materials?.name ?? 'Unbekannt'}
                          </p>
                          {item.materials?.article_number && (
                            <p className="text-xs text-slate-500">Art.-Nr. {item.materials.article_number}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-700">
                          {item.quantity} {unit}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`${item.delivered_quantity >= item.quantity ? 'text-emerald-600' : item.delivered_quantity > 0 ? 'text-amber-600' : 'text-slate-500'}`}>
                            {item.delivered_quantity} {unit}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-700">
                          {item.unit_price.toFixed(2)} €
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900">
                          {total.toFixed(2)} €
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                {orderItems.length > 1 && (
                  <tfoot>
                    <tr className="border-t-2 border-slate-200">
                      <td colSpan={4} className="px-4 py-3 text-right text-sm font-semibold text-slate-700">
                        Summe
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-slate-900">
                        {orderItems.reduce((sum, i) => sum + i.quantity * i.unit_price, 0).toFixed(2)} €
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Supplier link */}
      {o.suppliers && (
        <div className="text-sm text-slate-500">
          Lieferant:{' '}
          <Link
            href={`/lager/lieferant/${o.suppliers.id}`}
            className="text-[#1e3a5f] underline underline-offset-2 hover:text-[#2a4f7f]"
          >
            {o.suppliers.name}
          </Link>
        </div>
      )}
    </div>
  )
}
