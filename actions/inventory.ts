'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { supplierSchema, materialSchema, orderSchema, stockMovementSchema } from '@/lib/validations/inventory'

export type InventoryState = {
  errors?: Record<string, string[]>
  message?: string
  success?: boolean
} | null

// ─── Suppliers ────────────────────────────────────────────────────────────────

export async function createSupplier(prevState: InventoryState, formData: FormData): Promise<InventoryState> {
  const raw: Record<string, unknown> = {}
  for (const key of ['name', 'contact_person', 'email', 'phone', 'address', 'rating', 'notes']) {
    raw[key] = formData.get(key) || undefined
  }
  const validated = supplierSchema.safeParse(raw)
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { message: 'Nicht angemeldet' }
  const { data: profile } = await supabase.from('profiles').select('company_id, role').eq('id', user.id).single()
  if (!profile || !['owner', 'foreman'].includes(profile.role)) return { message: 'Keine Berechtigung' }

  const d: Record<string, unknown> = { company_id: profile.company_id, ...validated.data }
  for (const k of Object.keys(d)) { if (d[k] === '' || d[k] === undefined) d[k] = null }

  const { error } = await supabase.from('suppliers').insert(d)
  if (error) return { message: 'Lieferant konnte nicht erstellt werden' }
  redirect('/lager?tab=lieferanten')
}

export async function updateSupplier(supplierId: string, prevState: InventoryState, formData: FormData): Promise<InventoryState> {
  const raw: Record<string, unknown> = {}
  for (const key of ['name', 'contact_person', 'email', 'phone', 'address', 'rating', 'notes']) {
    raw[key] = formData.get(key) || undefined
  }
  const validated = supplierSchema.safeParse(raw)
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { message: 'Nicht angemeldet' }

  const d: Record<string, unknown> = { ...validated.data }
  for (const k of Object.keys(d)) { if (d[k] === '' || d[k] === undefined) d[k] = null }

  const { error } = await supabase.from('suppliers').update(d).eq('id', supplierId)
  if (error) return { message: 'Lieferant konnte nicht aktualisiert werden' }
  return { success: true, message: 'Lieferant aktualisiert' }
}

// ─── Materials ────────────────────────────────────────────────────────────────

export async function createMaterial(prevState: InventoryState, formData: FormData): Promise<InventoryState> {
  const raw: Record<string, unknown> = {}
  for (const key of ['name', 'article_number', 'unit', 'price_per_unit', 'supplier_id', 'min_stock', 'current_stock', 'category']) {
    raw[key] = formData.get(key) || undefined
  }
  const validated = materialSchema.safeParse(raw)
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { message: 'Nicht angemeldet' }
  const { data: profile } = await supabase.from('profiles').select('company_id, role').eq('id', user.id).single()
  if (!profile || !['owner', 'foreman'].includes(profile.role)) return { message: 'Keine Berechtigung' }

  const d: Record<string, unknown> = { company_id: profile.company_id, ...validated.data }
  for (const k of Object.keys(d)) { if (d[k] === '' || d[k] === undefined) d[k] = null }

  const { error } = await supabase.from('materials').insert(d)
  if (error) return { message: 'Material konnte nicht erstellt werden' }
  redirect('/lager')
}

export async function updateMaterial(materialId: string, prevState: InventoryState, formData: FormData): Promise<InventoryState> {
  const raw: Record<string, unknown> = {}
  for (const key of ['name', 'article_number', 'unit', 'price_per_unit', 'supplier_id', 'min_stock', 'current_stock', 'category']) {
    raw[key] = formData.get(key) || undefined
  }
  const validated = materialSchema.safeParse(raw)
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { message: 'Nicht angemeldet' }

  const d: Record<string, unknown> = { ...validated.data }
  for (const k of Object.keys(d)) { if (d[k] === '' || d[k] === undefined) d[k] = null }

  const { error } = await supabase.from('materials').update(d).eq('id', materialId)
  if (error) return { message: 'Material konnte nicht aktualisiert werden' }
  return { success: true, message: 'Material aktualisiert' }
}

// ─── Purchase Orders ──────────────────────────────────────────────────────────

export async function createOrder(prevState: InventoryState, formData: FormData): Promise<InventoryState> {
  const raw: Record<string, unknown> = {}
  for (const key of ['supplier_id', 'order_date', 'status', 'total_amount', 'notes']) {
    raw[key] = formData.get(key) || undefined
  }
  const validated = orderSchema.safeParse(raw)
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { message: 'Nicht angemeldet' }
  const { data: profile } = await supabase.from('profiles').select('company_id, role').eq('id', user.id).single()
  if (!profile || !['owner', 'foreman'].includes(profile.role)) return { message: 'Keine Berechtigung' }

  const d: Record<string, unknown> = {
    company_id: profile.company_id,
    status: 'draft',
    ...validated.data,
  }
  for (const k of Object.keys(d)) { if (d[k] === '' || d[k] === undefined) d[k] = null }

  const { error } = await supabase.from('purchase_orders').insert(d)
  if (error) return { message: 'Bestellung konnte nicht erstellt werden' }
  redirect('/lager?tab=bestellungen')
}

export async function updateOrderStatus(orderId: string, status: string): Promise<InventoryState> {
  const validStatuses = ['draft', 'ordered', 'partially_delivered', 'delivered', 'cancelled']
  if (!validStatuses.includes(status)) return { message: 'Ungültiger Status' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { message: 'Nicht angemeldet' }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['owner', 'foreman'].includes(profile.role)) return { message: 'Keine Berechtigung' }

  const { error } = await supabase.from('purchase_orders').update({ status }).eq('id', orderId)
  if (error) return { message: 'Status konnte nicht aktualisiert werden' }
  return { success: true, message: 'Status aktualisiert' }
}

// ─── Stock Movements ──────────────────────────────────────────────────────────

export async function addStockMovement(prevState: InventoryState, formData: FormData): Promise<InventoryState> {
  const raw: Record<string, unknown> = {}
  for (const key of ['material_id', 'site_id', 'type', 'quantity', 'notes']) {
    raw[key] = formData.get(key) || undefined
  }
  const validated = stockMovementSchema.safeParse(raw)
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { message: 'Nicht angemeldet' }
  const { data: profile } = await supabase.from('profiles').select('company_id, role').eq('id', user.id).single()
  if (!profile || !['owner', 'foreman'].includes(profile.role)) return { message: 'Keine Berechtigung' }

  const d: Record<string, unknown> = {
    company_id: profile.company_id,
    created_by: user.id,
    ...validated.data,
    site_id: validated.data.site_id || null,
    notes: validated.data.notes || null,
  }

  const { error } = await supabase.from('stock_movements').insert(d)
  if (error) return { message: 'Lagerbewegung konnte nicht gespeichert werden' }

  // Auto-update current_stock
  const { data: material } = await supabase
    .from('materials')
    .select('current_stock')
    .eq('id', validated.data.material_id)
    .single()

  if (material) {
    const delta = validated.data.type === 'in' || validated.data.type === 'return'
      ? validated.data.quantity
      : -validated.data.quantity
    const newStock = Math.max(0, (material.current_stock || 0) + delta)
    await supabase.from('materials').update({ current_stock: newStock }).eq('id', validated.data.material_id)
  }

  return { success: true, message: 'Lagerbewegung gespeichert' }
}
