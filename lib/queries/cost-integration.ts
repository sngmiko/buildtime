import type { SupabaseClient } from '@supabase/supabase-js'

export type OrderCostBreakdown = {
  labor: { total: number; entries: { name: string; hours: number; rate: number; cost: number; surcharges: number }[] }
  materials: { total: number; entries: { name: string; quantity: number; unitPrice: number; cost: number }[] }
  equipment: { total: number; entries: { name: string; days: number; dailyRate: number; cost: number }[] }
  vehicles: { total: number; entries: { plate: string; km: number; fuelCost: number; leasingCost: number; cost: number }[] }
  subcontractors: { total: number; entries: { name: string; description: string; invoiced: number }[] }
  other: { total: number; entries: { description: string; amount: number }[] }
  grandTotal: number
  revenue: number
  profit: number
  margin: number
}

export async function calculateFullOrderCosts(supabase: SupabaseClient, orderId: string): Promise<OrderCostBreakdown> {
  // Get order + site
  const { data: order } = await supabase.from('orders').select('site_id').eq('id', orderId).single()
  const siteId = order?.site_id

  // 1. LABOR: Time entries on this site × hourly rate
  let laborEntries: { name: string; hours: number; rate: number; cost: number; surcharges: number }[] = []
  let laborTotal = 0
  if (siteId) {
    const { data: timeEntries } = await supabase
      .from('time_entries')
      .select('clock_in, clock_out, break_minutes, profiles(first_name, last_name, hourly_rate)')
      .eq('site_id', siteId)
      .not('clock_out', 'is', null)

    const byWorker = new Map<string, { name: string; hours: number; rate: number }>()
    for (const e of timeEntries || []) {
      const p = e.profiles as { first_name: string; last_name: string; hourly_rate: number | null } | null
      if (!p) continue
      const hours = Math.max(0, (new Date(e.clock_out as string).getTime() - new Date(e.clock_in as string).getTime()) / 3600000 - (e.break_minutes as number) / 60)
      const name = `${p.first_name} ${p.last_name}`
      const existing = byWorker.get(name) || { name, hours: 0, rate: p.hourly_rate || 0 }
      existing.hours += hours
      byWorker.set(name, existing)
    }
    laborEntries = [...byWorker.values()].map(w => ({
      ...w,
      hours: Math.round(w.hours * 10) / 10,
      cost: Math.round(w.hours * w.rate * 100) / 100,
      surcharges: 0, // simplified — surcharge calc would add ~25% for night/weekend
    }))
    laborTotal = laborEntries.reduce((s, e) => s + e.cost, 0)
  }

  // 2. MATERIALS: Stock movements out for this site/order
  const { data: materialMovements } = await supabase
    .from('stock_movements')
    .select('quantity, unit_price, materials(name, price_per_unit)')
    .eq('type', 'out')
    .or(siteId ? `site_id.eq.${siteId},order_id.eq.${orderId}` : `order_id.eq.${orderId}`)

  const materialEntries = (materialMovements || []).map((m: { quantity: number; unit_price: number | null; materials: { name: string; price_per_unit: number | null } | null }) => {
    const unitPrice = m.unit_price || m.materials?.price_per_unit || 0
    return {
      name: m.materials?.name || 'Unbekannt',
      quantity: m.quantity,
      unitPrice,
      cost: Math.round(m.quantity * unitPrice * 100) / 100,
    }
  })
  const materialsTotal = materialEntries.reduce((s, e) => s + e.cost, 0)

  // 3. EQUIPMENT: Equipment assigned to this site × daily rate × days
  let equipmentEntries: { name: string; days: number; dailyRate: number; cost: number }[] = []
  let equipmentTotal = 0
  if (siteId) {
    const { data: assignedEquipment } = await supabase
      .from('equipment')
      .select('name, daily_rate, created_at')
      .eq('assigned_site', siteId)

    equipmentEntries = (assignedEquipment || []).map((eq: { name: string; daily_rate: number | null; created_at: string }) => {
      const days = Math.max(1, Math.ceil((Date.now() - new Date(eq.created_at).getTime()) / 86400000))
      const dailyRate = eq.daily_rate || 0
      return { name: eq.name, days, dailyRate, cost: Math.round(days * dailyRate * 100) / 100 }
    })
    equipmentTotal = equipmentEntries.reduce((s, e) => s + e.cost, 0)
  }

  // 4. VEHICLES: Trip logs for this site + fuel costs for assigned vehicles
  let vehicleEntries: { plate: string; km: number; fuelCost: number; leasingCost: number; cost: number }[] = []
  let vehiclesTotal = 0
  if (siteId) {
    // Get vehicle assignments via order_assignments
    const { data: vehicleAssignments } = await supabase
      .from('order_assignments')
      .select('resource_id')
      .eq('order_id', orderId)
      .eq('resource_type', 'vehicle')

    for (const va of vehicleAssignments || []) {
      const { data: vehicle } = await supabase
        .from('vehicles')
        .select('license_plate, monthly_rate, insurance_cost, tax_cost')
        .eq('id', va.resource_id)
        .single()

      const { data: trips } = await supabase
        .from('trip_logs')
        .select('km')
        .eq('vehicle_id', va.resource_id)

      const { data: fuel } = await supabase
        .from('fuel_logs')
        .select('cost')
        .eq('vehicle_id', va.resource_id)

      const totalKm = (trips || []).reduce((s: number, t: { km: number }) => s + Number(t.km), 0)
      const fuelCost = (fuel || []).reduce((s: number, f: { cost: number }) => s + Number(f.cost), 0)
      const monthlyFixed = Number(vehicle?.monthly_rate || 0) + Number(vehicle?.insurance_cost || 0) + Number(vehicle?.tax_cost || 0)

      vehicleEntries.push({
        plate: vehicle?.license_plate || 'Unbekannt',
        km: totalKm,
        fuelCost: Math.round(fuelCost * 100) / 100,
        leasingCost: Math.round(monthlyFixed * 100) / 100,
        cost: Math.round((fuelCost + monthlyFixed) * 100) / 100,
      })
    }
    vehiclesTotal = vehicleEntries.reduce((s, e) => s + e.cost, 0)
  }

  // 5. SUBCONTRACTORS: Invoiced amounts from sub assignments
  const { data: subAssignments } = await supabase
    .from('subcontractor_assignments')
    .select('invoiced_amount, description, subcontractors(name)')
    .eq('order_id', orderId)

  const subEntries = (subAssignments || []).map((s: { invoiced_amount: number; description: string; subcontractors: { name: string } | null }) => ({
    name: s.subcontractors?.name || 'Unbekannt',
    description: s.description,
    invoiced: Number(s.invoiced_amount || 0),
  }))
  const subTotal = subEntries.reduce((s, e) => s + e.invoiced, 0)

  // 6. OTHER: Direct order_costs entries
  const { data: otherCosts } = await supabase
    .from('order_costs')
    .select('description, amount')
    .eq('order_id', orderId)

  const otherEntries = (otherCosts || []).map((c: { description: string; amount: number }) => ({
    description: c.description,
    amount: Number(c.amount),
  }))
  const otherTotal = otherEntries.reduce((s, e) => s + e.amount, 0)

  // REVENUE from order items
  const { data: items } = await supabase.from('order_items').select('quantity, unit_price').eq('order_id', orderId)
  const revenue = (items || []).reduce((s: number, i: { quantity: number; unit_price: number }) => s + Number(i.quantity) * Number(i.unit_price), 0)

  const grandTotal = laborTotal + materialsTotal + equipmentTotal + vehiclesTotal + subTotal + otherTotal
  const profit = revenue - grandTotal
  const margin = revenue > 0 ? Math.round((profit / revenue) * 1000) / 10 : 0

  return {
    labor: { total: laborTotal, entries: laborEntries },
    materials: { total: materialsTotal, entries: materialEntries },
    equipment: { total: equipmentTotal, entries: equipmentEntries },
    vehicles: { total: vehiclesTotal, entries: vehicleEntries },
    subcontractors: { total: subTotal, entries: subEntries },
    other: { total: otherTotal, entries: otherEntries },
    grandTotal: Math.round(grandTotal * 100) / 100,
    revenue: Math.round(revenue * 100) / 100,
    profit: Math.round(profit * 100) / 100,
    margin,
  }
}
