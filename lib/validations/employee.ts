import { z } from 'zod'

export const employeeDetailsSchema = z.object({
  first_name: z.string().min(1, 'Vorname ist erforderlich').max(100),
  last_name: z.string().min(1, 'Nachname ist erforderlich').max(100),
  phone: z.string().max(30).optional().or(z.literal('')),
  address: z.string().max(500).optional().or(z.literal('')),
  birth_date: z.string().optional().or(z.literal('')),
  nationality: z.string().max(100).optional().or(z.literal('')),
  contract_start: z.string().optional().or(z.literal('')),
  contract_type: z.enum(['permanent', 'temporary', 'minijob', 'intern']).optional(),
  notice_period: z.string().max(100).optional().or(z.literal('')),
  probation_end: z.string().optional().or(z.literal('')),
  hourly_rate: z.coerce.number().min(0).optional().or(z.literal('')),
  monthly_salary: z.coerce.number().min(0).optional().or(z.literal('')),
  tax_class: z.string().max(10).optional().or(z.literal('')),
  social_security_number: z.string().max(30).optional().or(z.literal('')),
  health_insurance: z.string().max(100).optional().or(z.literal('')),
  iban: z.string().max(34).optional().or(z.literal('')),
  emergency_contact_name: z.string().max(100).optional().or(z.literal('')),
  emergency_contact_phone: z.string().max(30).optional().or(z.literal('')),
  emergency_contact_relation: z.string().max(50).optional().or(z.literal('')),
  annual_leave_days: z.coerce.number().int().min(0).max(365).optional(),
})

export const qualificationSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(200),
  issued_date: z.string().optional().or(z.literal('')),
  expiry_date: z.string().optional().or(z.literal('')),
  notes: z.string().max(500).optional().or(z.literal('')),
})

export const briefingSchema = z.object({
  topic: z.string().min(1, 'Thema ist erforderlich').max(200),
  briefing_date: z.string().min(1, 'Datum ist erforderlich'),
  next_date: z.string().optional().or(z.literal('')),
  notes: z.string().max(500).optional().or(z.literal('')),
})

export const leaveRequestSchema = z.object({
  start_date: z.string().min(1, 'Startdatum ist erforderlich'),
  end_date: z.string().min(1, 'Enddatum ist erforderlich'),
  days: z.coerce.number().int().min(1, 'Mindestens 1 Tag'),
  type: z.enum(['vacation', 'sick', 'unpaid', 'special']),
  notes: z.string().max(500).optional().or(z.literal('')),
})

export const sickDaySchema = z.object({
  start_date: z.string().min(1, 'Startdatum ist erforderlich'),
  end_date: z.string().min(1, 'Enddatum ist erforderlich'),
  days: z.coerce.number().int().min(1),
  has_certificate: z.coerce.boolean().optional(),
  notes: z.string().max(500).optional().or(z.literal('')),
})

export type EmployeeDetailsInput = z.infer<typeof employeeDetailsSchema>
export type QualificationInput = z.infer<typeof qualificationSchema>
export type BriefingInput = z.infer<typeof briefingSchema>
export type LeaveRequestInput = z.infer<typeof leaveRequestSchema>
export type SickDayInput = z.infer<typeof sickDaySchema>
