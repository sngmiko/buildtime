'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useActionState } from 'react'
import { addOrderItem, addOrderCost, type OrdersState } from '@/actions/orders'
import { createMeasurement, type MeasurementState } from '@/actions/measurements'
import { FileText, Calculator, BookOpen, Users, BarChart3, Ruler, ChevronDown, ChevronRight } from 'lucide-react'
import type { OrderCostBreakdown } from '@/lib/queries/cost-integration'
import { formatCurrency, formatNumber } from '@/lib/format'

const TABS = [
  { id: 'overview', label: 'Übersicht', icon: FileText },
  { id: 'items', label: 'Positionen', icon: BarChart3 },
  { id: 'costs', label: 'Kosten', icon: Calculator },
  { id: 'aufmass', label: 'Aufmaß', icon: Ruler },
  { id: 'nachkalkulation', label: 'Nachkalkulation', icon: BarChart3 },
  { id: 'diary', label: 'Tagebuch', icon: BookOpen },
  { id: 'team', label: 'Team & Ressourcen', icon: Users },
]

type OrderDetails = {
  order: Record<string, unknown>
  items: Record<string, unknown>[]
  costs: Record<string, unknown>[]
  assignments: Record<string, unknown>[]
  timeEntries: Record<string, unknown>[]
  diaryEntries: Record<string, unknown>[]
  subAssignments: Record<string, unknown>[]
  measurements: Record<string, unknown>[]
  financials: { revenue: number; laborCost: number; externalCosts: number; subCosts: number; totalCosts: number; profit: number; margin: number }
  costBreakdown?: OrderCostBreakdown
}

export function OrderDetailTabs({
  details,
  costBreakdown,
  activeTab,
  sites,
  workers,
}: {
  details: OrderDetails
  costBreakdown: OrderCostBreakdown
  activeTab: string
  sites: { id: string; name: string }[]
  workers: { id: string; first_name: string; last_name: string; role: string; hourly_rate: number | null }[]
}) {
  const router = useRouter()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-white p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button key={tab.id} onClick={() => router.push(`?tab=${tab.id}`)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-[#1e3a5f] text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Icon className="h-4 w-4" />{tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'overview' && <OverviewTab details={details} />}
      {activeTab === 'items' && <ItemsTab details={details} />}
      {activeTab === 'costs' && <CostsTab details={details} costBreakdown={costBreakdown} workers={workers} />}
      {activeTab === 'aufmass' && <AufmassTab details={details} />}
      {activeTab === 'nachkalkulation' && <NachkalkulationTab details={details} costBreakdown={costBreakdown} />}
      {activeTab === 'diary' && <DiaryTab details={details} />}
      {activeTab === 'team' && <TeamTab details={details} workers={workers} />}
    </div>
  )
}

function OverviewTab({ details }: { details: OrderDetails }) {
  const o = details.order
  const customer = o.customers as { name: string; contact_person: string | null; email: string | null; phone: string | null } | null

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Auftragsdetails</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-slate-500">Status</dt><dd className="font-medium">{o.status as string}</dd></div>
          {!!o.start_date && <div className="flex justify-between"><dt className="text-slate-500">Start</dt><dd>{new Date(o.start_date as string).toLocaleDateString('de-DE')}</dd></div>}
          {!!o.end_date && <div className="flex justify-between"><dt className="text-slate-500">Ende (geplant)</dt><dd>{new Date(o.end_date as string).toLocaleDateString('de-DE')}</dd></div>}
          {!!o.budget && <div className="flex justify-between"><dt className="text-slate-500">Budget</dt><dd className="font-medium">{formatCurrency(Number(o.budget))}</dd></div>}
          {!!o.description && <div className="pt-2"><dt className="text-slate-500 mb-1">Beschreibung</dt><dd className="text-slate-700">{o.description as string}</dd></div>}
        </dl>
      </Card>
      {customer && (
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Kunde</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Firma</dt><dd className="font-medium">{customer.name}</dd></div>
            {customer.contact_person && <div className="flex justify-between"><dt className="text-slate-500">Ansprechpartner</dt><dd>{customer.contact_person}</dd></div>}
            {customer.email && <div className="flex justify-between"><dt className="text-slate-500">E-Mail</dt><dd>{customer.email}</dd></div>}
            {customer.phone && <div className="flex justify-between"><dt className="text-slate-500">Telefon</dt><dd>{customer.phone}</dd></div>}
          </dl>
        </Card>
      )}
    </div>
  )
}

function ItemsTab({ details }: { details: OrderDetails }) {
  const orderId = details.order.id as string
  const boundAdd = addOrderItem.bind(null, orderId)
  const [state, action, pending] = useActionState<OrdersState, FormData>(boundAdd, null)
  const total = details.items.reduce((s: number, i) => s + Number(i.quantity) * Number(i.unit_price), 0)

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left">
              <th className="px-4 py-3 font-medium text-slate-500">Pos.</th>
              <th className="px-4 py-3 font-medium text-slate-500">Beschreibung</th>
              <th className="px-4 py-3 font-medium text-slate-500 text-right">Menge</th>
              <th className="px-4 py-3 font-medium text-slate-500 text-right">EP</th>
              <th className="px-4 py-3 font-medium text-slate-500 text-right">GP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {details.items.map((item) => (
              <tr key={item.id as string}>
                <td className="px-4 py-3 text-slate-500">{item.position as number}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{item.description as string}</td>
                <td className="px-4 py-3 text-right text-slate-700">{item.quantity as number} {item.unit as string}</td>
                <td className="px-4 py-3 text-right text-slate-700">{formatCurrency(Number(item.unit_price))}</td>
                <td className="px-4 py-3 text-right font-medium text-slate-900">{formatCurrency(Number(item.quantity) * Number(item.unit_price))}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-300">
              <td colSpan={4} className="px-4 py-3 font-bold text-slate-900">Gesamt</td>
              <td className="px-4 py-3 text-right font-bold text-slate-900">{formatCurrency(total)}</td>
            </tr>
          </tfoot>
        </table>
      </Card>

      <Card>
        <h3 className="mb-4 text-lg font-semibold">Position hinzufügen</h3>
        <form action={action} className="grid gap-3 sm:grid-cols-5">
          <Input label="Pos." name="position" type="number" defaultValue={String(details.items.length + 1)} required />
          <div className="sm:col-span-2">
            <Input label="Beschreibung" name="description" required error={state?.errors?.description?.[0]} />
          </div>
          <Input label="Menge" name="quantity" type="number" step="0.01" defaultValue="1" required />
          <Input label="Einzelpreis (€)" name="unit_price" type="number" step="0.01" required />
          <input type="hidden" name="unit" value="Stk" />
          {state?.message && <p className="text-sm text-red-600 sm:col-span-5">{state.message}</p>}
          <div className="sm:col-span-5">
            <Button type="submit" disabled={pending} size="sm">{pending ? 'Hinzufügen...' : 'Position hinzufügen'}</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

function CollapsibleSection({
  title,
  total,
  count,
  children,
  colorClass = 'text-slate-900',
}: {
  title: string
  total: number
  count: number
  children: React.ReactNode
  colorClass?: string
}) {
  const [open, setOpen] = useState(false)
  const fmt = formatCurrency

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-sm"
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
          <span className="font-medium text-slate-900">{title}</span>
          <span className="text-xs text-slate-400">({count} Einträge)</span>
        </div>
        <span className={`font-semibold ${colorClass}`}>{fmt(total)}</span>
      </button>
      {open && (
        <div className="divide-y divide-slate-100 bg-white">
          {children}
        </div>
      )}
    </div>
  )
}

function CostsTab({ details, costBreakdown, workers }: { details: OrderDetails; costBreakdown: OrderCostBreakdown; workers: { id: string; first_name: string; last_name: string; hourly_rate: number | null }[] }) {
  const f = costBreakdown
  const budgetPct = details.order.budget ? (f.grandTotal / Number(details.order.budget)) * 100 : 0
  const barColor = budgetPct >= 95 ? 'bg-red-500' : budgetPct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
  const fmt = formatCurrency

  const orderId = details.order.id as string
  const boundAddCost = addOrderCost.bind(null, orderId)
  const [state, action, pending] = useActionState<OrdersState, FormData>(boundAddCost, null)

  return (
    <div className="flex flex-col gap-6">
      {/* Budget progress */}
      {!!details.order.budget && (
        <Card className="p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-slate-500">Budget-Auslastung</span>
            <span className="font-medium text-slate-900">{Math.round(budgetPct)}%</span>
          </div>
          <div className="h-3 rounded-full bg-slate-100">
            <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${Math.min(100, budgetPct)}%` }} />
          </div>
          <div className="mt-2 flex justify-between text-xs text-slate-400">
            <span>{fmt(f.grandTotal)} von {formatCurrency(Number(details.order.budget))}</span>
          </div>
        </Card>
      )}

      {/* Automatische Kosten aus Modulen */}
      <Card>
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Automatische Kosten</h3>
        <p className="text-xs text-slate-400 mb-4">Automatisch aus anderen Modulen berechnet – schreibgeschützt</p>
        <div className="flex flex-col gap-2">
          {/* Labor */}
          <CollapsibleSection
            title="Mitarbeiter (Zeiterfassung)"
            total={f.labor.total}
            count={f.labor.entries.length}
            colorClass="text-blue-600"
          >
            {f.labor.entries.length === 0 ? (
              <p className="px-4 py-3 text-sm text-slate-400">Keine Zeiteinträge</p>
            ) : (
              f.labor.entries.map((e, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2 text-sm">
                  <div>
                    <p className="font-medium text-slate-900">{e.name}</p>
                    <p className="text-xs text-slate-400">{e.hours}h à {fmt(e.rate)}/h</p>
                  </div>
                  <span className="font-medium text-slate-700">{fmt(e.cost)}</span>
                </div>
              ))
            )}
            <div className="flex justify-between px-4 py-2 text-sm font-semibold bg-slate-50">
              <span>{formatNumber(f.labor.entries.reduce((s, e) => s + e.hours, 0), 1)} Mitarbeiterstunden à Ø {f.labor.entries.length > 0 ? fmt(f.labor.entries.reduce((s, e) => s + e.rate, 0) / f.labor.entries.length) : '–'}/h</span>
              <span className="text-blue-600">{fmt(f.labor.total)}</span>
            </div>
          </CollapsibleSection>

          {/* Equipment */}
          <CollapsibleSection
            title="Maschinen (Maschinenpark)"
            total={f.equipment.total}
            count={f.equipment.entries.length}
            colorClass="text-violet-600"
          >
            {f.equipment.entries.length === 0 ? (
              <p className="px-4 py-3 text-sm text-slate-400">Keine Maschinen zugewiesen</p>
            ) : (
              f.equipment.entries.map((e, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2 text-sm">
                  <div>
                    <p className="font-medium text-slate-900">{e.name}</p>
                    <p className="text-xs text-slate-400">{e.days} Tage à {fmt(e.dailyRate)}/Tag</p>
                  </div>
                  <span className="font-medium text-slate-700">{fmt(e.cost)}</span>
                </div>
              ))
            )}
            <div className="flex justify-between px-4 py-2 text-sm font-semibold bg-slate-50">
              <span>{f.equipment.entries.reduce((s, e) => s + e.days, 0)} Maschinentage</span>
              <span className="text-violet-600">{fmt(f.equipment.total)}</span>
            </div>
          </CollapsibleSection>

          {/* Vehicles */}
          <CollapsibleSection
            title="Fahrzeuge (Fuhrpark)"
            total={f.vehicles.total}
            count={f.vehicles.entries.length}
            colorClass="text-orange-600"
          >
            {f.vehicles.entries.length === 0 ? (
              <p className="px-4 py-3 text-sm text-slate-400">Keine Fahrzeuge zugewiesen</p>
            ) : (
              f.vehicles.entries.map((e, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2 text-sm">
                  <div>
                    <p className="font-medium text-slate-900">{e.plate}</p>
                    <p className="text-xs text-slate-400">{e.km} km · Kraftstoff: {fmt(e.fuelCost)} · Leasing/Fix: {fmt(e.leasingCost)}</p>
                  </div>
                  <span className="font-medium text-slate-700">{fmt(e.cost)}</span>
                </div>
              ))
            )}
            <div className="flex justify-between px-4 py-2 text-sm font-semibold bg-slate-50">
              <span>{f.vehicles.entries.reduce((s, e) => s + e.km, 0)} km · {f.vehicles.entries.length} Fahrzeuge</span>
              <span className="text-orange-600">{fmt(f.vehicles.total)}</span>
            </div>
          </CollapsibleSection>

          {/* Materials */}
          <CollapsibleSection
            title="Materialien (Lager)"
            total={f.materials.total}
            count={f.materials.entries.length}
            colorClass="text-emerald-600"
          >
            {f.materials.entries.length === 0 ? (
              <p className="px-4 py-3 text-sm text-slate-400">Keine Materialentnahmen</p>
            ) : (
              f.materials.entries.map((e, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2 text-sm">
                  <div>
                    <p className="font-medium text-slate-900">{e.name}</p>
                    <p className="text-xs text-slate-400">{e.quantity} Stk à {fmt(e.unitPrice)}</p>
                  </div>
                  <span className="font-medium text-slate-700">{fmt(e.cost)}</span>
                </div>
              ))
            )}
            <div className="flex justify-between px-4 py-2 text-sm font-semibold bg-slate-50">
              <span>{f.materials.entries.length} Materialien</span>
              <span className="text-emerald-600">{fmt(f.materials.total)}</span>
            </div>
          </CollapsibleSection>

          {/* Subcontractors */}
          <CollapsibleSection
            title="Subunternehmer"
            total={f.subcontractors.total}
            count={f.subcontractors.entries.length}
            colorClass="text-rose-600"
          >
            {f.subcontractors.entries.length === 0 ? (
              <p className="px-4 py-3 text-sm text-slate-400">Keine Subunternehmer-Rechnungen</p>
            ) : (
              f.subcontractors.entries.map((e, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2 text-sm">
                  <div>
                    <p className="font-medium text-slate-900">{e.name}</p>
                    {e.description && <p className="text-xs text-slate-400">{e.description}</p>}
                  </div>
                  <span className="font-medium text-slate-700">{fmt(e.invoiced)}</span>
                </div>
              ))
            )}
            <div className="flex justify-between px-4 py-2 text-sm font-semibold bg-slate-50">
              <span>{f.subcontractors.entries.length} Subunternehmer-Rechnungen</span>
              <span className="text-rose-600">{fmt(f.subcontractors.total)}</span>
            </div>
          </CollapsibleSection>

          {/* Summary row */}
          <div className="flex items-center justify-between rounded-lg bg-slate-900 px-4 py-3 text-sm">
            <span className="font-semibold text-white">Gesamtkosten (automatisch)</span>
            <span className="font-bold text-white">{fmt(f.grandTotal)}</span>
          </div>
        </div>
      </Card>

      {/* Manual cost entries */}
      <Card>
        <h3 className="mb-3 text-lg font-semibold text-slate-900">Manuelle Kosten</h3>
        {f.other.entries.length > 0 && (
          <div className="mb-4 divide-y divide-slate-100 rounded-lg border border-slate-200">
            {f.other.entries.map((c, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2 text-sm">
                <span className="font-medium text-slate-900">{c.description}</span>
                <span className="font-medium text-slate-700">{fmt(c.amount)}</span>
              </div>
            ))}
          </div>
        )}

        <h4 className="mb-3 text-sm font-semibold text-slate-700">Kosten hinzufügen</h4>
        <form action={action} className="grid gap-3 sm:grid-cols-4">
          <div className="sm:col-span-2"><Input label="Beschreibung" name="description" required error={state?.errors?.description?.[0]} /></div>
          <Input label="Betrag (€)" name="amount" type="number" step="0.01" required />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Kategorie</label>
            <select name="category" className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm">
              <option value="material">Material</option>
              <option value="subcontractor">Subunternehmer</option>
              <option value="equipment">Maschine</option>
              <option value="vehicle">Fahrzeug</option>
              <option value="other">Sonstiges</option>
            </select>
          </div>
          <input type="hidden" name="date" value={new Date().toISOString().split('T')[0]} />
          {state?.message && <p className="text-sm text-red-600 sm:col-span-4">{state.message}</p>}
          <div className="sm:col-span-4"><Button type="submit" disabled={pending} size="sm">{pending ? 'Hinzufügen...' : 'Kosten hinzufügen'}</Button></div>
        </form>
      </Card>
    </div>
  )
}

function AufmassTab({ details }: { details: OrderDetails }) {
  const orderId = details.order.id as string
  const boundCreate = createMeasurement.bind(null, orderId)
  const [state, action, pending] = useActionState<MeasurementState, FormData>(boundCreate, null)

  return (
    <div className="flex flex-col gap-6">
      {/* Existing measurements */}
      <Card className="p-0">
        <div className="px-4 py-3 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Aufmaße ({details.measurements.length})</h3>
        </div>
        {details.measurements.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">Noch keine Aufmaße erfasst</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left">
                <th className="px-4 py-3 font-medium text-slate-500">Beschreibung</th>
                <th className="px-4 py-3 font-medium text-slate-500 text-right">L</th>
                <th className="px-4 py-3 font-medium text-slate-500 text-right">B</th>
                <th className="px-4 py-3 font-medium text-slate-500 text-right">H</th>
                <th className="px-4 py-3 font-medium text-slate-500 text-right">Menge</th>
                <th className="px-4 py-3 font-medium text-slate-500 text-right">Einheit</th>
                <th className="px-4 py-3 font-medium text-slate-500 text-right">Berechnet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {details.measurements.map((m) => (
                <tr key={m.id as string}>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {m.description as string}
                    {!!(m.notes) && <p className="text-xs text-slate-400 font-normal">{m.notes as string}</p>}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600">{m.length != null ? formatNumber(Number(m.length), 2) : '–'}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{m.width != null ? formatNumber(Number(m.width), 2) : '–'}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{m.height != null ? formatNumber(Number(m.height), 2) : '–'}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{formatNumber(Number(m.quantity), 2)}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{m.unit as string}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900">
                    {formatNumber(Number(m.calculated_value), 2)} {m.unit as string}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Add measurement form */}
      <Card>
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Aufmaß hinzufügen</h3>
        <form action={action} className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input label="Beschreibung" name="description" required error={state?.errors?.description?.[0]} />
            </div>
            <Input label="Länge (m)" name="length" type="number" step="0.01" min="0" placeholder="z. B. 5.50" />
            <Input label="Breite (m)" name="width" type="number" step="0.01" min="0" placeholder="z. B. 3.20" />
            <Input label="Höhe (m)" name="height" type="number" step="0.01" min="0" placeholder="z. B. 2.50" />
            <Input label="Anzahl" name="quantity" type="number" step="0.01" min="0" defaultValue="1" />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Einheit</label>
              <select name="unit" className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm">
                <option value="m2">m² (L×B)</option>
                <option value="m3">m³ (L×B×H)</option>
                <option value="m">m (Länge)</option>
                <option value="stk">Stk</option>
                <option value="psch">Pauschal</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <Input label="Notizen" name="notes" placeholder="Optionale Anmerkungen..." />
            </div>
          </div>
          {state?.message && (
            <p className={`text-sm ${state.success ? 'text-emerald-600' : 'text-red-600'}`}>{state.message}</p>
          )}
          <Button type="submit" disabled={pending} size="sm">
            {pending ? 'Speichern...' : 'Aufmaß speichern'}
          </Button>
        </form>
      </Card>
    </div>
  )
}

function NachkalkulationTab({ details, costBreakdown }: { details: OrderDetails; costBreakdown: OrderCostBreakdown }) {
  const f = costBreakdown
  const fmt = formatCurrency

  const totalBarPct = f.revenue > 0 ? Math.min(100, (f.grandTotal / f.revenue) * 100) : 0
  const barColor = totalBarPct >= 95 ? 'bg-red-500' : totalBarPct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'

  const categories: { label: string; total: number; count: number; colorClass: string }[] = [
    { label: 'Personalkosten', total: f.labor.total, count: f.labor.entries.length, colorClass: 'text-blue-600' },
    { label: 'Materialkosten', total: f.materials.total, count: f.materials.entries.length, colorClass: 'text-emerald-600' },
    { label: 'Maschinenkosten', total: f.equipment.total, count: f.equipment.entries.length, colorClass: 'text-violet-600' },
    { label: 'Fahrzeugkosten', total: f.vehicles.total, count: f.vehicles.entries.length, colorClass: 'text-orange-600' },
    { label: 'Subunternehmer', total: f.subcontractors.total, count: f.subcontractors.entries.length, colorClass: 'text-rose-600' },
    { label: 'Sonstige Kosten', total: f.other.total, count: f.other.entries.length, colorClass: 'text-slate-600' },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Full breakdown table */}
      <Card className="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left bg-slate-50">
              <th className="px-4 py-3 font-medium text-slate-500">Kategorie</th>
              <th className="px-4 py-3 font-medium text-slate-500 text-right">Einträge</th>
              <th className="px-4 py-3 font-medium text-slate-500 text-right">IST (Tatsächlich)</th>
              <th className="px-4 py-3 font-medium text-slate-500 text-right">Anteil</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {categories.map((cat) => (
              <tr key={cat.label}>
                <td className="px-4 py-3 font-medium text-slate-900">{cat.label}</td>
                <td className="px-4 py-3 text-right text-slate-500">{cat.count}</td>
                <td className={`px-4 py-3 text-right font-medium ${cat.colorClass}`}>{fmt(cat.total)}</td>
                <td className="px-4 py-3 text-right text-slate-400">
                  {f.grandTotal > 0 ? `${Math.round((cat.total / f.grandTotal) * 100)}%` : '–'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-300 bg-slate-50">
              <td className="px-4 py-3 font-bold text-slate-900">Gesamtkosten</td>
              <td className="px-4 py-3 text-right text-slate-400">{categories.reduce((s, c) => s + c.count, 0)}</td>
              <td className="px-4 py-3 text-right font-bold text-slate-900">{fmt(f.grandTotal)}</td>
              <td className="px-4 py-3 text-right text-slate-400">100%</td>
            </tr>
            <tr className="border-t border-slate-200">
              <td className="px-4 py-3 font-medium text-slate-900">Auftragswert</td>
              <td className="px-4 py-3 text-right text-slate-400">–</td>
              <td className="px-4 py-3 text-right font-bold text-[#1e3a5f]">{fmt(f.revenue)}</td>
              <td className="px-4 py-3 text-right text-slate-400">–</td>
            </tr>
            <tr className="border-t border-slate-200">
              <td className="px-4 py-3 font-medium text-slate-900">Gewinn/Verlust</td>
              <td className="px-4 py-3 text-right text-slate-400">–</td>
              <td className={`px-4 py-3 text-right font-bold ${f.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmt(f.profit)}</td>
              <td className={`px-4 py-3 text-right font-bold ${f.margin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{f.margin}%</td>
            </tr>
          </tfoot>
        </table>
      </Card>

      {/* Expandable detail sections */}
      <div className="flex flex-col gap-3">
        <h3 className="text-base font-semibold text-slate-900">Details nach Kategorie</h3>

        <CollapsibleSection title="Personalkosten (Zeiterfassung)" total={f.labor.total} count={f.labor.entries.length} colorClass="text-blue-600">
          {f.labor.entries.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-400">Keine Zeiteinträge erfasst</p>
          ) : (
            f.labor.entries.map((e, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2 text-sm">
                <div>
                  <p className="font-medium text-slate-900">{e.name}</p>
                  <p className="text-xs text-slate-400">{e.hours}h à {fmt(e.rate)}/h</p>
                </div>
                <span className="font-medium">{fmt(e.cost)}</span>
              </div>
            ))
          )}
        </CollapsibleSection>

        <CollapsibleSection title="Materialkosten (Lager)" total={f.materials.total} count={f.materials.entries.length} colorClass="text-emerald-600">
          {f.materials.entries.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-400">Keine Materialentnahmen</p>
          ) : (
            f.materials.entries.map((e, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2 text-sm">
                <div>
                  <p className="font-medium text-slate-900">{e.name}</p>
                  <p className="text-xs text-slate-400">{e.quantity} Stk à {fmt(e.unitPrice)}</p>
                </div>
                <span className="font-medium">{fmt(e.cost)}</span>
              </div>
            ))
          )}
        </CollapsibleSection>

        <CollapsibleSection title="Maschinenkosten (Maschinenpark)" total={f.equipment.total} count={f.equipment.entries.length} colorClass="text-violet-600">
          {f.equipment.entries.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-400">Keine Maschinen zugewiesen</p>
          ) : (
            f.equipment.entries.map((e, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2 text-sm">
                <div>
                  <p className="font-medium text-slate-900">{e.name}</p>
                  <p className="text-xs text-slate-400">{e.days} Tage à {fmt(e.dailyRate)}/Tag</p>
                </div>
                <span className="font-medium">{fmt(e.cost)}</span>
              </div>
            ))
          )}
        </CollapsibleSection>

        <CollapsibleSection title="Fahrzeugkosten (Fuhrpark)" total={f.vehicles.total} count={f.vehicles.entries.length} colorClass="text-orange-600">
          {f.vehicles.entries.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-400">Keine Fahrzeuge zugewiesen</p>
          ) : (
            f.vehicles.entries.map((e, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2 text-sm">
                <div>
                  <p className="font-medium text-slate-900">{e.plate}</p>
                  <p className="text-xs text-slate-400">{e.km} km · Kraftstoff: {fmt(e.fuelCost)} · Fix: {fmt(e.leasingCost)}</p>
                </div>
                <span className="font-medium">{fmt(e.cost)}</span>
              </div>
            ))
          )}
        </CollapsibleSection>

        <CollapsibleSection title="Subunternehmer" total={f.subcontractors.total} count={f.subcontractors.entries.length} colorClass="text-rose-600">
          {f.subcontractors.entries.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-400">Keine Subunternehmer-Rechnungen</p>
          ) : (
            f.subcontractors.entries.map((e, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2 text-sm">
                <div>
                  <p className="font-medium text-slate-900">{e.name}</p>
                  {e.description && <p className="text-xs text-slate-400">{e.description}</p>}
                </div>
                <span className="font-medium">{fmt(e.invoiced)}</span>
              </div>
            ))
          )}
        </CollapsibleSection>

        <CollapsibleSection title="Sonstige Kosten (Manuell)" total={f.other.total} count={f.other.entries.length} colorClass="text-slate-600">
          {f.other.entries.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-400">Keine manuellen Kostenbuchungen</p>
          ) : (
            f.other.entries.map((e, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2 text-sm">
                <p className="font-medium text-slate-900">{e.description}</p>
                <span className="font-medium">{fmt(e.amount)}</span>
              </div>
            ))
          )}
        </CollapsibleSection>
      </div>

      {/* Visual comparison bar */}
      <Card>
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Gesamtvergleich</h3>
        <div className="space-y-4">
          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-slate-600">Kosten vs. Auftragswert</span>
              <span className="font-medium text-slate-900">{Math.round(totalBarPct)}%</span>
            </div>
            <div className="h-4 rounded-full bg-slate-100 overflow-hidden">
              <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${totalBarPct}%` }} />
            </div>
            <div className="mt-1 flex justify-between text-xs text-slate-400">
              <span>{fmt(f.grandTotal)} Kosten</span>
              <span>{fmt(f.revenue)} Auftragswert</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div className="rounded-lg bg-slate-50 p-3 text-center">
              <p className="text-xs text-slate-500 mb-1">Auftragswert</p>
              <p className="text-lg font-bold text-[#1e3a5f]">{fmt(f.revenue)}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 text-center">
              <p className="text-xs text-slate-500 mb-1">Gesamtkosten</p>
              <p className="text-lg font-bold text-slate-900">{fmt(f.grandTotal)}</p>
            </div>
            <div className={`rounded-lg p-3 text-center ${f.profit >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
              <p className="text-xs text-slate-500 mb-1">Gewinn/Verlust</p>
              <p className={`text-lg font-bold ${f.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmt(f.profit)}</p>
            </div>
            <div className={`rounded-lg p-3 text-center ${f.margin >= 15 ? 'bg-emerald-50' : f.margin >= 5 ? 'bg-amber-50' : 'bg-red-50'}`}>
              <p className="text-xs text-slate-500 mb-1">Marge</p>
              <p className={`text-lg font-bold ${f.margin >= 15 ? 'text-emerald-600' : f.margin >= 5 ? 'text-[#f59e0b]' : 'text-red-600'}`}>{f.margin}%</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

function DiaryTab({ details }: { details: OrderDetails }) {
  return (
    <div className="flex flex-col gap-4">
      {details.diaryEntries.length === 0 ? (
        <Card className="py-8 text-center text-sm text-slate-500">Keine Bautagesbericht-Einträge für diesen Auftrag</Card>
      ) : (
        details.diaryEntries.map((entry) => (
          <Card key={entry.id as string}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-slate-900">{new Date(entry.entry_date as string).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
              {!!entry.weather && <span className="text-sm text-slate-500">{entry.weather as string} {!!entry.temperature && `${entry.temperature}°C`}</span>}
            </div>
            <p className="text-sm text-slate-700">{entry.work_description as string}</p>
            {!!entry.incidents && <p className="mt-2 text-sm text-amber-700">Vorkommnisse: {entry.incidents as string}</p>}
            {!!entry.defects && <p className="text-sm text-red-700">Mängel: {entry.defects as string}</p>}
          </Card>
        ))
      )}
    </div>
  )
}

function TeamTab({ details, workers }: { details: OrderDetails; workers: { id: string; first_name: string; last_name: string }[] }) {
  const workerMap = new Map(workers.map(w => [w.id, `${w.first_name} ${w.last_name}`]))

  const employees = details.assignments.filter(a => a.resource_type === 'employee')
  const vehicleAssignments = details.assignments.filter(a => a.resource_type === 'vehicle')
  const equipmentAssignments = details.assignments.filter(a => a.resource_type === 'equipment')

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card>
        <h3 className="mb-3 text-lg font-semibold text-slate-900">Mitarbeiter ({employees.length})</h3>
        {employees.length === 0 ? (
          <p className="text-sm text-slate-500">Keine zugewiesen</p>
        ) : (
          <div className="space-y-2">
            {employees.map(a => (
              <div key={a.id as string} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
                <p className="font-medium text-slate-900">{workerMap.get(a.resource_id as string) || 'Unbekannt'}</p>
                {!!a.notes && <p className="text-xs text-slate-500">{a.notes as string}</p>}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h3 className="mb-3 text-lg font-semibold text-slate-900">Fahrzeuge ({vehicleAssignments.length})</h3>
        {vehicleAssignments.length === 0 ? <p className="text-sm text-slate-500">Keine zugewiesen</p> : (
          <div className="space-y-2">
            {vehicleAssignments.map(a => (
              <div key={a.id as string} className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900">{a.resource_id as string}</div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h3 className="mb-3 text-lg font-semibold text-slate-900">Maschinen ({equipmentAssignments.length})</h3>
        {equipmentAssignments.length === 0 ? <p className="text-sm text-slate-500">Keine zugewiesen</p> : (
          <div className="space-y-2">
            {equipmentAssignments.map(a => (
              <div key={a.id as string} className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900">{a.resource_id as string}</div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
