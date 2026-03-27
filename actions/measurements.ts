'use server'

import { createClient } from '@/lib/supabase/server'
import { measurementSchema } from '@/lib/validations/invoices'

export type MeasurementState = {
  errors?: Record<string, string[]>
  message?: string
  success?: boolean
} | null

export async function createMeasurement(
  orderId: string,
  prevState: MeasurementState,
  formData: FormData
): Promise<MeasurementState> {
  const raw = {
    description: formData.get('description'),
    length: formData.get('length') || '',
    width: formData.get('width') || '',
    height: formData.get('height') || '',
    quantity: formData.get('quantity') || '1',
    unit: formData.get('unit') || 'm2',
    notes: formData.get('notes') || '',
  }

  const validated = measurementSchema.safeParse(raw)
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { message: 'Nicht angemeldet' }

  const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile) return { message: 'Profil nicht gefunden' }

  // Get order's site
  const { data: order } = await supabase.from('orders').select('site_id').eq('id', orderId).single()

  // Calculate value
  const l = validated.data.length || 1
  const w = validated.data.width || 1
  const h = validated.data.height || 1
  let calculated = validated.data.quantity
  if (validated.data.unit === 'm2') calculated = (l as number) * (w as number) * validated.data.quantity
  if (validated.data.unit === 'm3') calculated = (l as number) * (w as number) * (h as number) * validated.data.quantity

  const { error } = await supabase.from('measurements').insert({
    company_id: profile.company_id,
    order_id: orderId,
    site_id: order?.site_id || null,
    description: validated.data.description,
    length: validated.data.length || null,
    width: validated.data.width || null,
    height: validated.data.height || null,
    quantity: validated.data.quantity,
    unit: validated.data.unit,
    calculated_value: calculated,
    notes: validated.data.notes || null,
    measured_by: user.id,
  })

  if (error) return { message: 'Aufmaß konnte nicht gespeichert werden' }
  return { success: true, message: 'Aufmaß gespeichert' }
}
