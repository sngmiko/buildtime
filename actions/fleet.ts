'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { vehicleSchema, equipmentSchema, fuelLogSchema, tripLogSchema, equipmentCostSchema } from '@/lib/validations/fleet'

export type FleetState = {
  errors?: Record<string, string[]>
  message?: string
  success?: boolean
} | null

export async function createVehicle(prevState: FleetState, formData: FormData): Promise<FleetState> {
  const raw: Record<string, unknown> = {}
  for (const key of ['license_plate','make','model','year','type','mileage','status','leasing_cost','insurance_cost','tax_cost','next_inspection','acquisition_type','purchase_price','purchase_date','monthly_rate','contract_start','contract_end','down_payment','residual_value','interest_rate','loan_amount','rental_daily_rate']) {
    raw[key] = formData.get(key) || undefined
  }
  const validated = vehicleSchema.safeParse(raw)
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { message: 'Nicht angemeldet' }
  const { data: profile } = await supabase.from('profiles').select('company_id, role').eq('id', user.id).single()
  if (!profile || !['owner', 'foreman', 'super_admin'].includes(profile.role)) return { message: 'Keine Berechtigung' }

  const d: Record<string, unknown> = { company_id: profile.company_id, ...validated.data }
  for (const k of Object.keys(d)) { if (d[k] === '' || d[k] === undefined) d[k] = null }

  const { error } = await supabase.from('vehicles').insert(d)
  if (error) return { message: 'Fahrzeug konnte nicht erstellt werden' }
  redirect('/fuhrpark')
}

export async function updateVehicle(vehicleId: string, prevState: FleetState, formData: FormData): Promise<FleetState> {
  const raw: Record<string, unknown> = {}
  for (const key of ['license_plate','make','model','year','type','mileage','status','leasing_cost','insurance_cost','tax_cost','next_inspection','acquisition_type','purchase_price','purchase_date','monthly_rate','contract_start','contract_end','down_payment','residual_value','interest_rate','loan_amount','rental_daily_rate']) {
    raw[key] = formData.get(key) || undefined
  }
  const validated = vehicleSchema.safeParse(raw)
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { message: 'Nicht angemeldet' }

  const d: Record<string, unknown> = { ...validated.data }
  for (const k of Object.keys(d)) { if (d[k] === '' || d[k] === undefined) d[k] = null }

  const { error } = await supabase.from('vehicles').update(d).eq('id', vehicleId)
  if (error) return { message: 'Fahrzeug konnte nicht aktualisiert werden' }
  return { success: true, message: 'Fahrzeug aktualisiert' }
}

export async function createEquipment(prevState: FleetState, formData: FormData): Promise<FleetState> {
  const raw: Record<string, unknown> = {}
  for (const key of ['name','category','serial_number','purchase_date','purchase_price','daily_rate','status','next_maintenance','notes']) {
    raw[key] = formData.get(key) || undefined
  }
  const validated = equipmentSchema.safeParse(raw)
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { message: 'Nicht angemeldet' }
  const { data: profile } = await supabase.from('profiles').select('company_id, role').eq('id', user.id).single()
  if (!profile || !['owner', 'foreman', 'super_admin'].includes(profile.role)) return { message: 'Keine Berechtigung' }

  const d: Record<string, unknown> = { company_id: profile.company_id, ...validated.data }
  for (const k of Object.keys(d)) { if (d[k] === '' || d[k] === undefined) d[k] = null }

  const { error } = await supabase.from('equipment').insert(d)
  if (error) return { message: 'Gerät konnte nicht erstellt werden' }
  redirect('/fuhrpark?tab=equipment')
}

export async function updateEquipment(equipmentId: string, prevState: FleetState, formData: FormData): Promise<FleetState> {
  const raw: Record<string, unknown> = {}
  for (const key of ['name','category','serial_number','purchase_date','purchase_price','daily_rate','status','next_maintenance','notes']) {
    raw[key] = formData.get(key) || undefined
  }
  const validated = equipmentSchema.safeParse(raw)
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { message: 'Nicht angemeldet' }

  const d: Record<string, unknown> = { ...validated.data }
  for (const k of Object.keys(d)) { if (d[k] === '' || d[k] === undefined) d[k] = null }

  const { error } = await supabase.from('equipment').update(d).eq('id', equipmentId)
  if (error) return { message: 'Gerät konnte nicht aktualisiert werden' }
  return { success: true, message: 'Gerät aktualisiert' }
}

export async function addFuelLog(vehicleId: string, prevState: FleetState, formData: FormData): Promise<FleetState> {
  const raw = { date: formData.get('date'), liters: formData.get('liters'), cost: formData.get('cost'), mileage: formData.get('mileage') || undefined }
  const validated = fuelLogSchema.safeParse(raw)
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { message: 'Nicht angemeldet' }
  const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile) return { message: 'Profil nicht gefunden' }

  const { error } = await supabase.from('fuel_logs').insert({
    company_id: profile.company_id, vehicle_id: vehicleId, ...validated.data,
    mileage: validated.data.mileage || null,
  })
  if (error) return { message: 'Tankeintrag konnte nicht gespeichert werden' }

  // Update vehicle mileage if provided
  if (validated.data.mileage) {
    await supabase.from('vehicles').update({ mileage: validated.data.mileage }).eq('id', vehicleId)
  }
  return { success: true, message: 'Tankeintrag gespeichert' }
}

export async function addTripLog(vehicleId: string, prevState: FleetState, formData: FormData): Promise<FleetState> {
  const raw = { date: formData.get('date'), start_location: formData.get('start_location'), end_location: formData.get('end_location'), km: formData.get('km'), purpose: formData.get('purpose') }
  const validated = tripLogSchema.safeParse(raw)
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { message: 'Nicht angemeldet' }
  const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile) return { message: 'Profil nicht gefunden' }

  const { error } = await supabase.from('trip_logs').insert({
    company_id: profile.company_id, vehicle_id: vehicleId, driver_id: user.id, ...validated.data,
  })
  if (error) return { message: 'Fahrt konnte nicht gespeichert werden' }
  return { success: true, message: 'Fahrt gespeichert' }
}

export async function addEquipmentCost(equipmentId: string, prevState: FleetState, formData: FormData): Promise<FleetState> {
  const raw = { type: formData.get('type'), amount: formData.get('amount'), date: formData.get('date'), description: formData.get('description') || '' }
  const validated = equipmentCostSchema.safeParse(raw)
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { message: 'Nicht angemeldet' }
  const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile) return { message: 'Profil nicht gefunden' }

  const { error } = await supabase.from('equipment_costs').insert({
    company_id: profile.company_id, equipment_id: equipmentId, ...validated.data,
    description: validated.data.description || null,
  })
  if (error) return { message: 'Kosten konnten nicht gespeichert werden' }
  return { success: true, message: 'Kosten gespeichert' }
}
