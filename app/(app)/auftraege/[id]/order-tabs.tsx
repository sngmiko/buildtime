'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  addOrderItem,
  addOrderCost,
  deleteOrderItem,
  updateOrderStatus,
  type OrdersState,
  type ProfitabilityData,
} from '@/actions/orders'
import type {
  Order,
  Customer,
  OrderItem,
  OrderCost,
  OrderAssignment,
  OrderStatus,
  ConstructionSite,
} from '@/lib/types'
import { Trash2, AlertTriangle, TrendingUp } from 'lucide-react'

const STATUS_LABELS: Record<OrderStatus, string> = {
  quote: 'Angebot',
  commissioned: 'Beauftragt',
  in_progress: 'In Arbeit',
  acceptance: 'Abnahme',
  completed: 'Abgeschlossen',
  complaint: 'Reklamation',
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  quote: 'bg-slate-100 text-slate-600',
  commissioned: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  acceptance: 'bg-purple-100 text-purple-700',
  completed: 'bg-emerald-100 text-emerald-700',
  complaint: 'bg-red-100 text-red-700',
}

const COST_CATEGORY_LABELS: Record<string, string> = {
  subcontractor: 'Subunternehmer',
  material: 'Material',
  equipment: 'Gerät',
  vehicle: 'Fahrzeug',
  other: 'Sonstiges',
}

const TABS = [
  { id: 'uebersicht', label: 'Übersicht' },
  { id: 'positionen', label: 'Positionen' },
  { id: 'kosten', label: 'Kosten' },
  { id: 'ressourcen', label: 'Ressourcen' },
]

type AssignmentWithName = OrderAssignment & { name?: string }

type Props = {
  order: Order
  customer: Customer | null
  site: ConstructionSite | null
  items: OrderItem[]
  costs: OrderCost[]
  assignments: AssignmentWithName[]
  profitability: ProfitabilityData | null
  activeTab: string
}

export function OrderDetailTabs({
  order, customer, site, items, costs, assignments, profitability, activeTab,
}: Props) {
  const router = useRouter()

  return (
    <div className="flex flex-col gap-6">
      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-white p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => router.push(`?tab=${tab.id}`)}
            className={`flex items-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id ? 'bg-[#1e3a5f] text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'uebersicht' && (
        <UebersichtTab order={order} customer={customer} site={site} />
      )}
      {activeTab === 'positionen' && (
        <PositionenTab order={order} items={items} />
      )}
      {activeTab === 'kosten' && (
        <KostenTab order={order} costs={costs} profitability={profitability} />
      )}
      {activeTab === 'ressourcen' && (
        <RessourcenTab order={order} assignments={assignments} />
      )}
    </div>
  )
}

// ─── Übersicht Tab ─────────────────────────────────────────────────────────────

function UebersichtTab({ order, customer, site }: { order: Order; customer: Customer | null; site: ConstructionSite | null }) {
  const router = useRouter()

  async function handleStatusChange(newStatus: OrderStatus) {
    await updateOrderStatus(order.id, newStatus)
    router.refresh()
  }

  const nextStatuses: Partial<Record<OrderStatus, OrderStatus>> = {
    quote: 'commissioned',
    commissioned: 'in_progress',
    in_progress: 'acceptance',
    acceptance: 'completed',
  }
  const nextStatus = nextStatuses[order.status]

  return (
    <div className="flex flex-col gap-4">
      {/* Status card */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500 mb-1">Status</p>
            <span className={`rounded-full px-3 py-1 text-sm font-medium ${STATUS_COLORS[order.status]}`}>
              {STATUS_LABELS[order.status]}
            </span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {nextStatus && (
              <Button
                onClick={() => handleStatusChange(nextStatus)}
                className="text-sm"
              >
                → {STATUS_LABELS[nextStatus]}
              </Button>
            )}
            {order.status !== 'complaint' && (
              <Button
                variant="secondary"
                onClick={() => handleStatusChange('complaint')}
                className="text-sm"
              >
                Reklamation
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Dates & Budget */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <h3 className="text-sm font-semibold text-slate-900 mb-2">Zeitraum</h3>
          <div className="space-y-1 text-sm text-slate-600">
            <p>
              <span className="text-slate-400">Start: </span>
              {order.start_date ? new Date(order.start_date).toLocaleDateString('de-DE') : '—'}
            </p>
            <p>
              <span className="text-slate-400">Ende: </span>
              {order.end_date ? new Date(order.end_date).toLocaleDateString('de-DE') : '—'}
            </p>
          </div>
        </Card>
        <Card>
          <h3 className="text-sm font-semibold text-slate-900 mb-2">Budget</h3>
          <p className="text-2xl font-bold text-slate-900">
            {order.budget != null
              ? order.budget.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
              : '—'}
          </p>
        </Card>
      </div>

      {/* Customer info */}
      {customer && (
        <Card>
          <h3 className="text-sm font-semibold text-slate-900 mb-2">Kunde</h3>
          <div className="space-y-1 text-sm text-slate-600">
            <p className="font-medium text-slate-900">{customer.name}</p>
            {customer.contact_person && <p>{customer.contact_person}</p>}
            {customer.email && <p>{customer.email}</p>}
            {customer.phone && <p>{customer.phone}</p>}
            {customer.address && <p className="text-xs text-slate-400">{customer.address}</p>}
          </div>
        </Card>
      )}

      {/* Site */}
      {site && (
        <Card>
          <h3 className="text-sm font-semibold text-slate-900 mb-2">Baustelle</h3>
          <p className="text-sm text-slate-600">{site.name}</p>
          {site.address && <p className="text-xs text-slate-400">{site.address}</p>}
        </Card>
      )}

      {/* Description */}
      {order.description && (
        <Card>
          <h3 className="text-sm font-semibold text-slate-900 mb-2">Beschreibung</h3>
          <p className="text-sm text-slate-600 whitespace-pre-wrap">{order.description}</p>
        </Card>
      )}
    </div>
  )
}

// ─── Positionen Tab ───────────────────────────────────────────────────────────

function PositionenTab({ order, items }: { order: Order; items: OrderItem[] }) {
  const addItemWithId = addOrderItem.bind(null, order.id)
  const [state, action, pending] = useActionState<OrdersState, FormData>(addItemWithId, null)
  const router = useRouter()

  useEffect(() => {
    if (state?.success) router.refresh()
  }, [state?.success, router])

  const total = items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0)

  async function handleDelete(itemId: string) {
    await deleteOrderItem(itemId)
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Items table */}
      {items.length > 0 && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                  <th className="pb-2 pr-3 font-medium">Pos.</th>
                  <th className="pb-2 pr-3 font-medium">Beschreibung</th>
                  <th className="pb-2 pr-3 font-medium text-right">Menge</th>
                  <th className="pb-2 pr-3 font-medium">Einheit</th>
                  <th className="pb-2 pr-3 font-medium text-right">EP (€)</th>
                  <th className="pb-2 font-medium text-right">Gesamt (€)</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2 pr-3 text-slate-500">{item.position}</td>
                    <td className="py-2 pr-3">{item.description}</td>
                    <td className="py-2 pr-3 text-right">{item.quantity.toLocaleString('de-DE')}</td>
                    <td className="py-2 pr-3 text-slate-500">{item.unit}</td>
                    <td className="py-2 pr-3 text-right">{item.unit_price.toFixed(2)}</td>
                    <td className="py-2 text-right font-medium">{(item.quantity * item.unit_price).toFixed(2)}</td>
                    <td className="py-2 pl-2">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-slate-300 hover:text-red-500 transition-colors"
                        aria-label="Löschen"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200">
                  <td colSpan={5} className="pt-3 text-right text-sm font-medium text-slate-600">Gesamt:</td>
                  <td className="pt-3 text-right text-base font-bold text-slate-900">
                    {total.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}

      {/* Add item form */}
      <Card>
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Position hinzufügen</h3>
        <form action={action} className="flex flex-col gap-3">
          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-2">
              <Input
                label="Pos."
                name="position"
                type="number"
                min="1"
                defaultValue={items.length + 1}
                error={state?.errors?.position?.[0]}
              />
            </div>
            <div className="col-span-10">
              <Input
                label="Beschreibung"
                name="description"
                required
                placeholder="z. B. Dacheindeckung"
                error={state?.errors?.description?.[0]}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Input
              label="Menge"
              name="quantity"
              type="number"
              step="0.01"
              min="0.01"
              defaultValue="1"
              error={state?.errors?.quantity?.[0]}
            />
            <Input
              label="Einheit"
              name="unit"
              defaultValue="Stk"
              placeholder="Stk"
              error={state?.errors?.unit?.[0]}
            />
            <Input
              label="Einzelpreis (€)"
              name="unit_price"
              type="number"
              step="0.01"
              min="0"
              defaultValue="0"
              error={state?.errors?.unit_price?.[0]}
            />
          </div>
          {state?.message && <p className="text-xs text-red-600">{state.message}</p>}
          <Button type="submit" disabled={pending} className="self-start">
            {pending ? 'Hinzufügen...' : '+ Position hinzufügen'}
          </Button>
        </form>
      </Card>
    </div>
  )
}

// ─── Kosten Tab ───────────────────────────────────────────────────────────────

function KostenTab({ order, costs, profitability }: { order: Order; costs: OrderCost[]; profitability: ProfitabilityData | null }) {
  const addCostWithId = addOrderCost.bind(null, order.id)
  const [state, action, pending] = useActionState<OrdersState, FormData>(addCostWithId, null)
  const router = useRouter()

  useEffect(() => {
    if (state?.success) router.refresh()
  }, [state?.success, router])

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="flex flex-col gap-4">
      {/* SOLL/IST comparison */}
      {profitability && (
        <>
          {/* Budget warning */}
          {profitability.budgetUsedPercent != null && profitability.budgetUsedPercent >= 80 && (
            <Card className="border-amber-200 bg-amber-50">
              <div className="flex items-center gap-2 text-amber-700">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold">
                    Budget zu {profitability.budgetUsedPercent.toFixed(0)}% ausgeschöpft
                  </p>
                  <p className="text-xs">
                    Kosten von {profitability.totalCost.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} bei Budget von {profitability.budget!.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                  </p>
                </div>
              </div>
            </Card>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <p className="text-xs text-slate-500 mb-1">Angebotssumme</p>
              <p className="text-lg font-bold text-slate-900">
                {profitability.revenue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
              </p>
            </Card>
            <Card>
              <p className="text-xs text-slate-500 mb-1">Lohnkosten (IST)</p>
              <p className="text-lg font-bold text-slate-900">
                {profitability.laborCost.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
              </p>
            </Card>
            <Card>
              <p className="text-xs text-slate-500 mb-1">Fremdkosten (IST)</p>
              <p className="text-lg font-bold text-slate-900">
                {profitability.externalCosts.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
              </p>
            </Card>
            <Card>
              <p className="text-xs text-slate-500 mb-1">Marge</p>
              <p className={`text-lg font-bold ${profitability.margin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {profitability.marginPercent.toFixed(1)}%
              </p>
              <p className="text-xs text-slate-400">
                {profitability.margin.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
              </p>
            </Card>
          </div>

          {/* Budget bar */}
          {profitability.budgetUsedPercent != null && (
            <Card>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-700">Kostenstand vs. Budget</p>
                <p className="text-sm font-semibold">
                  {profitability.budgetUsedPercent.toFixed(0)}%
                </p>
              </div>
              <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    profitability.budgetUsedPercent >= 100 ? 'bg-red-500' :
                    profitability.budgetUsedPercent >= 80 ? 'bg-[#f59e0b]' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, profitability.budgetUsedPercent)}%` }}
                />
              </div>
            </Card>
          )}
        </>
      )}

      {/* Cost list */}
      {costs.length > 0 && (
        <Card>
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Fremdkosten</h3>
          <div className="flex flex-col divide-y divide-slate-100">
            {costs.map((cost) => (
              <div key={cost.id} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-slate-900">{cost.description}</p>
                  <p className="text-xs text-slate-400">
                    {COST_CATEGORY_LABELS[cost.category]} · {new Date(cost.date).toLocaleDateString('de-DE')}
                  </p>
                </div>
                <p className="text-sm font-semibold text-slate-900">
                  {cost.amount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Add cost form */}
      <Card>
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Kosten erfassen</h3>
        <form action={action} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Kategorie"
              name="category"
              options={[
                { value: 'subcontractor', label: 'Subunternehmer' },
                { value: 'material', label: 'Material' },
                { value: 'equipment', label: 'Gerät' },
                { value: 'vehicle', label: 'Fahrzeug' },
                { value: 'other', label: 'Sonstiges' },
              ]}
            />
            <Input
              label="Datum"
              name="date"
              type="date"
              defaultValue={today}
              error={state?.errors?.date?.[0]}
            />
          </div>
          <Input
            label="Beschreibung"
            name="description"
            required
            placeholder="z. B. Dachdecker Müller GmbH"
            error={state?.errors?.description?.[0]}
          />
          <Input
            label="Betrag (€)"
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            error={state?.errors?.amount?.[0]}
          />
          {state?.message && <p className="text-xs text-red-600">{state.message}</p>}
          <Button type="submit" disabled={pending} className="self-start">
            {pending ? 'Speichern...' : '+ Kosten hinzufügen'}
          </Button>
        </form>
      </Card>
    </div>
  )
}

// ─── Ressourcen Tab ───────────────────────────────────────────────────────────

function RessourcenTab({ order, assignments }: { order: Order; assignments: AssignmentWithName[] }) {
  const byType = {
    employee: assignments.filter(a => a.resource_type === 'employee'),
    vehicle: assignments.filter(a => a.resource_type === 'vehicle'),
    equipment: assignments.filter(a => a.resource_type === 'equipment'),
  }

  return (
    <div className="flex flex-col gap-4">
      {Object.entries(byType).map(([type, list]) => (
        <Card key={type}>
          <h3 className="mb-3 text-sm font-semibold text-slate-900">
            {type === 'employee' ? 'Mitarbeiter' : type === 'vehicle' ? 'Fahrzeuge' : 'Geräte'}
          </h3>
          {list.length === 0 ? (
            <p className="text-sm text-slate-400">Keine zugewiesen</p>
          ) : (
            <div className="flex flex-col divide-y divide-slate-100">
              {list.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{a.name || a.resource_id}</p>
                    {a.notes && <p className="text-xs text-slate-400">{a.notes}</p>}
                  </div>
                  <div className="text-xs text-slate-400">
                    {a.start_date && new Date(a.start_date).toLocaleDateString('de-DE')}
                    {a.start_date && a.end_date && ' – '}
                    {a.end_date && new Date(a.end_date).toLocaleDateString('de-DE')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      ))}
    </div>
  )
}
