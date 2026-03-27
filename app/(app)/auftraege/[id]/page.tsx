import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { ChevronLeft } from 'lucide-react'
import { OrderDetailTabs } from './order-tabs'
import { calculateOrderProfitability } from '@/actions/orders'
import type { Order, Customer, OrderItem, OrderCost, OrderAssignment, ConstructionSite } from '@/lib/types'

export default async function AuftragDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { id } = await params
  const { tab } = await searchParams
  const activeTab = tab || 'uebersicht'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['owner', 'foreman'].includes(profile.role)) redirect('/stempeln')

  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .single()

  if (!order) notFound()

  const typedOrder = order as Order

  const [
    { data: customer },
    { data: site },
    { data: items },
    { data: costs },
    { data: assignments },
  ] = await Promise.all([
    supabase.from('customers').select('*').eq('id', typedOrder.customer_id).single(),
    typedOrder.site_id
      ? supabase.from('construction_sites').select('*').eq('id', typedOrder.site_id).single()
      : Promise.resolve({ data: null }),
    supabase.from('order_items').select('*').eq('order_id', id).order('position'),
    supabase.from('order_costs').select('*').eq('order_id', id).order('date', { ascending: false }),
    supabase.from('order_assignments').select('*').eq('order_id', id).order('created_at'),
  ])

  // Resolve assignment names
  const typedAssignments = (assignments as OrderAssignment[] || [])
  const employeeIds = typedAssignments.filter(a => a.resource_type === 'employee').map(a => a.resource_id)
  const vehicleIds = typedAssignments.filter(a => a.resource_type === 'vehicle').map(a => a.resource_id)
  const equipmentIds = typedAssignments.filter(a => a.resource_type === 'equipment').map(a => a.resource_id)

  const [
    { data: empProfiles },
    { data: vehicles },
    { data: equipment },
  ] = await Promise.all([
    employeeIds.length > 0
      ? supabase.from('profiles').select('id, first_name, last_name').in('id', employeeIds)
      : Promise.resolve({ data: [] }),
    vehicleIds.length > 0
      ? supabase.from('vehicles').select('id, make, model, license_plate').in('id', vehicleIds)
      : Promise.resolve({ data: [] }),
    equipmentIds.length > 0
      ? supabase.from('equipment').select('id, name').in('id', equipmentIds)
      : Promise.resolve({ data: [] }),
  ])

  const nameMap = new Map<string, string>()
  for (const p of empProfiles || []) nameMap.set(p.id, `${p.first_name} ${p.last_name}`)
  for (const v of vehicles || []) nameMap.set(v.id, `${v.make} ${v.model} (${v.license_plate})`)
  for (const e of equipment || []) nameMap.set(e.id, e.name)

  const assignmentsWithNames = typedAssignments.map(a => ({ ...a, name: nameMap.get(a.resource_id) }))

  const profitability = await calculateOrderProfitability(id)

  const STATUS_LABELS: Record<string, string> = {
    quote: 'Angebot',
    commissioned: 'Beauftragt',
    in_progress: 'In Arbeit',
    acceptance: 'Abnahme',
    completed: 'Abgeschlossen',
    complaint: 'Reklamation',
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/auftraege" className="text-slate-500 hover:text-slate-900">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-slate-900 truncate">{typedOrder.title}</h1>
          <p className="text-sm text-slate-500">
            {STATUS_LABELS[typedOrder.status]}
            {customer && ` · ${(customer as Customer).name}`}
          </p>
        </div>
      </div>

      <OrderDetailTabs
        order={typedOrder}
        customer={customer as Customer | null}
        site={site as ConstructionSite | null}
        items={(items as OrderItem[]) || []}
        costs={(costs as OrderCost[]) || []}
        assignments={assignmentsWithNames}
        profitability={profitability}
        activeTab={activeTab}
      />
    </div>
  )
}
