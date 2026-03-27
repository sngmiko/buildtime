import { z } from 'zod'

export const vehicleSchema = z.object({
  license_plate: z.string().min(1, 'Kennzeichen ist erforderlich').max(20),
  make: z.string().min(1, 'Marke ist erforderlich').max(100),
  model: z.string().min(1, 'Modell ist erforderlich').max(100),
  year: z.coerce.number().int().min(1900).max(2100).optional(),
  type: z.enum(['car', 'van', 'truck']),
  mileage: z.coerce.number().int().min(0).optional(),
  status: z.enum(['available', 'in_use', 'maintenance', 'decommissioned']).optional(),
  leasing_cost: z.coerce.number().min(0).optional().or(z.literal('')),
  insurance_cost: z.coerce.number().min(0).optional().or(z.literal('')),
  tax_cost: z.coerce.number().min(0).optional().or(z.literal('')),
  next_inspection: z.string().optional().or(z.literal('')),
  acquisition_type: z.enum(['purchased', 'leased', 'financed', 'rented']).optional().default('purchased'),
  purchase_price: z.coerce.number().min(0).optional().or(z.literal('')),
  purchase_date: z.string().optional().or(z.literal('')),
  monthly_rate: z.coerce.number().min(0).optional().or(z.literal('')),
  contract_start: z.string().optional().or(z.literal('')),
  contract_end: z.string().optional().or(z.literal('')),
  down_payment: z.coerce.number().min(0).optional().or(z.literal('')),
  residual_value: z.coerce.number().min(0).optional().or(z.literal('')),
  interest_rate: z.coerce.number().min(0).max(100).optional().or(z.literal('')),
  loan_amount: z.coerce.number().min(0).optional().or(z.literal('')),
  rental_daily_rate: z.coerce.number().min(0).optional().or(z.literal('')),
})

export const equipmentSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(200),
  category: z.enum(['heavy', 'power_tool', 'tool', 'safety', 'other']),
  serial_number: z.string().max(100).optional().or(z.literal('')),
  purchase_date: z.string().optional().or(z.literal('')),
  purchase_price: z.coerce.number().min(0).optional().or(z.literal('')),
  daily_rate: z.coerce.number().min(0).optional().or(z.literal('')),
  status: z.enum(['available', 'in_use', 'maintenance', 'defect', 'disposed']).optional(),
  next_maintenance: z.string().optional().or(z.literal('')),
  notes: z.string().max(500).optional().or(z.literal('')),
})

export const fuelLogSchema = z.object({
  date: z.string().min(1, 'Datum ist erforderlich'),
  liters: z.coerce.number().min(0.1, 'Liter erforderlich'),
  cost: z.coerce.number().min(0, 'Kosten erforderlich'),
  mileage: z.coerce.number().int().min(0).optional(),
})

export const tripLogSchema = z.object({
  date: z.string().min(1, 'Datum ist erforderlich'),
  start_location: z.string().min(1, 'Startort ist erforderlich').max(200),
  end_location: z.string().min(1, 'Zielort ist erforderlich').max(200),
  km: z.coerce.number().min(0.1, 'Kilometer erforderlich'),
  purpose: z.string().min(1, 'Zweck ist erforderlich').max(200),
})

export const equipmentCostSchema = z.object({
  type: z.enum(['maintenance', 'repair', 'fuel', 'other']),
  amount: z.coerce.number().min(0.01, 'Betrag erforderlich'),
  date: z.string().min(1, 'Datum ist erforderlich'),
  description: z.string().max(500).optional().or(z.literal('')),
})
