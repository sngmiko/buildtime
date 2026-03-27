'use server'

import { createClient } from '@/lib/supabase/server'
import {
  employeeDetailsSchema,
  qualificationSchema,
  briefingSchema,
  leaveRequestSchema,
  sickDaySchema,
} from '@/lib/validations/employee'

export type EmployeeState = {
  errors?: Record<string, string[]>
  message?: string
  success?: boolean
} | null

// ============================================================================
// EMPLOYEE DETAILS
// ============================================================================
export async function updateEmployeeDetails(
  employeeId: string,
  prevState: EmployeeState,
  formData: FormData
): Promise<EmployeeState> {
  const raw: Record<string, unknown> = {
    first_name: formData.get('first_name'),
    last_name: formData.get('last_name'),
    phone: formData.get('phone') || '',
    address: formData.get('address') || '',
    birth_date: formData.get('birth_date') || '',
    nationality: formData.get('nationality') || '',
    contract_start: formData.get('contract_start') || '',
    contract_type: formData.get('contract_type') || undefined,
    notice_period: formData.get('notice_period') || '',
    probation_end: formData.get('probation_end') || '',
    hourly_rate: formData.get('hourly_rate') || '',
    monthly_salary: formData.get('monthly_salary') || '',
    tax_class: formData.get('tax_class') || '',
    social_security_number: formData.get('social_security_number') || '',
    health_insurance: formData.get('health_insurance') || '',
    iban: formData.get('iban') || '',
    emergency_contact_name: formData.get('emergency_contact_name') || '',
    emergency_contact_phone: formData.get('emergency_contact_phone') || '',
    emergency_contact_relation: formData.get('emergency_contact_relation') || '',
    annual_leave_days: formData.get('annual_leave_days') || 30,
  }

  const validated = employeeDetailsSchema.safeParse(raw)
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { message: 'Nicht angemeldet' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['owner', 'foreman'].includes(profile.role)) {
    return { message: 'Keine Berechtigung' }
  }

  const updateData: Record<string, unknown> = { ...validated.data }
  // Convert empty strings to null for DB
  for (const key of Object.keys(updateData)) {
    if (updateData[key] === '') updateData[key] = null
  }

  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', employeeId)

  if (error) {
    return { message: 'Mitarbeiterdaten konnten nicht gespeichert werden' }
  }

  return { success: true, message: 'Mitarbeiterdaten gespeichert' }
}

// ============================================================================
// QUALIFICATIONS
// ============================================================================
export async function addQualification(
  employeeId: string,
  prevState: EmployeeState,
  formData: FormData
): Promise<EmployeeState> {
  const raw = {
    name: formData.get('name'),
    issued_date: formData.get('issued_date') || '',
    expiry_date: formData.get('expiry_date') || '',
    notes: formData.get('notes') || '',
  }

  const validated = qualificationSchema.safeParse(raw)
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { message: 'Nicht angemeldet' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single()

  if (!profile || !['owner', 'foreman'].includes(profile.role)) {
    return { message: 'Keine Berechtigung' }
  }

  const { error } = await supabase.from('qualifications').insert({
    company_id: profile.company_id,
    user_id: employeeId,
    name: validated.data.name,
    issued_date: validated.data.issued_date || null,
    expiry_date: validated.data.expiry_date || null,
    notes: validated.data.notes || null,
  })

  if (error) return { message: 'Qualifikation konnte nicht hinzugefügt werden' }
  return { success: true, message: 'Qualifikation hinzugefügt' }
}

export async function deleteQualification(qualId: string): Promise<EmployeeState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { message: 'Nicht angemeldet' }

  const { error } = await supabase.from('qualifications').delete().eq('id', qualId)
  if (error) return { message: 'Qualifikation konnte nicht gelöscht werden' }
  return { success: true }
}

// ============================================================================
// SAFETY BRIEFINGS
// ============================================================================
export async function addBriefing(
  employeeId: string,
  prevState: EmployeeState,
  formData: FormData
): Promise<EmployeeState> {
  const raw = {
    topic: formData.get('topic'),
    briefing_date: formData.get('briefing_date'),
    next_date: formData.get('next_date') || '',
    notes: formData.get('notes') || '',
  }

  const validated = briefingSchema.safeParse(raw)
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { message: 'Nicht angemeldet' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single()

  if (!profile || !['owner', 'foreman'].includes(profile.role)) {
    return { message: 'Keine Berechtigung' }
  }

  const { error } = await supabase.from('safety_briefings').insert({
    company_id: profile.company_id,
    user_id: employeeId,
    topic: validated.data.topic,
    briefing_date: validated.data.briefing_date,
    next_date: validated.data.next_date || null,
    notes: validated.data.notes || null,
  })

  if (error) return { message: 'Unterweisung konnte nicht hinzugefügt werden' }
  return { success: true, message: 'Unterweisung hinzugefügt' }
}

// ============================================================================
// LEAVE REQUESTS
// ============================================================================
export async function createLeaveRequest(
  prevState: EmployeeState,
  formData: FormData
): Promise<EmployeeState> {
  const raw = {
    start_date: formData.get('start_date'),
    end_date: formData.get('end_date'),
    days: formData.get('days'),
    type: formData.get('type') || 'vacation',
    notes: formData.get('notes') || '',
  }

  const validated = leaveRequestSchema.safeParse(raw)
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { message: 'Nicht angemeldet' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile) return { message: 'Profil nicht gefunden' }

  const { error } = await supabase.from('leave_requests').insert({
    company_id: profile.company_id,
    user_id: user.id,
    start_date: validated.data.start_date,
    end_date: validated.data.end_date,
    days: validated.data.days,
    type: validated.data.type,
    notes: validated.data.notes || null,
  })

  if (error) return { message: 'Urlaubsantrag konnte nicht erstellt werden' }
  return { success: true, message: 'Urlaubsantrag eingereicht' }
}

export async function approveLeaveRequest(
  requestId: string,
  approved: boolean
): Promise<EmployeeState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { message: 'Nicht angemeldet' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['owner', 'foreman'].includes(profile.role)) {
    return { message: 'Keine Berechtigung' }
  }

  const { error } = await supabase
    .from('leave_requests')
    .update({
      status: approved ? 'approved' : 'rejected',
      approved_by: user.id,
    })
    .eq('id', requestId)

  if (error) return { message: 'Antrag konnte nicht bearbeitet werden' }
  return { success: true, message: approved ? 'Antrag genehmigt' : 'Antrag abgelehnt' }
}

// ============================================================================
// SICK DAYS
// ============================================================================
export async function addSickDay(
  employeeId: string,
  prevState: EmployeeState,
  formData: FormData
): Promise<EmployeeState> {
  const raw = {
    start_date: formData.get('start_date'),
    end_date: formData.get('end_date'),
    days: formData.get('days'),
    has_certificate: formData.get('has_certificate') === 'on',
    notes: formData.get('notes') || '',
  }

  const validated = sickDaySchema.safeParse(raw)
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { message: 'Nicht angemeldet' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single()

  if (!profile || !['owner', 'foreman'].includes(profile.role)) {
    return { message: 'Keine Berechtigung' }
  }

  const { error } = await supabase.from('sick_days').insert({
    company_id: profile.company_id,
    user_id: employeeId,
    start_date: validated.data.start_date,
    end_date: validated.data.end_date,
    days: validated.data.days,
    has_certificate: validated.data.has_certificate || false,
    notes: validated.data.notes || null,
  })

  if (error) return { message: 'Krankheitstage konnten nicht erfasst werden' }
  return { success: true, message: 'Krankheitstage erfasst' }
}

// ============================================================================
// COST CALCULATOR
// ============================================================================
export async function calculateEmployeeCost(employeeId: string): Promise<{
  hourlyRate: number
  monthlyGross: number
  employerCosts: number
  totalMonthly: number
  effectiveHourlyRate: number
} | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: employee } = await supabase
    .from('profiles')
    .select('hourly_rate, monthly_salary, annual_leave_days')
    .eq('id', employeeId)
    .single()

  if (!employee) return null

  const monthlyGross = employee.monthly_salary || (employee.hourly_rate || 0) * 168
  // Approximate German employer costs: ~21% social security + ~1.5% other
  const employerCosts = monthlyGross * 0.225
  const totalMonthly = monthlyGross + employerCosts
  // Effective hourly rate: account for vacation + sick days (~35 lost days/year)
  const workingDaysPerYear = 260 - (employee.annual_leave_days || 30) - 10 // 10 avg sick days
  const workingHoursPerYear = workingDaysPerYear * 8
  const annualCost = totalMonthly * 12
  const effectiveHourlyRate = workingHoursPerYear > 0 ? annualCost / workingHoursPerYear : 0

  return {
    hourlyRate: employee.hourly_rate || 0,
    monthlyGross,
    employerCosts: Math.round(employerCosts * 100) / 100,
    totalMonthly: Math.round(totalMonthly * 100) / 100,
    effectiveHourlyRate: Math.round(effectiveHourlyRate * 100) / 100,
  }
}
