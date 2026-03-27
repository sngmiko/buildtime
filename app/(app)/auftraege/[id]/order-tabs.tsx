'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useActionState } from 'react'
import { addOrderItem, addOrderCost, type OrdersState } from '@/actions/orders'
import { FileText, Calculator, BookOpen, Users, BarChart3 } from 'lucide-react'

const TABS = [
  { id: 'overview', label: 'Übersicht', icon: FileText },
  { id: 'items', label: 'Positionen', icon: BarChart3 },
  { id: 'costs', label: 'Kosten', icon: Calculator },
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
  financials: { revenue: number; laborCost: number; externalCosts: number; subCosts: number; totalCosts: number; profit: number; margin: number }
}

export function OrderDetailTabs({
  details,
  activeTab,
  sites,
  workers,
}: {
  details: OrderDetails
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
      {activeTab === 'costs' && <CostsTab details={details} workers={workers} />}
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
          {!!o.budget && <div className="flex justify-between"><dt className="text-slate-500">Budget</dt><dd className="font-medium">{Number(o.budget).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</dd></div>}
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
                <td className="px-4 py-3 text-right text-slate-700">{Number(item.unit_price).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</td>
                <td className="px-4 py-3 text-right font-medium text-slate-900">{(Number(item.quantity) * Number(item.unit_price)).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-300">
              <td colSpan={4} className="px-4 py-3 font-bold text-slate-900">Gesamt</td>
              <td className="px-4 py-3 text-right font-bold text-slate-900">{total.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</td>
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

function CostsTab({ details, workers }: { details: OrderDetails; workers: { id: string; first_name: string; last_name: string; hourly_rate: number | null }[] }) {
  const f = details.financials
  const budgetPct = details.order.budget ? (f.totalCosts / Number(details.order.budget)) * 100 : 0
  const barColor = budgetPct >= 95 ? 'bg-red-500' : budgetPct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'

  // Group labor by employee
  const laborByEmployee = new Map<string, { name: string; hours: number; cost: number }>()
  for (const e of details.timeEntries) {
    const p = e.profiles as { first_name: string; last_name: string; hourly_rate: number | null } | null
    if (!p || !e.clock_out) continue
    const hours = Math.max(0, (new Date(e.clock_out as string).getTime() - new Date(e.clock_in as string).getTime()) / 3600000 - (e.break_minutes as number) / 60)
    const name = `${p.first_name} ${p.last_name}`
    const existing = laborByEmployee.get(e.user_id as string) || { name, hours: 0, cost: 0 }
    existing.hours += hours
    existing.cost += hours * (p.hourly_rate || 0)
    laborByEmployee.set(e.user_id as string, existing)
  }

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
            <span>{f.totalCosts.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} von {Number(details.order.budget).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
          </div>
        </Card>
      )}

      {/* Cost breakdown */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <h3 className="mb-3 text-lg font-semibold text-slate-900">Personalkosten</h3>
          {laborByEmployee.size === 0 ? (
            <p className="text-sm text-slate-500">Keine Zeiteinträge</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {[...laborByEmployee.values()].map((emp, i) => (
                <div key={i} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <p className="font-medium text-slate-900">{emp.name}</p>
                    <p className="text-xs text-slate-500">{emp.hours.toFixed(1)}h</p>
                  </div>
                  <span className="font-medium">{emp.cost.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
                </div>
              ))}
              <div className="flex items-center justify-between py-2 text-sm font-bold">
                <span>Gesamt Personal</span>
                <span className="text-blue-600">{f.laborCost.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
              </div>
            </div>
          )}
        </Card>

        <Card>
          <h3 className="mb-3 text-lg font-semibold text-slate-900">Sonstige Kosten</h3>
          {details.costs.length === 0 && details.subAssignments.length === 0 ? (
            <p className="text-sm text-slate-500">Keine sonstigen Kosten</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {details.costs.map((c) => (
                <div key={c.id as string} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <p className="font-medium text-slate-900">{c.description as string}</p>
                    <p className="text-xs text-slate-500">{{ subcontractor: 'Sub', material: 'Material', equipment: 'Gerät', vehicle: 'Fahrzeug', other: 'Sonstiges' }[c.category as string]}</p>
                  </div>
                  <span className="font-medium">{Number(c.amount).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
                </div>
              ))}
              {details.subAssignments.map((s) => (
                <div key={s.id as string} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <p className="font-medium text-slate-900">{(s.subcontractors as { name: string })?.name}</p>
                    <p className="text-xs text-slate-500">Subunternehmer</p>
                  </div>
                  <span className="font-medium">{Number(s.invoiced_amount || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Add cost */}
      <Card>
        <h3 className="mb-4 text-lg font-semibold">Kosten hinzufügen</h3>
        <form action={action} className="grid gap-3 sm:grid-cols-4">
          <div className="sm:col-span-2"><Input label="Beschreibung" name="description" required error={state?.errors?.description?.[0]} /></div>
          <Input label="Betrag (€)" name="amount" type="number" step="0.01" required />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Kategorie</label>
            <select name="category" className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm">
              <option value="material">Material</option>
              <option value="subcontractor">Subunternehmer</option>
              <option value="equipment">Gerät</option>
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

function DiaryTab({ details }: { details: OrderDetails }) {
  return (
    <div className="flex flex-col gap-4">
      {details.diaryEntries.length === 0 ? (
        <Card className="py-8 text-center text-sm text-slate-500">Keine Bautagebuch-Einträge für diesen Auftrag</Card>
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
        <h3 className="mb-3 text-lg font-semibold text-slate-900">Geräte ({equipmentAssignments.length})</h3>
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
