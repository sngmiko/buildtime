'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { invoiceSchema, invoiceItemSchema } from '@/lib/validations/invoices'

export type InvoiceState = {
  errors?: Record<string, string[]>
  message?: string
  success?: boolean
} | null

export async function createInvoice(prevState: InvoiceState, formData: FormData): Promise<InvoiceState> {
  const raw = {
    customer_id: formData.get('customer_id'),
    order_id: formData.get('order_id') || '',
    invoice_date: formData.get('invoice_date'),
    due_date: formData.get('due_date') || '',
    tax_rate: formData.get('tax_rate') || '19',
    notes: formData.get('notes') || '',
  }

  const validated = invoiceSchema.safeParse(raw)
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { message: 'Nicht angemeldet' }

  const { data: profile } = await supabase.from('profiles').select('company_id, role').eq('id', user.id).single()
  if (!profile || !['owner', 'foreman', 'super_admin'].includes(profile.role)) return { message: 'Keine Berechtigung' }

  // Get next invoice number
  const { data: company } = await supabase.from('companies').select('invoice_prefix, next_invoice_number').eq('id', profile.company_id).single()
  const prefix = company?.invoice_prefix || 'RE'
  const num = company?.next_invoice_number || 1
  const invoiceNumber = `${prefix}-${String(num).padStart(5, '0')}`

  const paymentDays = 14
  const dueDate = validated.data.due_date || (() => {
    const d = new Date(validated.data.invoice_date)
    d.setDate(d.getDate() + paymentDays)
    return d.toISOString().split('T')[0]
  })()

  const { data: invoice, error } = await supabase.from('invoices').insert({
    company_id: profile.company_id,
    customer_id: validated.data.customer_id,
    order_id: validated.data.order_id || null,
    invoice_number: invoiceNumber,
    invoice_date: validated.data.invoice_date,
    due_date: dueDate,
    tax_rate: validated.data.tax_rate,
    notes: validated.data.notes || null,
  }).select('id').single()

  if (error || !invoice) return { message: 'Rechnung konnte nicht erstellt werden' }

  // Increment invoice number
  await supabase.from('companies').update({ next_invoice_number: num + 1 }).eq('id', profile.company_id)

  redirect(`/rechnungen/${invoice.id}`)
}

export async function createInvoiceFromOrder(orderId: string): Promise<InvoiceState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { message: 'Nicht angemeldet' }

  const { data: profile } = await supabase.from('profiles').select('company_id, role').eq('id', user.id).single()
  if (!profile || !['owner', 'foreman', 'super_admin'].includes(profile.role)) return { message: 'Keine Berechtigung' }

  // Get order with items and customer
  const { data: order } = await supabase.from('orders').select('*, customers(id)').eq('id', orderId).single()
  if (!order) return { message: 'Auftrag nicht gefunden' }

  const { data: items } = await supabase.from('order_items').select('*').eq('order_id', orderId).order('position')

  const { data: company } = await supabase.from('companies').select('invoice_prefix, next_invoice_number, default_tax_rate').eq('id', profile.company_id).single()
  const prefix = company?.invoice_prefix || 'RE'
  const num = company?.next_invoice_number || 1
  const invoiceNumber = `${prefix}-${String(num).padStart(5, '0')}`
  const taxRate = company?.default_tax_rate || 19

  const subtotal = (items || []).reduce((s: number, i: { quantity: number; unit_price: number }) => s + Number(i.quantity) * Number(i.unit_price), 0)
  const taxAmount = Math.round(subtotal * Number(taxRate) / 100 * 100) / 100
  const total = subtotal + taxAmount

  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 14)

  const { data: invoice, error } = await supabase.from('invoices').insert({
    company_id: profile.company_id,
    customer_id: (order.customers as { id: string }).id,
    order_id: orderId,
    invoice_number: invoiceNumber,
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: dueDate.toISOString().split('T')[0],
    tax_rate: taxRate,
    subtotal,
    tax_amount: taxAmount,
    total,
  }).select('id').single()

  if (error || !invoice) return { message: 'Rechnung konnte nicht erstellt werden' }

  // Copy order items to invoice items
  for (const item of items || []) {
    await supabase.from('invoice_items').insert({
      invoice_id: invoice.id,
      position: item.position,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit || 'Stk',
      unit_price: item.unit_price,
      total: Number(item.quantity) * Number(item.unit_price),
    })
  }

  await supabase.from('companies').update({ next_invoice_number: num + 1 }).eq('id', profile.company_id)

  redirect(`/rechnungen/${invoice.id}`)
}

export async function updateInvoiceStatus(invoiceId: string, status: string, paidAmount?: number): Promise<InvoiceState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { message: 'Nicht angemeldet' }

  const update: Record<string, unknown> = { status }
  if (status === 'paid') {
    update.paid_date = new Date().toISOString().split('T')[0]
    if (paidAmount !== undefined) update.paid_amount = paidAmount
  }

  const { error } = await supabase.from('invoices').update(update).eq('id', invoiceId)
  if (error) return { message: 'Status konnte nicht aktualisiert werden' }
  return { success: true, message: 'Status aktualisiert' }
}

export async function createPaymentReminder(invoiceId: string): Promise<InvoiceState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { message: 'Nicht angemeldet' }

  const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile) return { message: 'Profil nicht gefunden' }

  const { data: invoice } = await supabase.from('invoices').select('total, paid_amount').eq('id', invoiceId).single()
  if (!invoice) return { message: 'Rechnung nicht gefunden' }

  const { data: existing } = await supabase.from('payment_reminders').select('reminder_level').eq('invoice_id', invoiceId).order('reminder_level', { ascending: false }).limit(1)
  const nextLevel = ((existing || [])[0]?.reminder_level || 0) + 1
  const fees = [0, 0, 5, 10, 25]
  const fee = fees[Math.min(nextLevel, fees.length - 1)]

  await supabase.from('payment_reminders').insert({
    company_id: profile.company_id,
    invoice_id: invoiceId,
    reminder_level: nextLevel,
    due_amount: Number(invoice.total) - Number(invoice.paid_amount || 0),
    fee,
  })

  await supabase.from('invoices').update({ status: 'overdue' }).eq('id', invoiceId)

  return { success: true, message: `${nextLevel}. Mahnung erstellt` }
}
