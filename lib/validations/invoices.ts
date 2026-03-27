import { z } from 'zod'

export const invoiceSchema = z.object({
  customer_id: z.string().min(1, 'Kunde ist erforderlich'),
  order_id: z.string().optional().or(z.literal('')),
  invoice_date: z.string().min(1, 'Rechnungsdatum ist erforderlich'),
  due_date: z.string().optional().or(z.literal('')),
  tax_rate: z.coerce.number().min(0).max(100).default(19),
  notes: z.string().max(2000).optional().or(z.literal('')),
})

export const invoiceItemSchema = z.object({
  position: z.coerce.number().int().min(1),
  description: z.string().min(1, 'Beschreibung ist erforderlich'),
  quantity: z.coerce.number().min(0.01),
  unit: z.string().min(1).default('Stk'),
  unit_price: z.coerce.number().min(0),
})

export const scheduleSchema = z.object({
  user_id: z.string().min(1, 'Mitarbeiter ist erforderlich'),
  site_id: z.string().min(1, 'Baustelle ist erforderlich'),
  date: z.string().min(1, 'Datum ist erforderlich'),
  shift: z.enum(['full', 'morning', 'afternoon']).default('full'),
  notes: z.string().max(500).optional().or(z.literal('')),
})

export const measurementSchema = z.object({
  description: z.string().min(1, 'Beschreibung ist erforderlich'),
  length: z.coerce.number().min(0).optional().or(z.literal('')),
  width: z.coerce.number().min(0).optional().or(z.literal('')),
  height: z.coerce.number().min(0).optional().or(z.literal('')),
  quantity: z.coerce.number().min(0.01).default(1),
  unit: z.string().min(1).default('m2'),
  notes: z.string().max(500).optional().or(z.literal('')),
})
