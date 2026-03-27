import { z } from 'zod'

export const customerSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(200),
  contact_person: z.string().max(200).optional().or(z.literal('')),
  email: z.string().email('Ungültige E-Mail').optional().or(z.literal('')),
  phone: z.string().max(50).optional().or(z.literal('')),
  address: z.string().max(500).optional().or(z.literal('')),
  notes: z.string().max(1000).optional().or(z.literal('')),
})

export const orderSchema = z.object({
  customer_id: z.string().uuid('Kunde ist erforderlich'),
  site_id: z.string().uuid().optional().or(z.literal('')),
  title: z.string().min(1, 'Titel ist erforderlich').max(300),
  description: z.string().max(2000).optional().or(z.literal('')),
  status: z.enum(['quote', 'commissioned', 'in_progress', 'acceptance', 'completed', 'complaint']).optional(),
  start_date: z.string().optional().or(z.literal('')),
  end_date: z.string().optional().or(z.literal('')),
  budget: z.coerce.number().min(0).optional().or(z.literal('')),
})

export const orderItemSchema = z.object({
  position: z.coerce.number().int().min(1),
  description: z.string().min(1, 'Beschreibung ist erforderlich').max(500),
  quantity: z.coerce.number().min(0.01, 'Menge muss größer als 0 sein'),
  unit: z.string().min(1).max(20),
  unit_price: z.coerce.number().min(0, 'Preis muss >= 0 sein'),
})

export const orderCostSchema = z.object({
  category: z.enum(['subcontractor', 'material', 'equipment', 'vehicle', 'other']),
  description: z.string().min(1, 'Beschreibung ist erforderlich').max(500),
  amount: z.coerce.number().min(0.01, 'Betrag muss größer als 0 sein'),
  date: z.string().min(1, 'Datum ist erforderlich'),
})
