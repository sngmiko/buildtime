import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { ChevronLeft, AlertTriangle } from 'lucide-react'
import { SubEditForm } from './sub-edit-form'
import type { Subcontractor, SubcontractorAssignment } from '@/lib/types'

export default async function SubDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['owner', 'foreman'].includes(profile.role)) redirect('/dashboard')

  const [{ data: sub }, { data: assignments }] = await Promise.all([
    supabase.from('subcontractors').select('*').eq('id', id).single(),
    supabase.from('subcontractor_assignments').select('*, orders(title, status)').eq('subcontractor_id', id).order('created_at', { ascending: false }),
  ])

  if (!sub) notFound()
  const s = sub as Subcontractor

  const taxExpiring = s.tax_exemption_valid_until && new Date(s.tax_exemption_valid_until) < new Date(Date.now() + 30 * 86400000)
  const avgRating = [s.quality_rating, s.reliability_rating, s.price_rating].filter(Boolean)
  const avg = avgRating.length > 0 ? (avgRating.reduce((a, b) => (a || 0) + (b || 0), 0)! / avgRating.length).toFixed(1) : null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/subunternehmer" className="text-slate-500 hover:text-slate-900"><ChevronLeft className="h-5 w-5" /></Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{s.name}</h1>
          <p className="text-sm text-slate-500">{s.trade || 'Subunternehmer'}{avg && ` · ${avg} ★`}</p>
        </div>
      </div>

      {taxExpiring && (
        <Card className="border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-amber-700">
            <AlertTriangle className="h-4 w-4" />
            Freistellungsbescheinigung (§48b) läuft ab am {new Date(s.tax_exemption_valid_until!).toLocaleDateString('de-DE')}
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="max-w-lg">
          <SubEditForm sub={s} />
        </Card>

        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-slate-900">Einsätze</h2>
          {(!assignments || assignments.length === 0) ? (
            <Card className="py-6 text-center text-sm text-slate-500">Keine Einsätze</Card>
          ) : (
            <Card className="p-0">
              <div className="divide-y divide-slate-100">
                {(assignments as (SubcontractorAssignment & { orders: { title: string; status: string } | null })[]).map((a) => (
                  <div key={a.id} className="flex items-center justify-between px-4 py-3 text-sm">
                    <div>
                      <p className="font-medium text-slate-900">{a.orders?.title || 'Unbekannt'}</p>
                      <p className="text-xs text-slate-500">{a.description}</p>
                    </div>
                    <div className="text-right">
                      {a.agreed_amount && <p className="font-medium">{Number(a.agreed_amount).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</p>}
                      <p className="text-xs text-slate-500">{{ active: 'Aktiv', completed: 'Abgeschlossen', cancelled: 'Storniert' }[a.status]}</p>
                    </div>
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
