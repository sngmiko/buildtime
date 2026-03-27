import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { ChevronLeft, AlertTriangle, TrendingUp, TrendingDown, RotateCcw } from 'lucide-react'
import { MaterialEditForm } from './material-edit-form'
import { StockMovementForm } from './stock-movement-form'
import type { Material, Supplier, StockMovement } from '@/lib/types'

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
const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  in: 'Eingang',
  out: 'Ausgang',
  return: 'Rückgabe',
}

export default async function MaterialDetailPage({
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

  const [{ data: material }, { data: movements }, { data: suppliers }, { data: activeSites }, { data: activeOrders }] = await Promise.all([
    supabase.from('materials').select('*, suppliers(name)').eq('id', id).single(),
    supabase
      .from('stock_movements')
      .select('*, construction_sites(name)')
      .eq('material_id', id)
      .order('created_at', { ascending: false })
      .limit(30),
    supabase.from('suppliers').select('id, name').order('name'),
    supabase.from('construction_sites').select('id, name').eq('status', 'active').order('name'),
    supabase.from('orders').select('id, title').in('status', ['commissioned', 'in_progress']).order('title'),
  ])

  if (!material) notFound()

  const m = material as Material & { suppliers: { name: string } | null }
  const isLow = m.current_stock <= m.min_stock

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/lager" className="text-slate-500 hover:text-slate-900">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{m.name}</h1>
          <p className="text-sm text-slate-500">
            {CATEGORY_LABELS[m.category]}
            {m.article_number && ` · Art.-Nr. ${m.article_number}`}
            {m.suppliers && ` · ${m.suppliers.name}`}
          </p>
        </div>
      </div>

      {/* Stock indicator */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className={`p-4 text-center ${isLow ? 'border-red-200 bg-red-50' : ''}`}>
          <p className={`text-2xl font-bold ${isLow ? 'text-red-600' : 'text-slate-900'}`}>
            {m.current_stock} {UNIT_LABELS[m.unit]}
          </p>
          <p className={`text-xs ${isLow ? 'text-red-500' : 'text-slate-500'}`}>
            {isLow ? (
              <span className="flex items-center justify-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Aktueller Bestand (niedrig)
              </span>
            ) : (
              'Aktueller Bestand'
            )}
          </p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">
            {m.min_stock} {UNIT_LABELS[m.unit]}
          </p>
          <p className="text-xs text-slate-500">Mindestbestand</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">
            {m.price_per_unit != null
              ? `${m.price_per_unit.toFixed(2)} €`
              : '–'}
          </p>
          <p className="text-xs text-slate-500">Preis / {UNIT_LABELS[m.unit]}</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Edit form */}
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Details bearbeiten</h2>
          <MaterialEditForm
            material={m}
            suppliers={(suppliers as Supplier[]) || []}
          />
        </Card>

        {/* Stock movement history */}
        <div className="flex flex-col gap-4">
          <StockMovementForm
            materialId={m.id}
            sites={(activeSites || []) as { id: string; name: string }[]}
            orders={(activeOrders || []) as { id: string; title: string }[]}
            defaultUnitPrice={m.price_per_unit}
          />
          <h2 className="text-lg font-semibold text-slate-900">Lagerbewegungen</h2>
          {(!movements || movements.length === 0) ? (
            <Card className="py-8 text-center text-sm text-slate-500">
              Keine Lagerbewegungen vorhanden
            </Card>
          ) : (
            <Card className="p-0">
              <div className="divide-y divide-slate-100">
                {(movements as (StockMovement & { construction_sites: { name: string } | null })[]).map((mv) => (
                  <div key={mv.id} className="flex items-center justify-between px-4 py-3 text-sm">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-7 w-7 items-center justify-center rounded-full ${
                        mv.type === 'in' ? 'bg-emerald-100 text-emerald-600'
                        : mv.type === 'out' ? 'bg-red-100 text-red-600'
                        : 'bg-blue-100 text-blue-600'
                      }`}>
                        {mv.type === 'in' ? <TrendingUp className="h-3.5 w-3.5" />
                          : mv.type === 'out' ? <TrendingDown className="h-3.5 w-3.5" />
                          : <RotateCcw className="h-3.5 w-3.5" />}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{MOVEMENT_TYPE_LABELS[mv.type]}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(mv.created_at).toLocaleDateString('de-DE')}
                          {mv.construction_sites && ` · ${mv.construction_sites.name}`}
                          {mv.notes && ` · ${mv.notes}`}
                        </p>
                      </div>
                    </div>
                    <span className={`font-semibold ${
                      mv.type === 'in' ? 'text-emerald-600'
                      : mv.type === 'out' ? 'text-red-600'
                      : 'text-blue-600'
                    }`}>
                      {mv.type === 'out' ? '-' : '+'}{mv.quantity} {UNIT_LABELS[m.unit]}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
