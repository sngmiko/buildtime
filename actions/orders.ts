'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { customerSchema, orderSchema, orderItemSchema, orderCostSchema } from '@/lib/validations/orders'
import type { OrderStatus } from '@/lib/types'

export type OrdersState = {
  errors?: Record<string, string[]>
  message?: string
  success?: boolean
} | null

// ─── Auth helper ──────────────────────────────────────────────────────────────

async function getAuthProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, profile: null }
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single()
  return { supabase, user, profile }
}

// ─── Customers ────────────────────────────────────────────────────────────────

export async function createCustomer(prevState: OrdersState, formData: FormData): Promise<OrdersState> {
  const raw: Record<string, unknown> = {}
  for (const key of ['name', 'contact_person', 'email', 'phone', 'address', 'notes']) {
    raw[key] = formData.get(key) || undefined
  }
  const validated = customerSchema.safeParse(raw)
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors }

  const { supabase, profile } = await getAuthProfile()
  if (!profile || !['owner', 'foreman', 'super_admin'].includes(profile.role)) return { message: 'Keine Berechtigung' }

  const d: Record<string, unknown> = { company_id: profile.company_id, ...validated.data }
  for (const k of Object.keys(d)) { if (d[k] === '' || d[k] === undefined) d[k] = null }

  const { error } = await supabase.from('customers').insert(d)
  if (error) return { message: 'Kunde konnte nicht erstellt werden' }
  return { success: true, message: 'Kunde erstellt' }
}

export async function updateCustomer(customerId: string, prevState: OrdersState, formData: FormData): Promise<OrdersState> {
  const raw: Record<string, unknown> = {}
  for (const key of ['name', 'contact_person', 'email', 'phone', 'address', 'notes']) {
    raw[key] = formData.get(key) || undefined
  }
  const validated = customerSchema.safeParse(raw)
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors }

  const { supabase, profile } = await getAuthProfile()
  if (!profile || !['owner', 'foreman', 'super_admin'].includes(profile.role)) return { message: 'Keine Berechtigung' }

  const d: Record<string, unknown> = { ...validated.data }
  for (const k of Object.keys(d)) { if (d[k] === '' || d[k] === undefined) d[k] = null }

  const { error } = await supabase.from('customers').update(d).eq('id', customerId)
  if (error) return { message: 'Kunde konnte nicht aktualisiert werden' }
  return { success: true, message: 'Kunde aktualisiert' }
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function createOrder(prevState: OrdersState, formData: FormData): Promise<OrdersState> {
  const raw: Record<string, unknown> = {}
  for (const key of ['customer_id', 'site_id', 'title', 'description', 'status', 'start_date', 'end_date', 'budget']) {
    raw[key] = formData.get(key) || undefined
  }
  const validated = orderSchema.safeParse(raw)
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors }

  const { supabase, profile } = await getAuthProfile()
  if (!profile || !['owner', 'foreman', 'super_admin'].includes(profile.role)) return { message: 'Keine Berechtigung' }

  const d: Record<string, unknown> = { company_id: profile.company_id, ...validated.data }
  for (const k of Object.keys(d)) { if (d[k] === '' || d[k] === undefined) d[k] = null }

  const { data: order, error } = await supabase.from('orders').insert(d).select('id').single()
  if (error) return { message: 'Auftrag konnte nicht erstellt werden' }
  redirect(`/auftraege/${order.id}`)
}

export async function updateOrder(orderId: string, prevState: OrdersState, formData: FormData): Promise<OrdersState> {
  const raw: Record<string, unknown> = {}
  for (const key of ['customer_id', 'site_id', 'title', 'description', 'status', 'start_date', 'end_date', 'budget']) {
    raw[key] = formData.get(key) || undefined
  }
  const validated = orderSchema.safeParse(raw)
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors }

  const { supabase, profile } = await getAuthProfile()
  if (!profile || !['owner', 'foreman', 'super_admin'].includes(profile.role)) return { message: 'Keine Berechtigung' }

  const d: Record<string, unknown> = { ...validated.data }
  for (const k of Object.keys(d)) { if (d[k] === '' || d[k] === undefined) d[k] = null }

  const { error } = await supabase.from('orders').update(d).eq('id', orderId)
  if (error) return { message: 'Auftrag konnte nicht aktualisiert werden' }
  return { success: true, message: 'Auftrag aktualisiert' }
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<OrdersState> {
  const { supabase, profile } = await getAuthProfile()
  if (!profile || !['owner', 'foreman', 'super_admin'].includes(profile.role)) return { message: 'Keine Berechtigung' }

  const { error } = await supabase.from('orders').update({ status }).eq('id', orderId)
  if (error) return { message: 'Status konnte nicht aktualisiert werden' }
  return { success: true, message: 'Status aktualisiert' }
}

// ─── Order Items ──────────────────────────────────────────────────────────────

export async function addOrderItem(orderId: string, prevState: OrdersState, formData: FormData): Promise<OrdersState> {
  const raw: Record<string, unknown> = {}
  for (const key of ['position', 'description', 'quantity', 'unit', 'unit_price']) {
    raw[key] = formData.get(key) || undefined
  }
  const validated = orderItemSchema.safeParse(raw)
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors }

  const { supabase, profile } = await getAuthProfile()
  if (!profile || !['owner', 'foreman', 'super_admin'].includes(profile.role)) return { message: 'Keine Berechtigung' }

  const { error } = await supabase.from('order_items').insert({ order_id: orderId, ...validated.data })
  if (error) return { message: 'Position konnte nicht hinzugefügt werden' }
  return { success: true, message: 'Position hinzugefügt' }
}

export async function deleteOrderItem(itemId: string): Promise<OrdersState> {
  const { supabase, profile } = await getAuthProfile()
  if (!profile || !['owner', 'foreman', 'super_admin'].includes(profile.role)) return { message: 'Keine Berechtigung' }

  const { error } = await supabase.from('order_items').delete().eq('id', itemId)
  if (error) return { message: 'Position konnte nicht gelöscht werden' }
  return { success: true }
}

// ─── Order Costs ──────────────────────────────────────────────────────────────

export async function addOrderCost(orderId: string, prevState: OrdersState, formData: FormData): Promise<OrdersState> {
  const raw: Record<string, unknown> = {}
  for (const key of ['category', 'description', 'amount', 'date']) {
    raw[key] = formData.get(key) || undefined
  }
  const validated = orderCostSchema.safeParse(raw)
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors }

  const { supabase, profile } = await getAuthProfile()
  if (!profile || !['owner', 'foreman', 'super_admin'].includes(profile.role)) return { message: 'Keine Berechtigung' }

  const { error } = await supabase
    .from('order_costs')
    .insert({ order_id: orderId, company_id: profile.company_id, ...validated.data })
  if (error) return { message: 'Kosten konnten nicht hinzugefügt werden' }
  return { success: true, message: 'Kosten hinzugefügt' }
}

// ─── Profitability ────────────────────────────────────────────────────────────

export type ProfitabilityData = {
  revenue: number
  laborCost: number
  externalCosts: number
  totalCost: number
  margin: number
  marginPercent: number
  budget: number | null
  budgetUsedPercent: number | null
}

export async function calculateOrderProfitability(orderId: string): Promise<ProfitabilityData | null> {
  const { supabase, profile } = await getAuthProfile()
  if (!profile) return null

  const [
    { data: order },
    { data: items },
    { data: costs },
    { data: assignments },
  ] = await Promise.all([
    supabase.from('orders').select('budget, company_id').eq('id', orderId).single(),
    supabase.from('order_items').select('quantity, unit_price').eq('order_id', orderId),
    supabase.from('order_costs').select('amount').eq('order_id', orderId),
    supabase.from('order_assignments')
      .select('resource_id, resource_type')
      .eq('order_id', orderId)
      .eq('resource_type', 'employee'),
  ])

  if (!order) return null

  // Revenue from line items
  const revenue = (items || []).reduce((sum, i) => sum + i.quantity * i.unit_price, 0)

  // External costs
  const externalCosts = (costs || []).reduce((sum, c) => sum + c.amount, 0)

  // Labor costs from time_entries for assigned employees
  const employeeIds = (assignments || []).map(a => a.resource_id)
  let laborCost = 0

  if (employeeIds.length > 0) {
    // Get hourly rates for employees
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, hourly_rate')
      .in('id', employeeIds)

    if (profiles) {
      const rateMap = new Map(profiles.map(p => [p.id, p.hourly_rate ?? 0]))

      // Get time entries linked to this order's site (approximation: all entries from assigned employees)
      const { data: timeEntries } = await supabase
        .from('time_entries')
        .select('user_id, clock_in, clock_out, break_minutes')
        .in('user_id', employeeIds)
        .not('clock_out', 'is', null)

      for (const entry of timeEntries || []) {
        const hours = (new Date(entry.clock_out).getTime() - new Date(entry.clock_in).getTime()) / 3600000
        const netHours = Math.max(0, hours - (entry.break_minutes || 0) / 60)
        const rate = rateMap.get(entry.user_id) ?? 0
        laborCost += netHours * rate
      }
    }
  }

  const totalCost = laborCost + externalCosts
  const margin = revenue - totalCost
  const marginPercent = revenue > 0 ? (margin / revenue) * 100 : 0
  const budgetUsedPercent = order.budget ? (totalCost / order.budget) * 100 : null

  return {
    revenue,
    laborCost,
    externalCosts,
    totalCost,
    margin,
    marginPercent,
    budget: order.budget,
    budgetUsedPercent,
  }
}
