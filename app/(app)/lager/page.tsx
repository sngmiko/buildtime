import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Package, AlertTriangle } from 'lucide-react'
import type { Material, Supplier, PurchaseOrder } from '@/lib/types'

const UNIT_LABELS: Record<string, string> = {
  piece: 'Stk', m: 'm', m2: 'm²', m3: 'm³', kg: 'kg', l: 'l', pack: 'Pack.',
}
const CATEGORY_LABELS: Record<string, string> = {
  building_material: 'Baumaterial',
  consumable: 'Verbrauchsmaterial',
  tool: 'Werkzeug',
  small_parts: 'Kleinteile',
  other: 'Sonstiges',
}
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

export default async function LagerPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  const activeTab = tab || 'materialien'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['owner', 'foreman'].includes(profile.role)) redirect('/stempeln')

  const { data: materials } = await supabase
    .from('materials')
    .select('*, suppliers(name)')
    .order('name')
  const { data: suppliers } = await supabase
    .from('suppliers')
    .select('*')
    .order('name')
  const { data: orders } = await supabase
    .from('purchase_orders')
    .select('*, suppliers(name)')
    .order('order_date', { ascending: false })

  const lowStockMaterials = (materials as (Material & { suppliers: { name: string } | null })[] || [])
    .filter(m => m.current_stock <= m.min_stock)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Lager & Einkauf</h1>
        <div className="flex gap-2">
          <Link href="/lager/material-neu">
            <Button><Plus className="h-4 w-4" /> Neues Material</Button>
          </Link>
          <Link href="/lager/bestellung-neu">
            <Button variant="secondary"><Plus className="h-4 w-4" /> Neue Bestellung</Button>
          </Link>
        </div>
      </div>

      {lowStockMaterials.length > 0 && (
        <Card className="border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-red-700">
            <AlertTriangle className="h-4 w-4" />
            Niedriger Lagerbestand
          </div>
          <div className="mt-2 space-y-1 text-xs text-red-600">
            {lowStockMaterials.map(m => (
              <p key={m.id}>{m.name} — {m.current_stock} / {m.min_stock} {UNIT_LABELS[m.unit]}</p>
            ))}
          </div>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
        {[
          { key: 'materialien', label: 'Materialien' },
          { key: 'lieferanten', label: 'Lieferanten' },
          { key: 'bestellungen', label: 'Bestellungen' },
        ].map(({ key, label }) => (
          <Link
            key={key}
            href={`?tab=${key}`}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === key ? 'bg-[#1e3a5f] text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Tab: Materialien */}
      {activeTab === 'materialien' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(materials as (Material & { suppliers: { name: string } | null })[] || []).map((m) => {
            const isLow = m.current_stock <= m.min_stock
            return (
              <Link key={m.id} href={`/lager/material/${m.id}`}>
                <Card className="transition-shadow hover:shadow-md cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate">{m.name}</h3>
                      {m.article_number && (
                        <p className="text-xs text-slate-400">Art.-Nr. {m.article_number}</p>
                      )}
                      <p className="text-sm text-slate-500">{CATEGORY_LABELS[m.category]}</p>
                      {m.suppliers && (
                        <p className="text-xs text-slate-400">{m.suppliers.name}</p>
                      )}
                    </div>
                    <div className="ml-3 text-right shrink-0">
                      <p className={`text-sm font-semibold ${isLow ? 'text-red-600' : 'text-slate-900'}`}>
                        {m.current_stock} {UNIT_LABELS[m.unit]}
                      </p>
                      {isLow && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
                          <AlertTriangle className="h-3 w-3" /> Niedrig
                        </span>
                      )}
                      {m.price_per_unit != null && (
                        <p className="text-xs text-slate-400 mt-1">
                          {m.price_per_unit.toFixed(2)} €/{UNIT_LABELS[m.unit]}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
          {(!materials || materials.length === 0) && (
            <Card className="col-span-full py-8 text-center text-sm text-slate-500">
              <Package className="mx-auto mb-2 h-8 w-8 text-slate-300" />
              Keine Materialien vorhanden
            </Card>
          )}
        </div>
      )}

      {/* Tab: Lieferanten */}
      {activeTab === 'lieferanten' && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <Link href="/lager/lieferant-neu">
              <Button variant="secondary"><Plus className="h-4 w-4" /> Neuer Lieferant</Button>
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {(suppliers as Supplier[] || []).map((s) => (
              <Link key={s.id} href={`/lager/lieferant/${s.id}`}>
                <Card className="transition-shadow hover:shadow-md cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900">{s.name}</h3>
                      {s.contact_person && (
                        <p className="text-sm text-slate-500">{s.contact_person}</p>
                      )}
                      <div className="mt-1 flex gap-4 text-xs text-slate-400">
                        {s.email && <span>{s.email}</span>}
                        {s.phone && <span>{s.phone}</span>}
                      </div>
                    </div>
                    {s.rating != null && (
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span
                            key={i}
                            className={`text-lg ${i < s.rating! ? 'text-[#f59e0b]' : 'text-slate-200'}`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
            {(!suppliers || suppliers.length === 0) && (
              <Card className="py-8 text-center text-sm text-slate-500">Keine Lieferanten vorhanden</Card>
            )}
          </div>
        </div>
      )}

      {/* Tab: Bestellungen */}
      {activeTab === 'bestellungen' && (
        <div className="flex flex-col gap-3">
          {(orders as (PurchaseOrder & { suppliers: { name: string } | null })[] || []).map((o) => (
            <Link key={o.id} href={`/lager/bestellung/${o.id}`}>
              <Card className="transition-shadow hover:shadow-md cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {o.suppliers?.name ?? 'Kein Lieferant'}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {new Date(o.order_date).toLocaleDateString('de-DE')}
                      {o.total_amount != null && ` · ${o.total_amount.toFixed(2)} €`}
                    </p>
                    {o.notes && <p className="text-xs text-slate-400 mt-1">{o.notes}</p>}
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ORDER_STATUS_COLORS[o.status]}`}>
                    {ORDER_STATUS_LABELS[o.status]}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
          {(!orders || orders.length === 0) && (
            <Card className="py-8 text-center text-sm text-slate-500">Keine Bestellungen vorhanden</Card>
          )}
        </div>
      )}
    </div>
  )
}
