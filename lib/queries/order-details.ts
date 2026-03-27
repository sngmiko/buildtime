import type { SupabaseClient } from '@supabase/supabase-js'

export async function getOrderFullDetails(supabase: SupabaseClient, orderId: string) {
  const [
    { data: order },
    { data: items },
    { data: costs },
    { data: assignments },
    { data: timeEntries },
    { data: diaryEntries },
    { data: subAssignments },
    { data: measurements },
  ] = await Promise.all([
    supabase.from('orders').select('*, customers(name, contact_person, email, phone), construction_sites(name, address)').eq('id', orderId).single(),
    supabase.from('order_items').select('*').eq('order_id', orderId).order('position'),
    supabase.from('order_costs').select('*').eq('order_id', orderId).order('date', { ascending: false }),
    supabase.from('order_assignments').select('*').eq('order_id', orderId),
    // Get time entries for this order's site
    supabase.from('orders').select('site_id').eq('id', orderId).single().then(async ({ data }) => {
      if (!data?.site_id) return { data: [] }
      return supabase.from('time_entries').select('*, profiles(first_name, last_name, hourly_rate)').eq('site_id', data.site_id).order('clock_in', { ascending: false })
    }),
    supabase.from('orders').select('site_id').eq('id', orderId).single().then(async ({ data }) => {
      if (!data?.site_id) return { data: [] }
      return supabase.from('diary_entries').select('*').eq('site_id', data.site_id).order('entry_date', { ascending: false }).limit(10)
    }),
    supabase.from('subcontractor_assignments').select('*, subcontractors(name, trade)').eq('order_id', orderId),
    supabase.from('measurements').select('*').eq('order_id', orderId).order('created_at', { ascending: false }),
  ])

  // Calculate financials
  const revenue = (items || []).reduce((sum: number, i: { quantity: number; unit_price: number }) => sum + i.quantity * i.unit_price, 0)

  const laborCost = (timeEntries || []).reduce((sum: number, e: { clock_in: string; clock_out: string | null; break_minutes: number; profiles: { hourly_rate: number | null } | null }) => {
    if (!e.clock_out || !e.profiles?.hourly_rate) return sum
    const hours = (new Date(e.clock_out).getTime() - new Date(e.clock_in).getTime()) / 3600000 - e.break_minutes / 60
    return sum + Math.max(0, hours) * e.profiles.hourly_rate
  }, 0)

  const externalCosts = (costs || []).reduce((sum: number, c: { amount: number }) => sum + Number(c.amount), 0)
  const subCosts = (subAssignments || []).reduce((sum: number, s: { invoiced_amount: number }) => sum + Number(s.invoiced_amount || 0), 0)

  const totalCosts = laborCost + externalCosts + subCosts
  const margin = revenue > 0 ? ((revenue - totalCosts) / revenue) * 100 : 0
  const profit = revenue - totalCosts

  return {
    order,
    items: items || [],
    costs: costs || [],
    assignments: assignments || [],
    timeEntries: timeEntries || [],
    diaryEntries: diaryEntries || [],
    subAssignments: subAssignments || [],
    measurements: measurements || [],
    financials: {
      revenue: Math.round(revenue * 100) / 100,
      laborCost: Math.round(laborCost * 100) / 100,
      externalCosts: Math.round(externalCosts * 100) / 100,
      subCosts: Math.round(subCosts * 100) / 100,
      totalCosts: Math.round(totalCosts * 100) / 100,
      profit: Math.round(profit * 100) / 100,
      margin: Math.round(margin * 10) / 10,
    },
  }
}
