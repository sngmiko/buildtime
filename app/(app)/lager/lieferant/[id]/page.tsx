import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { ChevronLeft, Package } from 'lucide-react'
import { SupplierEditForm } from './supplier-edit-form'
import type { Supplier, Material } from '@/lib/types'
import { formatNumber } from '@/lib/format'

const UNIT_LABELS: Record<string, string> = {
  piece: 'Stk', m: 'm', m2: 'm²', m3: 'm³', kg: 'kg', l: 'l', pack: 'Pack.',
}

export default async function SupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['owner', 'foreman', 'super_admin'].includes(profile.role)) redirect('/stempeln')

  const [{ data: supplier }, { data: materials }] = await Promise.all([
    supabase.from('suppliers').select('*').eq('id', id).single(),
    supabase
      .from('materials')
      .select('*')
      .eq('supplier_id', id)
      .order('name'),
  ])

  if (!supplier) notFound()

  const s = supplier as Supplier

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/lager?tab=lieferanten" className="text-slate-500 hover:text-slate-900">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{s.name}</h1>
          <p className="text-sm text-slate-500">
            {s.contact_person || 'Lieferant'}
            {s.rating != null && (
              <span className="ml-2">
                {'★'.repeat(s.rating)}{'☆'.repeat(5 - s.rating)}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{materials?.length ?? 0}</p>
          <p className="text-xs text-slate-500">Materialien</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">
            {s.rating != null ? `${s.rating}/5` : '–'}
          </p>
          <p className="text-xs text-slate-500">Bewertung</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Edit form */}
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Details bearbeiten</h2>
          <SupplierEditForm supplier={s} />
        </Card>

        {/* Materials from this supplier */}
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-slate-900">Materialien</h2>
          {(!materials || materials.length === 0) ? (
            <Card className="py-8 text-center text-sm text-slate-500">
              <Package className="mx-auto mb-2 h-8 w-8 text-slate-300" />
              Keine Materialien von diesem Lieferanten
            </Card>
          ) : (
            <Card className="p-0">
              <div className="divide-y divide-slate-100">
                {(materials as Material[]).map((m) => (
                  <Link
                    key={m.id}
                    href={`/lager/material/${m.id}`}
                    className="flex items-center justify-between px-4 py-3 text-sm hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{m.name}</p>
                      {m.article_number && (
                        <p className="text-xs text-slate-500">Art.-Nr. {m.article_number}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${m.current_stock <= m.min_stock ? 'text-red-600' : 'text-slate-900'}`}>
                        {m.current_stock} {UNIT_LABELS[m.unit]}
                      </p>
                      {m.price_per_unit != null && (
                        <p className="text-xs text-slate-500">{formatNumber(m.price_per_unit, 2)} €/{UNIT_LABELS[m.unit]}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
